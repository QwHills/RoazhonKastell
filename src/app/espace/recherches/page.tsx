import { redirect } from "next/navigation";
import { getCurrentUser, hasAnyRole } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import RecherchesClient from "./RecherchesClient";

export default async function RecherchesPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");
  if (!hasAnyRole(profile, ["adherent", "admin"])) redirect("/espace");

  const supabase = await createClient();

  const { data: mySearches } = await supabase
    .from("buyer_searches")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  const { data: allSearches } = await supabase
    .from("buyer_searches")
    .select("*, profiles!buyer_searches_owner_id_fkey(first_name, last_name)")
    .eq("status", "active")
    .neq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  const { data: networkProperties } = await supabase
    .from("shared_properties")
    .select("id, owner_id, transaction_type, property_type, city, postal_code, price, living_area, rooms, bedrooms, description, status, iad_url, profiles!shared_properties_owner_id_fkey(first_name, last_name, phone)")
    .eq("status", "disponible")
    .order("created_at", { ascending: false });

  return (
    <RecherchesClient
      mySearches={mySearches || []}
      othersSearches={allSearches || []}
      networkProperties={networkProperties || []}
      userId={profile.id}
    />
  );
}
