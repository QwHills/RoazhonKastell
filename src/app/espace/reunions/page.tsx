import { redirect } from "next/navigation";
import { getCurrentUser, canViewReunions } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import ReunionsClient from "./ReunionsClient";

export const dynamic = "force-dynamic";

export default async function ReunionsPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");
  if (!canViewReunions(profile)) redirect("/espace");

  const supabase = await createClient();

  const [{ data: meetings }, { data: todos }, { data: members }] =
    await Promise.all([
      supabase
        .from("meetings")
        .select("*, profiles!meetings_created_by_fkey(first_name, last_name)")
        .order("meeting_date", { ascending: false }),
      supabase
        .from("meeting_todos")
        .select("*, profiles!meeting_todos_assigned_to_fkey(first_name, last_name)")
        .order("done", { ascending: true })
        .order("due_date", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .contains("roles", ["membre_executif"]),
    ]);

  const [adminMembers, associeMembers] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").contains("roles", ["admin"]),
    supabase.from("profiles").select("id, first_name, last_name").contains("roles", ["associe"]),
  ]);

  const seen = new Set<string>();
  const allExecMembers = [...(members || []), ...(adminMembers.data || []), ...(associeMembers.data || [])]
    .filter((m) => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });

  return (
    <ReunionsClient
      meetings={meetings || []}
      todos={todos || []}
      execMembers={allExecMembers}
      userId={profile.id}
    />
  );
}
