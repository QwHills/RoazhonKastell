import { getCurrentUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, category, starts_at, ends_at, location, status")
    .eq("status", "publie")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(20);

  const grouped = new Map<string, typeof events>();
  for (const event of events || []) {
    const date = new Date(event.starts_at).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Paris",
    });
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date)!.push(event);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Agenda</h1>
        <p className="text-zinc-500 mt-1">
          Les prochains rendez-vous du réseau.
        </p>
      </div>

      {grouped.size > 0 ? (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([date, dayEvents]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                {date}
              </h2>
              <div className="space-y-3">
                {dayEvents!.map((event) => {
                  const start = new Date(event.starts_at);
                  const end = event.ends_at ? new Date(event.ends_at) : null;
                  const timeStr = `${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}${end ? ` – ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}` : ""}`;
                  const isMardi = event.category === "mardi-coworking";

                  return (
                    <div
                      key={event.id}
                      className={`bg-white border rounded-2xl p-5 ${isMardi ? "border-amber-200" : "border-zinc-200"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-zinc-900">{event.title}</h3>
                          <p className="text-sm text-zinc-500 mt-0.5">{timeStr}</p>
                          {event.location && (
                            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {event.location}
                            </p>
                          )}
                        </div>
                        {isMardi && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Mardi
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-zinc-400 mb-2">Aucun événement à venir.</p>
          <p className="text-sm text-zinc-400">
            Les prochains rendez-vous apparaîtront ici.
          </p>
        </div>
      )}
    </div>
  );
}
