import { NextResponse } from "next/server";
import { getCurrentUser, canManageEvents } from "@/lib/supabase/auth";
import { getAdminClient } from "@/lib/mardi";

export async function POST(request: Request) {
  const profile = await getCurrentUser();
  if (!profile || !canManageEvents(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { sessionId } = await request.json();
  const admin = getAdminClient();

  const { data: session } = await admin
    .from("tuesday_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session || session.status !== "active") {
    return NextResponse.json({ error: "Séance non active" }, { status: 400 });
  }

  if (session.current_property_id) {
    const { data: currentProp } = await admin
      .from("tuesday_session_properties")
      .select("status")
      .eq("id", session.current_property_id)
      .single();

    if (currentProp?.status === "en_cours") {
      return NextResponse.json(
        { error: "Validez ou passez le bien en cours pour continuer" },
        { status: 400 },
      );
    }
  }

  const { data: allProps } = await admin
    .from("tuesday_session_properties")
    .select("id, owner_id, status")
    .eq("session_id", sessionId);

  if (!allProps || allProps.length === 0) {
    return NextResponse.json({ error: "Aucun bien" }, { status: 400 });
  }

  const eligible = allProps.filter((p) => p.status === "a_presenter");
  if (eligible.length === 0) {
    return NextResponse.json({ error: "no_eligible", remaining_skipped: allProps.filter((p) => p.status === "mis_de_cote").length }, { status: 200 });
  }

  // Fairness: count presented per owner
  const ownerPresentedCount: Record<string, number> = {};
  for (const p of allProps) {
    if (p.status === "presente") {
      ownerPresentedCount[p.owner_id] = (ownerPresentedCount[p.owner_id] || 0) + 1;
    }
  }

  // Determine round for each eligible property
  const withRound = eligible.map((p) => ({
    ...p,
    round: ownerPresentedCount[p.owner_id] || 0,
  }));

  const minRound = Math.min(...withRound.map((p) => p.round));
  let candidates = withRound.filter((p) => p.round === minRound);

  // Avoid consecutive same counselor
  const lastPresented = allProps
    .filter((p) => p.status === "presente")
    .sort((a, b) => {
      const da = (a as Record<string, unknown>).draw_order as number | null;
      const db = (b as Record<string, unknown>).draw_order as number | null;
      return (db ?? 0) - (da ?? 0);
    })[0];

  if (lastPresented && candidates.length > 1) {
    const filtered = candidates.filter((c) => c.owner_id !== lastPresented.owner_id);
    if (filtered.length > 0) candidates = filtered;
  }

  // Random pick
  const picked = candidates[Math.floor(Math.random() * candidates.length)];

  // Get the next draw_order
  const maxOrder = Math.max(0, ...allProps.map((p) => ((p as Record<string, unknown>).draw_order as number) || 0));

  // Atomically update: set property to en_cours + set session current_property_id
  const { data: updated, error: updateErr } = await admin
    .from("tuesday_session_properties")
    .update({ status: "en_cours", draw_order: maxOrder + 1 })
    .eq("id", picked.id)
    .eq("status", "a_presenter")
    .select()
    .single();

  if (updateErr || !updated) {
    return NextResponse.json({ error: "Conflit - réessayez" }, { status: 409 });
  }

  await admin
    .from("tuesday_sessions")
    .update({
      current_property_id: picked.id,
      timer_state: { status: "ready", remaining_ms: 60000, started_at: null },
    })
    .eq("id", sessionId);

  // Return the full property data
  const { data: fullProp } = await admin
    .from("tuesday_session_properties")
    .select("*, shared_properties:property_id(id, iad_url, transaction_type, property_type, city, postal_code, price, living_area, land_area, rooms, bedrooms, description, photo_url), profiles:owner_id(id, first_name, last_name, email, photo_url)")
    .eq("id", picked.id)
    .single();

  return NextResponse.json({ drawn: fullProp });
}
