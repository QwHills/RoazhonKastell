import { redirect, notFound } from "next/navigation";
import { getCurrentUser, canViewReunions } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import MeetingDetailClient from "./MeetingDetailClient";

export const dynamic = "force-dynamic";

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");
  if (!canViewReunions(profile)) redirect("/espace");

  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: meeting },
    { data: subjects },
    { data: attendees },
    { data: todos },
  ] = await Promise.all([
    supabase
      .from("meetings")
      .select("*, profiles!meetings_created_by_fkey(first_name, last_name)")
      .eq("id", id)
      .single(),
    supabase
      .from("meeting_subjects")
      .select("*, profiles!meeting_subjects_proposed_by_fkey(first_name, last_name)")
      .eq("meeting_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("meeting_attendees")
      .select("*, profiles!meeting_attendees_user_id_fkey(first_name, last_name)")
      .eq("meeting_id", id),
    supabase
      .from("meeting_todos")
      .select("*, profiles!meeting_todos_assigned_to_fkey(first_name, last_name)")
      .eq("meeting_id", id)
      .order("done", { ascending: true })
      .order("due_date", { ascending: true }),
  ]);

  if (!meeting) notFound();

  const [adminMembers, associeMembers, execMembers] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").contains("roles", ["admin"]),
    supabase.from("profiles").select("id, first_name, last_name").contains("roles", ["associe"]),
    supabase.from("profiles").select("id, first_name, last_name").contains("roles", ["membre_executif"]),
  ]);

  const seen = new Set<string>();
  const allExecMembers = [
    ...(execMembers.data || []),
    ...(adminMembers.data || []),
    ...(associeMembers.data || []),
  ].filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  return (
    <MeetingDetailClient
      meeting={meeting}
      subjects={subjects || []}
      attendees={attendees || []}
      todos={todos || []}
      execMembers={allExecMembers}
      userId={profile.id}
    />
  );
}
