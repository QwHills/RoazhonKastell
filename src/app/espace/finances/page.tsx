import { redirect } from "next/navigation";
import { getCurrentUser, canViewFinances } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import FinancesClient from "./FinancesClient";

export const dynamic = "force-dynamic";

export default async function FinancesPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");
  if (!canViewFinances(profile)) redirect("/espace");

  const supabase = await createClient();

  const [{ data: entries }, { data: cotisationMembers }, { data: cotisationPartners }] =
    await Promise.all([
      supabase
        .from("financial_entries")
        .select("*, profiles!financial_entries_related_profile_id_fkey(first_name, last_name)")
        .order("due_date", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, email, cotisation_mensuelle, date_adhesion, jour_prelevement")
        .eq("member_status", "actif")
        .gt("cotisation_mensuelle", 0),
      supabase
        .from("partners")
        .select("id, name, cotisation_montant, cotisation_frequence, cotisation_debut, jour_prelevement")
        .gt("cotisation_montant", 0),
    ]);

  return (
    <FinancesClient
      entries={entries || []}
      userId={profile.id}
      cotisationMembers={cotisationMembers || []}
      cotisationPartners={cotisationPartners || []}
    />
  );
}
