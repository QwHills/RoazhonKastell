import { NextResponse } from "next/server";
import { getCurrentUser, canManageMembers } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_PASSWORD = process.env.PARTNER_DEFAULT_PASSWORD || "Roazhonkastell35";

export async function POST(request: Request) {
  const profile = await getCurrentUser();
  if (!profile || !canManageMembers(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { partnerId, email, firstName, lastName } = await request.json();
  if (!partnerId || !email) {
    return NextResponse.json({ error: "partnerId et email requis" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  // Chercher si le user auth existe
  const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: adminHeaders,
  });
  const listData = await listRes.json();
  const users = listData?.users || [];
  const existing = users.find((u: { email: string }) => u.email === email.toLowerCase());

  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        email: email.toLowerCase(),
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: firstName || "", last_name: lastName || "" },
      }),
    });
    const created = await createRes.json();
    if (!created.id) {
      return NextResponse.json(
        { error: created.msg || created.message || "Erreur création compte" },
        { status: 500 },
      );
    }
    userId = created.id;
  }

  const supabase = await createClient();

  // Profil : ajouter le rôle partenaire
  const { data: profData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profData) {
    const currentRoles: string[] = profData.roles || [];
    const newRoles = currentRoles.includes("partenaire")
      ? currentRoles
      : [...currentRoles, "partenaire"];
    await supabase.from("profiles").update({ roles: newRoles }).eq("id", userId);
  } else {
    await supabase.from("profiles").insert({
      id: userId,
      email: email.toLowerCase(),
      first_name: firstName || "",
      last_name: lastName || "",
      roles: ["partenaire"],
      member_status: "actif",
    });
  }

  // Lier au partenaire
  const { data: existingLink } = await supabase
    .from("partner_members")
    .select("partner_id")
    .eq("partner_id", partnerId)
    .eq("user_id", userId)
    .single();

  if (!existingLink) {
    await supabase
      .from("partner_members")
      .insert({ partner_id: partnerId, user_id: userId });
  }

  return NextResponse.json({ ok: true, userId, email: email.toLowerCase() });
}
