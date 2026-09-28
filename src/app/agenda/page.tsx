import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { staticEvents } from "@/data/events-data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const revalidate = 600;

interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  category: string | null;
  external_link: string | null;
  max_attendees: number | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getEvents(): Promise<PublicEvent[]> {
  const now = new Date().toISOString();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, title, slug, description, location, starts_at, ends_at, category, external_link, max_attendees")
      .eq("status", "publie")
      .eq("visibility", "public")
      .gte("starts_at", now)
      .order("starts_at", { ascending: true });
    if (!error && data && data.length > 0) return data;
  } catch {}
  return staticEvents.filter((e) => e.starts_at >= now);
}

export default async function AgendaPage() {
  const events = await getEvents();
  const grouped = groupByMonth(events);

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-zinc-50 pt-16">
        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                Agenda
              </h1>
              <p className="mt-4 text-zinc-500 text-lg">
                Les prochains événements du réseau Roazhon Kastell.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-5 mb-10 flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center text-sm font-bold">
                MA
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Tous les mardis</p>
                <p className="text-sm text-zinc-600 mt-0.5">
                  9h30 — 10h30 : Présentation des biens du réseau
                </p>
                <p className="text-sm text-zinc-600">
                  Suivi de l&apos;atelier de la semaine (voir ci-dessous)
                </p>
                <p className="text-xs text-zinc-400 mt-1">Roazhon Kastell, Rennes</p>
              </div>
            </div>

            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-400 text-lg">Aucun événement à venir pour le moment.</p>
                <p className="text-zinc-400 text-sm mt-2">Revenez bientôt !</p>
              </div>
            ) : (
              <div className="space-y-10">
                {Object.entries(grouped).map(([month, monthEvents]) => (
                  <div key={month}>
                    <h2 className="text-lg font-semibold text-zinc-900 mb-4 capitalize">{month}</h2>
                    <div className="space-y-4">
                      {monthEvents.map((event) => (
                        <div
                          key={event.id}
                          className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="flex-shrink-0 text-center sm:text-left">
                              <div className="text-3xl font-bold text-zinc-900">
                                {new Date(event.starts_at).getDate()}
                              </div>
                              <div className="text-xs text-zinc-400 uppercase">
                                {new Date(event.starts_at).toLocaleDateString("fr-FR", { weekday: "short" })}
                              </div>
                            </div>

                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-zinc-900">{event.title}</h3>
                              <p className="text-sm text-zinc-500 mt-1">
                                {formatTime(event.starts_at)}
                                {event.ends_at && ` — ${formatTime(event.ends_at)}`}
                                {event.location && ` · ${event.location}`}
                              </p>
                              {event.description && (
                                <p className="text-sm text-zinc-600 mt-3 leading-relaxed">
                                  {event.description}
                                </p>
                              )}
                              {event.external_link && (
                                <a
                                  href={event.external_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm font-medium text-zinc-900 mt-3 hover:underline"
                                >
                                  En savoir plus
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>

                            {event.category && (
                              <span className="px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-xs font-medium self-start">
                                {event.category}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function groupByMonth(events: PublicEvent[]): Record<string, PublicEvent[]> {
  const groups: Record<string, PublicEvent[]> = {};
  for (const e of events) {
    const month = new Date(e.starts_at).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    if (!groups[month]) groups[month] = [];
    groups[month].push(e);
  }
  return groups;
}
