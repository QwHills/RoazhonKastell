import { redirect } from "next/navigation";
import { getCurrentUser, canManageMembers, hasRole } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import PartenairesGestion from "./PartenairesGestion";
import PartenaireEdit from "./PartenaireEdit";
import CreatePartnerForm from "./CreatePartnerForm";

export default async function PartenairesPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");

  const supabase = await createClient();
  const isManager = canManageMembers(profile);
  const isPartner = hasRole(profile, "partenaire");

  if (isManager) {
    const { data: partners } = await supabase
      .from("partners")
      .select("*, partner_contacts(*)")
      .order("name");

    return <PartenairesGestion partners={partners || []} />;
  }

  if (isPartner) {
    const { data: membership } = await supabase
      .from("partner_members")
      .select("partner_id")
      .eq("user_id", profile.id)
      .single();

    if (membership) {
      const { data: partner } = await supabase
        .from("partners")
        .select("*, partner_contacts(*)")
        .eq("id", membership.partner_id)
        .single();

      if (partner) {
        return <PartenaireEdit partner={partner} contacts={partner.partner_contacts || []} />;
      }
    }

    return <CreatePartnerForm userId={profile.id} userName={`${profile.first_name} ${profile.last_name}`.trim()} />;
  }

  redirect("/espace");
}
