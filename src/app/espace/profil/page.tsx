import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import ProfilClient from "./ProfilClient";

export default async function ProfilPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");

  return <ProfilClient profile={profile} />;
}
