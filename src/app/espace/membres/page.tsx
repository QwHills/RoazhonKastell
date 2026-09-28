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

  return <MembresClient members={members || []} />;
}
