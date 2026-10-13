import { redirect } from "next/navigation";
import { getCurrentUser, canManageEvents } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import LocationsClient from "./LocationsClient";

export default async function LocationsPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");
  if (!canManageEvents(profile)) redirect("/espace");

  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("location_requests")
    .select("*")
    .order("created_at", { ascending: false });

  return <LocationsClient requests={requests || []} />;
}
