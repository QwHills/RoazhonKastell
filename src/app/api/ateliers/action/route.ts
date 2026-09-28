import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canManageEvents } from "@/lib/supabase/auth";

export async function GET(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canManageEvents(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId requis" }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("atelier_actions")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canManageEvents(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { eventId, title, instruction, duration_minutes, resource_url, resource_title, validate } = body;

  if (!eventId || !title || !instruction) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const supabase = await createClient();

  const payload: Record<string, unknown> = {
    event_id: eventId,
    title,
    instruction,
    duration_minutes: duration_minutes || 15,
    resource_url: resource_url || null,
    resource_title: resource_title || null,
    status: validate ? "valide" : "brouillon",
    updated_at: new Date().toISOString(),
  };

  if (validate) {
    payload.validated_by = profile.id;
    payload.validated_at = new Date().toISOString();

    await supabase
      .from("atelier_actions")
      .update({ status: "archive", updated_at: new Date().toISOString() })
      .eq("event_id", eventId)
      .eq("status", "valide");
  }

  const { data, error } = await supabase
    .from("atelier_actions")
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canManageEvents(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { id, title, instruction, duration_minutes, resource_url, resource_title, validate } = body;

  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const supabase = await createClient();

  const payload: Record<string, unknown> = {
    title,
    instruction,
    duration_minutes,
    resource_url: resource_url || null,
    resource_title: resource_title || null,
    updated_at: new Date().toISOString(),
  };

  if (validate) {
    const { data: existing } = await supabase
      .from("atelier_actions")
      .select("event_id")
      .eq("id", id)
      .single();

    if (existing) {
      await supabase
        .from("atelier_actions")
        .update({ status: "archive", updated_at: new Date().toISOString() })
        .eq("event_id", existing.event_id)
        .eq("status", "valide")
        .neq("id", id);
    }

    payload.status = "valide";
    payload.validated_by = profile.id;
    payload.validated_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("atelier_actions")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
