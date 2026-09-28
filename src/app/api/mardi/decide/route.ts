import { NextResponse } from "next/server";
import { getCurrentUser, canManageEvents } from "@/lib/supabase/auth";
import { getAdminClient } from "@/lib/mardi";

export async function POST(request: Request) {
  const profile = await getCurrentUser();
  if (!profile || !canManageEvents(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { sessionId, propertyId, decision } = await request.json();
  if (!sessionId || !propertyId || !["presente", "mis_de_cote", "a_presenter"].includes(decision)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const admin = getAdminClient();

  const { data: session } = await admin
    .from("tuesday_sessions")
    .select("status, current_property_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.status !== "active") {
    return NextResponse.json({ error: "Séance non active" }, { status: 400 });
  }

  if (decision === "a_presenter") {
    // Undo skip: reintegrate a skipped property
    const { error } = await admin
      .from("tuesday_session_properties")
      .update({ status: "a_presenter", draw_order: null })
      .eq("id", propertyId)
      .eq("session_id", sessionId)
      .eq("status", "mis_de_cote");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Verify this is the current property
  if (session.current_property_id !== propertyId) {
    return NextResponse.json({ error: "Ce n'est pas le bien en cours" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { status: decision };
  if (decision === "presente") {
    updateData.presented_at = new Date().toISOString();
  }

  const { error: propErr } = await admin
    .from("tuesday_session_properties")
    .update(updateData)
    .eq("id", propertyId)
    .eq("status", "en_cours");

  if (propErr) return NextResponse.json({ error: propErr.message }, { status: 500 });

  // Clear current property
  const { error: sessErr } = await admin
    .from("tuesday_sessions")
    .update({
      current_property_id: null,
      timer_state: { status: "ready", remaining_ms: 60000, started_at: null },
    })
    .eq("id", sessionId);

  if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
