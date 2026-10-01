import { getCurrentUser, isAdmin, canManageMembers, hasRole, canViewReunions } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Profile } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/mardi";
import ParticipeButton from "./ParticipeButton";
import AtelierParticipeButton from "./AtelierParticipeButton";
import { getWeeklyAction, getMeetSuggestion, getPartnerDiscovery, getPartnerFicheAction } from "@/lib/dashboard-cards";
import { ActionWeekCard, MeetCounselorCard, PartnerDiscoverCard, PartnerFicheCard } from "./DashboardCards";
import ReunionDashboardCard from "./ReunionDashboardCard";
import OnboardingStatsCard from "./OnboardingStatsCard";

export const dynamic = "force-dynamic";

export default async function EspacePage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");

  const supabase = await createClient();

  const admin = isAdmin(profile);
  const manager = canManageMembers(profile);
  const isPartner = hasRole(profile, "partenaire");
  const isExec = canViewReunions(profile);
  const now = new Date().toISOString();

  function parisToISO(dateStr: string, time: string): string {
    const asUTC = new Date(`${dateStr}T${time}:00Z`);
    const p = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).formatToParts(asUTC);
    const g = (t: string) => p.find(x => x.type === t)!.value;
    const parisAsUTC = new Date(`${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}:${g("second")}Z`);
    const offsetMs = parisAsUTC.getTime() - asUTC.getTime();
    return new Date(asUTC.getTime() - offsetMs).toISOString();
  }

  function getNextTuesday(): Date {
    const parisNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    const today = new Date(parisNow);
    today.setHours(0, 0, 0, 0);
    const day = today.getDay();
    const diff = day <= 2 ? 2 - day : 9 - day;
    const isPastEvent = parisNow.getHours() > 10 || (parisNow.getHours() === 10 && parisNow.getMinutes() >= 30);
    const next = new Date(today);
    next.setDate(today.getDate() + (diff === 0 && !isPastEvent ? 0 : diff === 0 ? 7 : diff));
    return next;
  }

  const nextTuesday = getNextTuesday();
  const tuesdayStart = new Date(nextTuesday);
  tuesdayStart.setHours(0, 0, 0, 0);
  const tuesdayEnd = new Date(nextTuesday);
  tuesdayEnd.setHours(23, 59, 59, 999);

  const [
    { count: myPropertiesCount },
    { count: mySearchesCount },
    pendingResult,
    { data: nextEvents },
    { data: tuesdayEvents },
  ] = await Promise.all([
    supabase
      .from("shared_properties")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", profile.id),
    supabase
      .from("buyer_searches")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", profile.id)
      .eq("status", "active"),
    (admin || manager)
      ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("member_status", "en_attente")
      : Promise.resolve({ count: 0 }),
    isPartner
      ? supabase
          .from("events")
          .select("id, title, starts_at, ends_at")
          .eq("status", "publie")
          .neq("category", "mardi-coworking")
          .gte("starts_at", now)
          .order("starts_at", { ascending: true })
          .limit(1)
      : Promise.resolve({ data: [] }),
    !isPartner
      ? supabase
          .from("events")
          .select("id, title, starts_at, ends_at")
          .eq("status", "publie")
          .gte("starts_at", tuesdayStart.toISOString())
          .lte("starts_at", tuesdayEnd.toISOString())
          .order("starts_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const pendingCount = pendingResult.count || 0;

  // Next exec meeting
  let nextMeeting: { id: string; title: string; meeting_date: string; starts_time: string | null; ends_time: string | null; location: string | null } | null = null;
  let meetingSubjectCount = 0;
  let meetingTotalMinutes = 0;
  let myMeetingResponse: string | null = null;
  let meetingPresentCount = 0;
  let meetingAbsentCount = 0;
  let meetingWaitingCount = 0;

  if (isExec) {
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: meetings } = await supabase
      .from("meetings")
      .select("id, title, meeting_date, starts_time, ends_time, location")
      .gte("meeting_date", todayStr)
      .not("status", "in", '("archive","termine")')
      .order("meeting_date", { ascending: true })
      .limit(1);

    nextMeeting = meetings?.[0] || null;

    if (nextMeeting) {
      const [{ data: subs }, { data: atts }] = await Promise.all([
        supabase
          .from("meeting_subjects")
          .select("duration_minutes")
          .eq("meeting_id", nextMeeting.id),
        supabase
          .from("meeting_attendees")
          .select("user_id, response")
          .eq("meeting_id", nextMeeting.id),
      ]);

      meetingSubjectCount = subs?.length || 0;
      meetingTotalMinutes = (subs || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

      for (const a of atts || []) {
        if (a.user_id === profile.id) myMeetingResponse = a.response;
        if (a.response === "present") meetingPresentCount++;
        else if (a.response === "absent") meetingAbsentCount++;
        else meetingWaitingCount++;
      }
    }
  }

  type EventInfo = { id: string; title: string; starts_at: string; ends_at: string | null };
  let nextEvent: EventInfo | null = null;
  let otherTuesdayEvents: EventInfo[] = [];
  let nextTuesdayFallback = false;

  if (isPartner) {
    nextEvent = nextEvents?.[0] || null;
  } else {
    const allTuesday = (tuesdayEvents || []) as EventInfo[];
    let mainEvent = allTuesday.find((e) => e.title.toLowerCase().includes("présentation")) || null;

    if (!mainEvent) {
      const adminClient = getAdminClient();
      const y = nextTuesday.getFullYear();
      const m = String(nextTuesday.getMonth() + 1).padStart(2, "0");
      const d = String(nextTuesday.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      const slug = `mardi-coworking-${dateStr.replace(/-/g, "")}`;
      const { data: created } = await adminClient
        .from("events")
        .upsert({
          title: "Présentation des biens & échanges",
          slug,
          category: "mardi-coworking",
          location: "Roazhon Kastell, Rennes",
          starts_at: parisToISO(dateStr, "09:30"),
          ends_at: parisToISO(dateStr, "10:30"),
          status: "publie",
          visibility: "public",
          created_by: profile.id,
        }, { onConflict: "slug" })
        .select("id, title, starts_at, ends_at")
        .single();

      if (created) {
        mainEvent = created;
      } else {
        nextTuesdayFallback = true;
      }
    }

    if (mainEvent) {
      nextEvent = mainEvent;
      otherTuesdayEvents = allTuesday.filter((e) => e.id !== mainEvent!.id);
    }
  }

  let isRegistered = false;
  const atelierRegisteredSet = new Set<string>();
  const allEventIds = [
    ...(nextEvent ? [nextEvent.id] : []),
    ...otherTuesdayEvents.map((e) => e.id),
  ];
  if (allEventIds.length > 0) {
    const { data: regs } = await supabase
      .from("event_registrations")
      .select("event_id")
      .in("event_id", allEventIds)
      .eq("user_id", profile.id)
      .eq("status", "inscrit");
    for (const r of regs || []) {
      if (nextEvent && r.event_id === nextEvent.id) isRegistered = true;
      else atelierRegisteredSet.add(r.event_id);
    }
  }

  const [weeklyAction, meetSuggestion, partnerDiscovery, partnerFicheAction] = await Promise.all([
    !isPartner ? getWeeklyAction(supabase, profile.id) : Promise.resolve(null),
    !isPartner && nextEvent ? getMeetSuggestion(supabase, profile.id, nextEvent.id) : Promise.resolve(null),
    !isPartner ? getPartnerDiscovery(supabase, profile.id) : Promise.resolve(null),
    isPartner ? getPartnerFicheAction(supabase, profile.id) : Promise.resolve(null),
  ]);

  const hasCards = !!(weeklyAction || meetSuggestion || partnerDiscovery);

  // Onboarding stats for admins
  let onboardingStats: {
    adherents: { connected: { name: string; email: string; connected: boolean }[]; notConnected: { name: string; email: string; connected: boolean }[] };
    partenaires: { connected: { name: string; email: string; connected: boolean }[]; notConnected: { name: string; email: string; connected: boolean }[]; ficheComplete: { name: string; email: string; connected: boolean }[]; ficheIncomplete: { name: string; email: string; connected: boolean }[] };
  } | null = null;

  if (admin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (serviceRoleKey && supabaseUrl) {
      const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=500`, {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      });
      const authData = await authRes.json();
      const authUsers = authData?.users || authData || [];
      const signInMap = new Map<string, boolean>();
      for (const u of authUsers) {
        if (u.email) signInMap.set(u.email, !!u.last_sign_in_at);
      }

      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, roles, member_status")
        .eq("member_status", "actif")
        .not("email", "like", "%@roazhonkastell.test");

      const { data: partnerMembers } = await supabase
        .from("partner_members")
        .select("user_id, partner_id");
      const partnerMemberMap = new Map((partnerMembers || []).map((pm) => [pm.user_id, pm.partner_id]));

      const { data: partners } = await supabase
        .from("partners")
        .select("id, name, description, logo_url, status");
      const partnerMap = new Map((partners || []).map((p) => [p.id, p]));

      const adhConnected: { name: string; email: string; connected: boolean }[] = [];
      const adhNotConnected: { name: string; email: string; connected: boolean }[] = [];
      const partConnected: { name: string; email: string; connected: boolean }[] = [];
      const partNotConnected: { name: string; email: string; connected: boolean }[] = [];
      const partFicheComplete: { name: string; email: string; connected: boolean }[] = [];
      const partFicheIncomplete: { name: string; email: string; connected: boolean }[] = [];

      for (const p of allProfiles || []) {
        const roles = (p.roles as string[]) || [];
        const name = `${p.first_name} ${p.last_name}`.trim();
        const email = p.email as string;
        const connected = signInMap.get(email) ?? false;
        const entry = { name, email, connected };

        if (roles.includes("partenaire")) {
          if (connected) partConnected.push(entry);
          else partNotConnected.push(entry);
          const partnerId = partnerMemberMap.get(p.id);
          if (partnerId) {
            const partner = partnerMap.get(partnerId);
            if (partner && partner.name && partner.description && partner.status !== "brouillon") {
              partFicheComplete.push(entry);
            } else {
              partFicheIncomplete.push(entry);
            }
          } else {
            partFicheIncomplete.push(entry);
          }
        } else {
          if (connected) adhConnected.push(entry);
          else adhNotConnected.push(entry);
        }
      }

      onboardingStats = {
        adherents: { connected: adhConnected, notConnected: adhNotConnected },
        partenaires: { connected: partConnected, notConnected: partNotConnected, ficheComplete: partFicheComplete, ficheIncomplete: partFicheIncomplete },
      };
    }
  }

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">
          Bonjour {profile.first_name}
        </h1>
        <p className="text-zinc-500 mt-1">
          Préparez votre prochain rendez-vous au château.
        </p>
      </div>

      {/* Next event card */}
      <div className="relative rounded-2xl overflow-hidden mb-8 bg-zinc-900 text-white"
        style={{ backgroundImage: "url(/chateau.jpg)", backgroundSize: "cover", backgroundPosition: "center 30%" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-900/40" />
        <div className="relative z-10 p-8 sm:p-10">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {isPartner ? "Mon prochain événement" : "Mon prochain mardi"}
          </div>
          {isPartner ? (
            nextEvent ? (
              <>
                <h2 className="text-2xl font-bold mb-1">{nextEvent.title}</h2>
                <p className="text-white/50 text-sm">
                  {new Date(nextEvent.starts_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" })}
                  {" · "}
                  {new Date(nextEvent.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
                  {nextEvent.ends_at && ` – ${new Date(nextEvent.ends_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}`}
                </p>
                <ParticipeButton eventId={nextEvent.id} initialRegistered={isRegistered} showBiens={false} />
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-1">Aucun événement prévu</h2>
                <p className="text-white/50 text-sm">Les prochains événements partenaires apparaîtront ici.</p>
                <Link
                  href="/espace/agenda"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-zinc-900 rounded-full text-sm font-semibold hover:bg-zinc-100 transition-colors"
                >
                  Voir le programme
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </>
            )
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-1">Présentation des biens & échanges</h2>
              <p className="text-white/50 text-sm">
                {nextTuesday.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                {" · 09:30 – 10:30"}
              </p>
              {otherTuesdayEvents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Ateliers du jour</p>
                  <div className="flex flex-col gap-2 sm:inline-flex">
                    {[...(nextEvent && !nextEvent.title.toLowerCase().includes("présentation") ? [nextEvent] : []), ...otherTuesdayEvents].map((ev) => (
                      <div key={ev.id} className="flex flex-col gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:rounded-lg sm:px-3 sm:py-2 sm:w-fit">
                        <span className="text-white/60 text-xs font-normal sm:font-medium sm:text-white/70 whitespace-nowrap">
                          {new Date(ev.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
                          {ev.ends_at && ` – ${new Date(ev.ends_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}`}
                        </span>
                        <span className="text-white/90 text-sm font-semibold sm:font-medium">{ev.title}</span>
                        <AtelierParticipeButton eventId={ev.id} initialRegistered={atelierRegisteredSet.has(ev.id)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {nextEvent ? (
                <ParticipeButton eventId={nextEvent.id} initialRegistered={isRegistered} showBiens={true} />
              ) : (
                <Link
                  href="/espace/biens"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-zinc-900 rounded-full text-sm font-semibold hover:bg-zinc-100 transition-colors"
                >
                  Préparer mes biens
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Next exec meeting card */}
      {isExec && nextMeeting && (
        <ReunionDashboardCard
          meeting={nextMeeting}
          subjectCount={meetingSubjectCount}
          totalMinutes={meetingTotalMinutes}
          initialResponse={myMeetingResponse}
          presentCount={meetingPresentCount}
          absentCount={meetingAbsentCount}
          waitingCount={meetingWaitingCount}
        />
      )}

      {/* Dashboard cards — adherents */}
      {hasCards && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {weeklyAction && <ActionWeekCard data={weeklyAction} />}
          {meetSuggestion && nextEvent && (
            <MeetCounselorCard data={meetSuggestion} eventId={nextEvent.id} />
          )}
          {partnerDiscovery && <PartnerDiscoverCard data={partnerDiscovery} />}
        </div>
      )}

      {/* Dashboard card — partenaires */}
      {partnerFicheAction && (
        <div className="mb-8">
          <PartnerFicheCard data={partnerFicheAction} />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {isPartner ? (
          <>
            <QuickActionCard
              href="/espace/partenaires"
              icon={<PartnerActionIcon />}
              title="Modifier ma fiche"
              description="Mettez à jour votre page publique sur le site."
            />
            <QuickActionCard
              href="/espace/idees"
              icon={<LightbulbActionIcon />}
              title="Proposer une idée"
              description="Vos retours font évoluer Roazhon Kastell."
            />
          </>
        ) : (
          <>
            <QuickActionCard
              href="/espace/biens"
              icon={<HomeActionIcon />}
              title="Présenter un bien"
              description="Partagez un bien avec la communauté Roazhon Kastell."
              count={myPropertiesCount || undefined}
              countLabel="biens partagés"
            />
            <QuickActionCard
              href="/espace/recherches"
              icon={<SearchActionIcon />}
              title="Partager une recherche"
              description="Diffusez une recherche pour activer des rapprochements."
              count={mySearchesCount || undefined}
              countLabel="recherches actives"
            />
            <QuickActionCard
              href="/espace/idees"
              icon={<LightbulbActionIcon />}
              title="Proposer une idée"
              description="Vos retours font évoluer Roazhon Kastell."
            />
          </>
        )}
      </div>

      {/* Admin/Manager stats */}
      {(admin || manager) && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {pendingCount > 0 && (
            <Link href="/espace/membres" className="flex items-center gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-800">{pendingCount}</p>
                <p className="text-xs text-amber-600">Inscription{pendingCount > 1 ? "s" : ""} en attente</p>
              </div>
            </Link>
          )}
          {admin && (
            <Link href="/espace/finances" className="flex items-center gap-4 p-5 bg-white border border-zinc-200 rounded-2xl hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Finances</p>
                <p className="text-xs text-zinc-400">Consulter les écritures</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Onboarding stats — admin only */}
      {admin && onboardingStats && (
        <div className="mb-8">
          <OnboardingStatsCard
            adherents={onboardingStats.adherents}
            partenaires={onboardingStats.partenaires}
          />
        </div>
      )}

      {/* Bottom row: Resources + Ideas prompt */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/espace/ressources" className="flex items-center gap-4 p-5 bg-white border border-zinc-200 rounded-2xl hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Ressources</p>
            <p className="text-xs text-zinc-400">Documents, supports et outils du réseau</p>
          </div>
          <svg className="w-5 h-5 text-zinc-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        <Link href="/espace/profil" className="flex items-center gap-4 p-5 bg-white border border-zinc-200 rounded-2xl hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Mon profil</p>
            <p className="text-xs text-zinc-400">Modifiez vos informations personnelles</p>
          </div>
          <svg className="w-5 h-5 text-zinc-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
  count,
  countLabel,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  count?: number;
  countLabel?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col p-6 bg-white border border-zinc-200 rounded-2xl hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors text-zinc-500">
          {icon}
        </div>
        <svg className="w-5 h-5 text-zinc-300 group-hover:text-zinc-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
      <h3 className="font-semibold text-zinc-900">{title}</h3>
      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{description}</p>
      {count !== undefined && countLabel && (
        <p className="text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-100">
          <span className="font-semibold text-zinc-700">{count}</span> {countLabel}
        </p>
      )}
    </Link>
  );
}

function HomeActionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
    </svg>
  );
}

function SearchActionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function PartnerActionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function LightbulbActionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}
