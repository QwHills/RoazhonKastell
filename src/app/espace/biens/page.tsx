import { redirect } from "next/navigation";
import { getCurrentUser, hasAnyRole } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import BiensClient from "./BiensClient";

export default async function BiensPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");
  if (!hasAnyRole(profile, ["adherent", "admin"])) redirect("/espace");

  const supabase = await createClient();

  const { data: myProperties } = await supabase
    .from("shared_properties")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  const { data: allProperties } = await supabase
    .from("shared_properties")
    .select("*, profiles!shared_properties_owner_id_fkey(first_name, last_name)")
    .eq("status", "disponible")
    .neq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  const isAdmin = profile.roles.includes("admin");

  return (
    <BiensClient
      myProperties={myProperties || []}
      othersProperties={allProperties || []}
      userId={profile.id}
      isAdmin={isAdmin}
    />
  );
}
