import { redirect } from "next/navigation";
import { getCurrentUser, hasAnyRole, isAdmin } from "@/lib/supabase/auth";
import { getAdminClient } from "@/lib/mardi";
import ReussitesClient from "./ReussitesClient";

export default async function ReussitesPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");
  if (!hasAnyRole(profile, ["adherent", "admin"])) redirect("/espace");

  const supabase = getAdminClient();

  const [
    { data: allSuccesses },
    { data: myParticipations },
    { data: myFinancials },
    { data: profiles },
    { data: partnersList },
  ] = await Promise.all([
    supabase
      .from("successes")
      .select(`
        id, type, title, story, origin, stage, stage_date, photo_url, status, featured, admin_note, declared_by, created_at, updated_at,
        success_participants (id, user_id, partner_id, role, confirmation_status, confirmation_note, publish_consent, anonymized_consent, confirmed_at)
      `)
      .in("status", ["brouillon", "soumis", "confirme", "publie", "refuse"])
      .order("created_at", { ascending: false }),
    supabase
      .from("success_participants")
      .select("success_id, confirmation_status, role")
      .eq("user_id", profile.id),
    supabase
      .from("success_financials")
      .select("success_id, total_fees, share_percent, calculated_amount, actual_amount, encashment_date")
      .eq("user_id", profile.id),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, photo_url")
      .eq("member_status", "actif")
      .not("first_name", "is", null),
    supabase
      .from("partners")
      .select("id, company_name"),
  ]);

  const profileMap: Record<string, { first_name: string; last_name: string; photo_url: string | null }> = {};
  for (const p of profiles || []) profileMap[p.id] = p;

  const partnerMap: Record<string, string> = {};
  for (const p of partnersList || []) partnerMap[p.id] = p.company_name;

  const myParticipationSet = new Set(
    (myParticipations || []).map((p) => p.success_id),
  );

  const financialMap: Record<string, {
    total_fees: number | null;
    share_percent: number;
    calculated_amount: number | null;
    actual_amount: number | null;
    encashment_date: string | null;
  }> = {};
  for (const f of myFinancials || []) financialMap[f.success_id] = f;

  const admin = isAdmin(profile);

  const successes = (allSuccesses || []).filter((s) => {
    if (s.declared_by === profile.id) return true;
    if (myParticipationSet.has(s.id)) return true;
    if (admin) return true;
    if (s.status === "soumis" || s.status === "confirme" || s.status === "publie") return true;
    return false;
  });

  return (
    <ReussitesClient
      successes={successes}
      profileMap={profileMap}
      partnerMap={partnerMap}
      financialMap={financialMap}
      userId={profile.id}
      isAdmin={admin}
      myParticipationIds={[...myParticipationSet]}
    />
  );
}
