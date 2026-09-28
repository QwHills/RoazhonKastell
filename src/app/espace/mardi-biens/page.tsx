import { redirect } from "next/navigation";
import { getCurrentUser, canManageEvents } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MardiBiensPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");
  if (!canManageEvents(profile)) redirect("/espace");

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Prochain événement
  const { data: nextEvents } = await supabase
    .from("events")
    .select("id, title, starts_at, ends_at")
    .eq("status", "publie")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(1);

  const nextEvent = nextEvents?.[0];

  if (!nextEvent) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-400">Aucun événement à venir.</p>
      </div>
    );
  }

  // Participants inscrits
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("user_id, profiles:user_id(id, first_name, last_name, email, photo_url)")
    .eq("event_id", nextEvent.id)
    .eq("status", "inscrit");

  const participants = (registrations || []).map((r: Record<string, unknown>) => {
    const prof = r.profiles as Record<string, unknown> | null;
    return {
      id: (prof?.id || r.user_id) as string,
      firstName: (prof?.first_name || "") as string,
      lastName: (prof?.last_name || "") as string,
      email: (prof?.email || "") as string,
      photoUrl: (prof?.photo_url || null) as string | null,
    };
  });

  // Biens de chaque participant
  const userIds = participants.map((p) => p.id);
  let propertiesByOwner: Record<string, Array<{
    id: string;
    property_type: string | null;
    city: string | null;
    price: number | null;
    living_area: number | null;
    rooms: number | null;
    iad_url: string | null;
    description: string | null;
    photo_url: string | null;
    transaction_type: string | null;
  }>> = {};

  if (userIds.length > 0) {
    const { data: properties } = await supabase
      .from("shared_properties")
      .select("id, owner_id, property_type, city, price, living_area, rooms, iad_url, description, photo_url, transaction_type")
      .in("owner_id", userIds)
      .eq("status", "disponible")
      .order("created_at", { ascending: false });

    for (const prop of properties || []) {
      const ownerId = prop.owner_id as string;
      if (!propertiesByOwner[ownerId]) propertiesByOwner[ownerId] = [];
      propertiesByOwner[ownerId].push(prop);
    }
  }

  const eventDate = new Date(nextEvent.starts_at).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalProperties = Object.values(propertiesByOwner).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">
          Biens à présenter
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {nextEvent.title} — {eventDate}
        </p>
        <div className="flex gap-4 mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 rounded-full text-xs font-medium text-zinc-600">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            {participants.length} participant{participants.length > 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 rounded-full text-xs font-medium text-zinc-600">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
            </svg>
            {totalProperties} bien{totalProperties > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl">
          <p className="text-zinc-400">Aucun conseiller inscrit pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {participants.map((participant) => {
            const properties = propertiesByOwner[participant.id] || [];
            const initials = `${participant.firstName.charAt(0)}${participant.lastName.charAt(0)}`.toUpperCase();

            return (
              <div key={participant.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                {/* Conseiller header */}
                <div className="flex items-center gap-3 p-5 border-b border-zinc-100">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {participant.photoUrl ? (
                      <img src={participant.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-zinc-400">{initials}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {participant.firstName} {participant.lastName}
                    </p>
                    <p className="text-xs text-zinc-400">{participant.email}</p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    {properties.length} bien{properties.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Biens */}
                {properties.length > 0 ? (
                  <div className="divide-y divide-zinc-100">
                    {properties.map((prop) => (
                      <div key={prop.id} className="flex items-center gap-4 p-4">
                        {/* Photo */}
                        <div className="w-20 h-16 rounded-xl bg-zinc-100 overflow-hidden flex-shrink-0">
                          {prop.photo_url ? (
                            <img src={prop.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Détails */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {prop.transaction_type && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                {prop.transaction_type}
                              </span>
                            )}
                            {prop.property_type && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                · {prop.property_type}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {prop.city || "Ville non renseignée"}
                            {prop.rooms && ` · ${prop.rooms} pièce${prop.rooms > 1 ? "s" : ""}`}
                            {prop.living_area && ` · ${prop.living_area} m²`}
                          </p>
                          {prop.price && (
                            <p className="text-sm font-semibold text-zinc-700">
                              {prop.price.toLocaleString("fr-FR")} €
                            </p>
                          )}
                        </div>

                        {/* Lien annonce */}
                        {prop.iad_url && (
                          <a
                            href={prop.iad_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors flex-shrink-0"
                          >
                            Voir l&apos;annonce
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-zinc-400">Aucun bien partagé pour le moment</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
