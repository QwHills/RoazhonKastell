import { SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// Helpers
// ============================================================

function parisTuesdayPeriodStart(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parisStr = fmt.format(now);
  const d = new Date(parisStr + "T00:00:00");
  const day = d.getDay();
  const diffBack = day >= 2 ? day - 2 : day + 5;
  d.setDate(d.getDate() - diffBack);
  return d.toISOString().split("T")[0];
}

function getNextTuesdayDate(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parisStr = fmt.format(now);
  const d = new Date(parisStr + "T12:00:00");
  const day = d.getDay();
  const diff = day <= 2 ? 2 - day : 9 - day;
  d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
  return d.toISOString().split("T")[0];
}

// ============================================================
// 1. Action de la semaine
// ============================================================

export interface WeeklyActionData {
  action: {
    id: string;
    title: string;
    instruction: string;
    duration_minutes: number;
    resource_url: string | null;
    resource_title: string | null;
    event_title: string;
    event_date: string;
  };
  tracking: {
    id: string;
    status: string;
  } | null;
}

export async function getWeeklyAction(
  supabase: SupabaseClient,
  userId: string,
): Promise<WeeklyActionData | null> {
  const { data: actions } = await supabase
    .from("atelier_actions")
    .select("id, title, instruction, duration_minutes, resource_url, resource_title, event_id, validated_at, events!inner(title, starts_at, ends_at, status)")
    .eq("status", "valide")
    .order("validated_at", { ascending: false })
    .limit(5);

  if (!actions || actions.length === 0) return null;

  const now = new Date();

  for (const a of actions) {
    const ev = a.events as unknown as { title: string; starts_at: string; ends_at: string | null; status: string };
    if (ev.status === "annule") continue;

    if (ev.ends_at && new Date(ev.ends_at) > now) continue;

    const eventDate = (ev.starts_at || "").slice(0, 10);
    const evIds = actions
      .filter((x) => {
        const xev = x.events as unknown as { starts_at: string };
        return (xev.starts_at || "").slice(0, 10) === eventDate;
      })
      .map((x) => x.event_id);

    const { count } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .in("event_id", evIds)
      .eq("user_id", userId)
      .eq("status", "inscrit");

    if (!count || count === 0) {
      const { count: sameDay } = await supabase
        .from("event_registrations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "inscrit");

      if (!sameDay) continue;

      const { data: allDayEvents } = await supabase
        .from("events")
        .select("id")
        .eq("category", "mardi-coworking")
        .gte("starts_at", eventDate + "T00:00:00")
        .lte("starts_at", eventDate + "T23:59:59");

      if (!allDayEvents || allDayEvents.length === 0) continue;

      const dayEventIds = allDayEvents.map((e) => e.id);
      const { count: dayReg } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .in("event_id", dayEventIds)
        .eq("user_id", userId)
        .eq("status", "inscrit");

      if (!dayReg || dayReg === 0) continue;
    }

    const { data: tracking } = await supabase
      .from("user_action_tracking")
      .select("id, status")
      .eq("action_id", a.id)
      .eq("user_id", userId)
      .maybeSingle();

    return {
      action: {
        id: a.id,
        title: a.title,
        instruction: a.instruction,
        duration_minutes: a.duration_minutes,
        resource_url: a.resource_url,
        resource_title: a.resource_title,
        event_title: ev.title,
        event_date: ev.starts_at,
      },
      tracking: tracking ? { id: tracking.id, status: tracking.status } : null,
    };
  }

  return null;
}

// ============================================================
// 2. Conseiller à rencontrer
// ============================================================

export interface MeetSuggestionData {
  suggestion: {
    id: string;
    status: string;
    suggestedUser: {
      id: string;
      first_name: string;
      last_name: string;
      photo_url: string | null;
      city: string | null;
    };
    eventDate: string;
  };
}

export async function getMeetSuggestion(
  supabase: SupabaseClient,
  userId: string,
  nextEventId: string | null,
): Promise<MeetSuggestionData | null> {
  if (!nextEventId) return null;

  const { data: myReg } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", nextEventId)
    .eq("user_id", userId)
    .eq("status", "inscrit")
    .maybeSingle();

  if (!myReg) return null;

  const { data: existing } = await supabase
    .from("meet_suggestions")
    .select("id, status, suggested_user_id")
    .eq("event_id", nextEventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { data: regCheck } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", nextEventId)
      .eq("user_id", existing.suggested_user_id)
      .eq("status", "inscrit")
      .maybeSingle();

    if (!regCheck) {
      await supabase.from("meet_suggestions").delete().eq("id", existing.id);
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, photo_url, city")
        .eq("id", existing.suggested_user_id)
        .single();

      if (profile) {
        const { data: ev } = await supabase
          .from("events")
          .select("starts_at")
          .eq("id", nextEventId)
          .single();

        return {
          suggestion: {
            id: existing.id,
            status: existing.status,
            suggestedUser: profile,
            eventDate: ev?.starts_at || "",
          },
        };
      }
    }
  }

  const { data: otherRegs } = await supabase
    .from("event_registrations")
    .select("user_id")
    .eq("event_id", nextEventId)
    .eq("status", "inscrit")
    .neq("user_id", userId);

  if (!otherRegs || otherRegs.length === 0) return null;

  const candidateIds = otherRegs.map((r) => r.user_id).filter(Boolean) as string[];

  const { data: knownRows } = await supabase
    .from("known_contacts")
    .select("known_user_id")
    .eq("user_id", userId);

  const knownSet = new Set((knownRows || []).map((r) => r.known_user_id));

  const { data: candidates } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, photo_url, city, roles")
    .in("id", candidateIds)
    .eq("member_status", "actif");

  const eligible = (candidates || []).filter(
    (c) => !knownSet.has(c.id) && (c.roles as string[]).includes("adherent"),
  );

  if (eligible.length === 0) {
    if (knownSet.size > 0 && candidateIds.length > 0) return null;
    return null;
  }

  const { data: existingSuggestions } = await supabase
    .from("meet_suggestions")
    .select("suggested_user_id")
    .eq("event_id", nextEventId);

  const suggestionCounts = new Map<string, number>();
  for (const s of existingSuggestions || []) {
    suggestionCounts.set(
      s.suggested_user_id,
      (suggestionCounts.get(s.suggested_user_id) || 0) + 1,
    );
  }

  eligible.sort((a, b) => {
    const ca = suggestionCounts.get(a.id) || 0;
    const cb = suggestionCounts.get(b.id) || 0;
    if (ca !== cb) return ca - cb;
    return Math.random() - 0.5;
  });

  const chosen = eligible[0];

  const { data: newSugg } = await supabase
    .from("meet_suggestions")
    .upsert(
      {
        event_id: nextEventId,
        user_id: userId,
        suggested_user_id: chosen.id,
        status: "proposee",
      },
      { onConflict: "event_id,user_id" },
    )
    .select("id, status")
    .single();

  if (!newSugg) return null;

  const { data: ev } = await supabase
    .from("events")
    .select("starts_at")
    .eq("id", nextEventId)
    .single();

  return {
    suggestion: {
      id: newSugg.id,
      status: newSugg.status,
      suggestedUser: {
        id: chosen.id,
        first_name: chosen.first_name,
        last_name: chosen.last_name,
        photo_url: chosen.photo_url,
        city: chosen.city,
      },
      eventDate: ev?.starts_at || "",
    },
  };
}

// ============================================================
// 3. Partenaire à découvrir
// ============================================================

export interface PartnerDiscoveryData {
  discovery: {
    id: string;
    response: string;
    partner: {
      id: string;
      name: string;
      slug: string | null;
      logo_url: string | null;
      category: string | null;
      sector: string | null;
      description: string | null;
      contact_situations: { title: string; description: string; icon: string }[];
      contactName: string | null;
    };
  };
}

export async function getPartnerDiscovery(
  supabase: SupabaseClient,
  userId: string,
): Promise<PartnerDiscoveryData | null> {
  const periodStart = parisTuesdayPeriodStart();

  const { data: current } = await supabase
    .from("partner_discoveries")
    .select("id, response, partner_id")
    .eq("user_id", userId)
    .eq("is_current", true)
    .maybeSingle();

  if (current) {
    const { data: partner } = await supabase
      .from("partners")
      .select("id, name, slug, logo_url, category, sector, description, contact_situations, status")
      .eq("id", current.partner_id)
      .single();

    if (partner && partner.status === "valide") {
      const { data: contacts } = await supabase
        .from("partner_contacts")
        .select("name")
        .eq("partner_id", partner.id)
        .eq("is_primary", true)
        .limit(1);

      return {
        discovery: {
          id: current.id,
          response: current.response,
          partner: {
            id: partner.id,
            name: partner.name,
            slug: partner.slug,
            logo_url: partner.logo_url,
            category: partner.category,
            sector: partner.sector,
            description: partner.description,
            contact_situations: (partner.contact_situations || []) as { title: string; description: string; icon: string }[],
            contactName: contacts?.[0]?.name || null,
          },
        },
      };
    }

    await supabase
      .from("partner_discoveries")
      .update({ is_current: false })
      .eq("id", current.id);
  }

  const { data: allPartners } = await supabase
    .from("partners")
    .select("id, name, slug, logo_url, category, sector, description, contact_situations")
    .eq("status", "valide");

  if (!allPartners || allPartners.length === 0) return null;

  const { data: history } = await supabase
    .from("partner_discoveries")
    .select("partner_id")
    .eq("user_id", userId);

  const seenIds = new Set((history || []).map((h) => h.partner_id));

  let eligible = allPartners.filter((p) => !seenIds.has(p.id));
  if (eligible.length === 0) eligible = allPartners;

  const allUserDiscoveries = await supabase
    .from("partner_discoveries")
    .select("partner_id")
    .eq("period_start", periodStart);

  const discoveryCounts = new Map<string, number>();
  for (const d of allUserDiscoveries.data || []) {
    discoveryCounts.set(
      d.partner_id,
      (discoveryCounts.get(d.partner_id) || 0) + 1,
    );
  }

  eligible.sort((a, b) => {
    const ca = discoveryCounts.get(a.id) || 0;
    const cb = discoveryCounts.get(b.id) || 0;
    if (ca !== cb) return ca - cb;
    return Math.random() - 0.5;
  });

  const chosen = eligible[0];

  const { data: newDisc } = await supabase
    .from("partner_discoveries")
    .insert({
      user_id: userId,
      partner_id: chosen.id,
      period_start: periodStart,
      is_current: true,
      response: "proposee",
    })
    .select("id, response")
    .single();

  if (!newDisc) return null;

  const { data: contacts } = await supabase
    .from("partner_contacts")
    .select("name")
    .eq("partner_id", chosen.id)
    .eq("is_primary", true)
    .limit(1);

  return {
    discovery: {
      id: newDisc.id,
      response: newDisc.response,
      partner: {
        id: chosen.id,
        name: chosen.name,
        slug: chosen.slug,
        logo_url: chosen.logo_url,
        category: chosen.category,
        sector: chosen.sector,
        description: chosen.description,
        contact_situations: (chosen.contact_situations || []) as { title: string; description: string; icon: string }[],
        contactName: contacts?.[0]?.name || null,
      },
    },
  };
}

// ============================================================
// 4. Action partenaire (état de la fiche)
// ============================================================

export interface PartnerFicheAction {
  type: "unpublished" | "improvement" | "draft_pending" | "complete";
  title: string;
  text: string;
  buttonLabel: string;
  buttonHref: string;
  section?: string;
}

export async function getPartnerFicheAction(
  supabase: SupabaseClient,
  userId: string,
): Promise<PartnerFicheAction | null> {
  const { data: membership } = await supabase
    .from("partner_members")
    .select("partner_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;

  const { data: partner } = await supabase
    .from("partners")
    .select("id, status, slug, logo_url, cover_photo, description, contact_situations, name")
    .eq("id", membership.partner_id)
    .single();

  if (!partner) return null;

  if (partner.status === "brouillon") {
    const hasMinimal = partner.name && partner.description;
    return {
      type: "unpublished",
      title: "Faites découvrir votre activité au réseau",
      text: "Complétez votre fiche pour permettre aux conseillers de comprendre votre métier et de savoir quand faire appel à vous.",
      buttonLabel: hasMinimal ? "Publier ma fiche" : "Compléter ma fiche",
      buttonHref: "/espace/partenaires",
    };
  }

  if (partner.status === "soumis") {
    return {
      type: "draft_pending",
      title: "Votre fiche est en cours de validation",
      text: "Vos modifications seront visibles une fois validées par l'équipe.",
      buttonLabel: "Voir ma fiche",
      buttonHref: "/espace/partenaires",
    };
  }

  if (partner.status === "valide") {
    if (!partner.logo_url && !partner.cover_photo) {
      return {
        type: "improvement",
        title: "Ajoutez votre photo",
        text: "Ajoutez votre photo pour que les conseillers vous reconnaissent au château.",
        buttonLabel: "Ajouter ma photo",
        buttonHref: "/espace/partenaires",
        section: "photos",
      };
    }

    const situations = partner.contact_situations as unknown[];
    if (!situations || (Array.isArray(situations) && situations.length === 0)) {
      return {
        type: "improvement",
        title: "Donnez un exemple concret",
        text: "Donnez un exemple de situation dans laquelle vous pouvez accompagner un conseiller ou son client.",
        buttonLabel: "Ajouter un exemple",
        buttonHref: "/espace/partenaires",
        section: "contact_situations",
      };
    }

    if (!partner.description) {
      return {
        type: "improvement",
        title: "Présentez votre activité",
        text: "Présentez votre activité en quelques mots pour que les conseillers comprennent votre métier.",
        buttonLabel: "Ajouter une description",
        buttonHref: "/espace/partenaires",
        section: "entreprise",
      };
    }

    return {
      type: "complete",
      title: "Votre fiche est prête à être découverte",
      text: "Les conseillers peuvent découvrir votre activité sur le site.",
      buttonLabel: "Voir ma fiche",
      buttonHref: partner.slug ? `/partenaires/${partner.slug}` : "/espace/partenaires",
    };
  }

  return null;
}
