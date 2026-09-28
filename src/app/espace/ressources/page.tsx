import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import RessourcesClient from "./RessourcesClient";

export default async function RessourcesPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");

  const supabase = await createClient();

  const { data: resources } = await supabase
    .from("resources")
    .select("*, profiles!resources_uploaded_by_fkey(first_name, last_name)")
    .order("created_at", { ascending: false });

  return (
    <RessourcesClient
      resources={resources || []}
      userId={profile.id}
      isAdmin={isAdmin(profile)}
    />
  );
}
