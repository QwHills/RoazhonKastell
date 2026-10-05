import { redirect } from "next/navigation";
import { getCurrentUser, canManageEvents } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient, getNextTuesdayDate } from "@/lib/mardi";
import EvenementsGestion from "./EvenementsGestion";

export default async function EvenementsPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");
  if (!canManageEvents(profile)) redirect("/espace");

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*, event_registrations(id, user_id, status, profiles:user_id(id, first_name, last_name, email))")
    .order("starts_at", { ascending: false });

  const eventsWithDetails = await Promise.all(
    (events || []).map(async (e) => {
      const regs = Array.isArray((e as Record<string, unknown>).event_registrations) ? (e as Record<string, unknown>).event_registrations as Record<string, unknown>[] : [];
      const activeRegs = regs.filter((r) => r.status === "inscrit");
      const userIds = activeRegs
        .map((r) => r.user_id)
        .filter(Boolean) as string[];

      const isPresentation = (e.title as string).toLowerCase().includes("présentation");
      let participantProperties: Record<string, number> = {};
      if (isPresentation && userIds.length > 0) {
        const admin = getAdminClient();
        const nextTuesday = getNextTuesdayDate();
        const { data: session } = await admin
          .from("tuesday_sessions")
          .select("id")
          .eq("session_date", nextTuesday)
          .single();

        if (session) {
          const { data: tsp } = await admin
            .from("tuesday_session_properties")
            .select("owner_id")
            .eq("session_id", session.id)
            .in("owner_id", userIds);

          if (tsp) {
            for (const p of tsp) {
              participantProperties[p.owner_id] = (participantProperties[p.owner_id] || 0) + 1;
            }
          }
        }
      }

      return {
        ...e,
        registration_count: activeRegs.length,
        participants: activeRegs.map((r) => {
          const prof = r.profiles as Record<string, unknown> | null;
          return {
            userId: r.user_id as string,
            firstName: prof?.first_name as string || "",
            lastName: prof?.last_name as string || "",
            email: prof?.email as string || "",
            propertyCount: participantProperties[r.user_id as string] || 0,
          };
        }),
        event_registrations: undefined,
      };
    }),
  );

  return <EvenementsGestion events={eventsWithDetails} />;
}
