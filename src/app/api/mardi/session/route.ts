import { NextResponse } from "next/server";
import { getCurrentUser, canManageEvents, hasRole } from "@/lib/supabase/auth";
import { getAdminClient, getNextTuesdayDate } from "@/lib/mardi";

export async function GET(request: Request) {
  const profile = await getCurrentUser();
  if (!profile) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date") || getNextTuesdayDate();
  const admin = getAdminClient();

  let { data: session } = await admin
    .from("tuesday_sessions")
    .select("*")
    .eq("session_date", dateParam)
    .single();

  if (!session) {
    const { data: created, error } = await admin
      .from("tuesday_sessions")
      .insert({ session_date: dateParam })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    session = created;
  }

  // If session is completed, counselors see next week — but only after 9:30 AM Paris time on session day
  if (session.status === "completed" && dateParam === getNextTuesdayDate()) {
    const role = url.searchParams.get("role");
    if (role === "conseiller") {
      const now = new Date();
      const dateFmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
      });
      const todayParis = dateFmt.format(now);

      let shouldJump = todayParis > dateParam;
      if (!shouldJump && todayParis === dateParam) {
        const timeFmt = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false,
        });
        const [h, m] = timeFmt.format(now).split(":").map(Number);
        shouldJump = h > 9 || (h === 9 && m >= 30);
      }

      if (shouldJump) {
        const nextWeek = new Date(dateParam + "T12:00:00");
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextDate = nextWeek.toISOString().split("T")[0];

        let { data: nextSession } = await admin
          .from("tuesday_sessions")
          .select("*")
          .eq("session_date", nextDate)
          .single();
        if (!nextSession) {
          const { data: created } = await admin
            .from("tuesday_sessions")
            .insert({ session_date: nextDate })
            .select()
            .single();
          nextSession = created;
        }
        session = nextSession;
      }
    }
  }

  const { data: sessionProperties } = await admin
    .from("tuesday_session_properties")
    .select("*, shared_properties:property_id(id, iad_url, transaction_type, property_type, city, postal_code, price, living_area, land_area, rooms, bedrooms, description, photo_url, photos, dpe_energy_class, dpe_energy_value, dpe_ges_class, dpe_ges_value, address, latitude, longitude, status), profiles:owner_id(id, first_name, last_name, email, photo_url)")
    .eq("session_id", session.id)
    .order("created_at");

  return NextResponse.json({ session, properties: sessionProperties || [] });
}

export async function POST(request: Request) {
  const profile = await getCurrentUser();
  if (!profile) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json();
  const { action, sessionId } = body;
  const admin = getAdminClient();

  if (action === "start") {
    if (!canManageEvents(profile)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data: session } = await admin
      .from("tuesday_sessions")
      .select("status")
      .eq("id", sessionId)
      .single();

    if (!session || session.status !== "preparation") {
      return NextResponse.json({ error: "La séance ne peut pas être lancée" }, { status: 400 });
    }

    const { error } = await admin
      .from("tuesday_sessions")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("status", "preparation");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "complete") {
    if (!canManageEvents(profile)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error } = await admin
      .from("tuesday_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        current_property_id: null,
      })
      .eq("id", sessionId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "resume") {
    if (!canManageEvents(profile)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    const { error } = await admin
      .from("tuesday_sessions")
      .update({ status: "active", completed_at: null })
      .eq("id", sessionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "reset") {
    if (!canManageEvents(profile)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    const { error } = await admin
      .from("tuesday_sessions")
      .update({ status: "preparation", started_at: null, completed_at: null, current_property_id: null })
      .eq("id", sessionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await admin
      .from("tuesday_session_properties")
      .update({ status: "a_presenter", draw_order: null, presented_at: null })
      .eq("session_id", sessionId);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
