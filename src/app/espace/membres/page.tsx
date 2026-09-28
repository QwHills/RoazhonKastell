import { redirect } from "next/navigation";
import { getCurrentUser, canManageMembers } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import MembresClient from "./MembresClient";

export const dynamic = "force-dynamic";

export default async function MembresPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");
  if (!canManageMembers(profile)) redirect("/espace");

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true });

  const { data: partnerLinks } = await supabase
    .from("partner_members")
    .select("user_id, partners(name)");

  const partnerNames: Record<string, string> = {};
  if (partnerLinks) {
    for (const link of partnerLinks) {
      const p = link.partners as unknown as { name: string } | null;
      if (p?.name) partnerNames[link.user_id] = p.name;
    }
  }

  return <MembresClient members={members || []} partnerNames={partnerNames} />;
}
