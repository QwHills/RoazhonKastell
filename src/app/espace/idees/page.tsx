import { redirect } from "next/navigation";
import { getCurrentUser, hasAnyRole, isAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import IdeesClient from "./IdeesClient";

export default async function IdeesPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");
  if (!hasAnyRole(profile, ["adherent", "admin", "partenaire"])) redirect("/espace");

  const supabase = await createClient();

  const [{ data: ideas }, { data: supports }] = await Promise.all([
    supabase
      .from("ideas")
      .select("*, profiles!ideas_author_id_fkey(first_name, last_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("idea_supports")
      .select("idea_id, user_id"),
  ]);

  const supportMap: Record<string, string[]> = {};
  (supports || []).forEach((s: { idea_id: string; user_id: string }) => {
    if (!supportMap[s.idea_id]) supportMap[s.idea_id] = [];
    supportMap[s.idea_id].push(s.user_id);
  });

  return (
    <IdeesClient
      ideas={ideas || []}
      supportMap={supportMap}
      userId={profile.id}
      isAdmin={isAdmin(profile)}
    />
  );
}
