import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/supabase/auth";
import { getAdminClient } from "@/lib/mardi";

export async function GET() {
  const profile = await getCurrentUser();
  if (!profile || !isAdmin(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const adminDb = getAdminClient();
  const [authRes, { data: allProfiles }, { data: partnerMembers }, { data: partners }] = await Promise.all([
    fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=500`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      next: { revalidate: 300 },
    }),
    adminDb
      .from("profiles")
      .select("id, first_name, last_name, email, roles, member_status")
      .eq("member_status", "actif")
      .not("email", "like", "%@roazhonkastell.test"),
    adminDb
      .from("partner_members")
      .select("user_id, partner_id"),
    adminDb
      .from("partners")
      .select("id, name, description, logo_url, status"),
  ]);

  const authData = await authRes.json();
  const authUsers = authData?.users || authData || [];
  const signInMap = new Map<string, boolean>();
  for (const u of authUsers) {
    if (u.email) signInMap.set(u.email, !!u.last_sign_in_at);
  }

  const partnerMemberMap = new Map((partnerMembers || []).map((pm: { user_id: string; partner_id: string }) => [pm.user_id, pm.partner_id]));
  const partnerMap = new Map((partners || []).map((p: { id: string; name: string; description: string | null; status: string }) => [p.id, p]));

  type Entry = { name: string; email: string; connected: boolean };
  const adhConnected: Entry[] = [];
  const adhNotConnected: Entry[] = [];
  const partConnected: Entry[] = [];
  const partNotConnected: Entry[] = [];
  const partFicheComplete: Entry[] = [];
  const partFicheIncomplete: Entry[] = [];

  for (const p of allProfiles || []) {
    const roles = (p.roles as string[]) || [];
    const name = `${p.first_name} ${p.last_name}`.trim();
    const email = p.email as string;
    const connected = signInMap.get(email) ?? false;
    const entry = { name, email, connected };

    if (roles.includes("partenaire")) {
      if (connected) partConnected.push(entry);
      else partNotConnected.push(entry);
      const partnerId = partnerMemberMap.get(p.id);
      if (partnerId) {
        const partner = partnerMap.get(partnerId);
        if (partner && partner.name && partner.description && partner.status !== "brouillon") {
          partFicheComplete.push(entry);
        } else {
          partFicheIncomplete.push(entry);
        }
      } else {
        partFicheIncomplete.push(entry);
      }
    } else {
      if (connected) adhConnected.push(entry);
      else adhNotConnected.push(entry);
    }
  }

  return NextResponse.json({
    adherents: { connected: adhConnected, notConnected: adhNotConnected },
    partenaires: { connected: partConnected, notConnected: partNotConnected, ficheComplete: partFicheComplete, ficheIncomplete: partFicheIncomplete },
  });
}
