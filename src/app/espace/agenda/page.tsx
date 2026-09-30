import { getCurrentUser, canViewReunions } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AgendaParticipeButton from "./AgendaParticipeButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

function getUpcomingTuesdays(count: number): Date[] {
  const parisNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const today = new Date(parisNow);
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const diff = day <= 2 ? 2 - day : 9 - day;
  const firstTuesday = new Date(today);
  firstTuesday.setDate(today.getDate() + (diff === 0 ? 0 : diff));
  const tuesdays: Date[] = [];
  for (let i = 0; i < count; i++) {
    const t = new Date(firstTuesday);
    t.setDate(firstTuesday.getDate() + i * 7);
    tuesdays.push(t);
  }
  return tuesdays;
}

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
    .limit(50);

  const tuesdays = getUpcomingTuesdays(12);

  const isExec = canViewReunions(profile);

  type AgendaEvent = {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    category: string | null;
    isRecurring?: boolean;
    isMeeting?: boolean;
  };

  const allEvents: AgendaEvent[] = (events || []).map((e) => ({
    id: e.id,
    title: e.title,
    starts_at: e.starts_at,
    ends_at: e.ends_at,
    location: e.location,
    category: e.category,
  }));

  if (isExec) {
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: meetings } = await supabase
      .from("meetings")
      .select("id, title, meeting_date, starts_time, ends_time, location, status")
      .gte("meeting_date", todayStr)
      .not("status", "in", '("archive","termine")')
      .order("meeting_date", { ascending: true })
      .limit(10);

    for (const m of meetings || []) {
      const dateStr = m.meeting_date;
      const startTime = m.starts_time || "09:30";
      const endTime = m.ends_time || "11:30";

      const p = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Paris",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
      });
      const fakeStart = new Date(`${dateStr}T${startTime}:00Z`);
      const partsS = p.formatToParts(fakeStart);
      const gS = (t: string) => partsS.find((x) => x.type === t)!.value;
      const offsetStart = new Date(`${gS("year")}-${gS("month")}-${gS("day")}T${gS("hour")}:${gS("minute")}:${gS("second")}Z`).getTime() - fakeStart.getTime();
      const startsAt = new Date(fakeStart.getTime() - offsetStart).toISOString();

      const fakeEnd = new Date(`${dateStr}T${endTime}:00Z`);
      const partsE = p.formatToParts(fakeEnd);
      const gE = (t: string) => partsE.find((x) => x.type === t)!.value;
      const offsetEnd = new Date(`${gE("year")}-${gE("month")}-${gE("day")}T${gE("hour")}:${gE("minute")}:${gE("second")}Z`).getTime() - fakeEnd.getTime();
      const endsAt = new Date(fakeEnd.getTime() - offsetEnd).toISOString();

      allEvents.push({
        id: `meeting-${m.id}`,
        title: m.title,
        starts_at: startsAt,
        ends_at: endsAt,
        location: m.location,
        category: "reunion",
        isMeeting: true,
      });
    }
  }

  for (const tuesday of tuesdays) {
    const tDateStr = tuesday.toLocaleDateString("en-CA");
    const hasPresentation = allEvents.some((e) => {
      const eDate = new Date(e.starts_at).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
      return eDate === tDateStr && e.title.toLowerCase().includes("présentation");
    });
    if (!hasPresentation) {
      const p = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Paris",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
      });
      const fakeStart = new Date(`${tDateStr}T09:30:00Z`);
      const partsS = p.formatToParts(fakeStart);
      const gS = (t: string) => partsS.find((x) => x.type === t)!.value;
      const offsetStart = new Date(`${gS("year")}-${gS("month")}-${gS("day")}T${gS("hour")}:${gS("minute")}:${gS("second")}Z`).getTime() - fakeStart.getTime();
      const startsAt = new Date(fakeStart.getTime() - offsetStart).toISOString();

      const fakeEnd = new Date(`${tDateStr}T10:30:00Z`);
      const partsE = p.formatToParts(fakeEnd);
      const gE = (t: string) => partsE.find((x) => x.type === t)!.value;
      const offsetEnd = new Date(`${gE("year")}-${gE("month")}-${gE("day")}T${gE("hour")}:${gE("minute")}:${gE("second")}Z`).getTime() - fakeEnd.getTime();
      const endsAt = new Date(fakeEnd.getTime() - offsetEnd).toISOString();

      allEvents.push({
        id: `recurring-${tDateStr}`,
        title: "Présentation des biens & échanges",
        starts_at: startsAt,
        ends_at: endsAt,
        location: "Roazhon Kastell, Rennes",
        category: "mardi-coworking",
        isRecurring: true,
      });
    }
  }

  allEvents.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  const realEventIds = allEvents.filter((e) => !e.isRecurring).map((e) => e.id);
  const { data: registrations } = realEventIds.length > 0
    ? await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", profile.id)
        .eq("status", "inscrit")
        .in("event_id", realEventIds)
    : { data: [] };

  const registeredSet = new Set((registrations || []).map((r) => r.event_id));

  const grouped = new Map<string, AgendaEvent[]>();
  for (const event of allEvents) {
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
                {dayEvents.map((event) => {
                  const start = new Date(event.starts_at);
                  const end = event.ends_at ? new Date(event.ends_at) : null;
                  const timeStr = `${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}${end ? ` – ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}` : ""}`;
                  const isMardi = event.category === "mardi-coworking";
                  const isMeeting = !!(event as AgendaEvent).isMeeting;
                  const isReal = !event.isRecurring && !isMeeting;
                  const meetingId = isMeeting ? event.id.replace("meeting-", "") : null;

                  return (
                    <div
                      key={event.id}
                      className={`bg-white border rounded-2xl p-5 ${
                        isMeeting ? "border-emerald-200" :
                        isMardi ? "border-amber-200" : "border-zinc-200"
                      }`}
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
                          {isReal && (
                            <AgendaParticipeButton
                              eventId={event.id}
                              initialRegistered={registeredSet.has(event.id)}
                            />
                          )}
                          {isMeeting && meetingId && (
                            <Link
                              href={`/espace/reunions/${meetingId}`}
                              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                            >
                              Voir la réunion
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                              </svg>
                            </Link>
                          )}
                        </div>
                        {isMardi && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Mardi
                          </span>
                        )}
                        {isMeeting && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Réunion
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
