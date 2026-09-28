import { redirect } from "next/navigation";
import { getCurrentUser, canManageEvents } from "@/lib/supabase/auth";
import MardiBiensClient from "./MardiBiensClient";

export const dynamic = "force-dynamic";

export default async function MardiBiensPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");
  if (!canManageEvents(profile)) redirect("/espace");

  return <MardiBiensClient />;
}
