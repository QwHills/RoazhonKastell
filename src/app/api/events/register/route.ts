import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { eventId } = await request.json();
  if (!eventId) return NextResponse.json({ error: "eventId manquant" }, { status: 400 });

  const { data: existing } = await supabase
    .from("event_registrations")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing && existing.status === "inscrit") {
    return NextResponse.json({ already: true });
  }

  if (existing && existing.status === "annule") {
    await supabase
      .from("event_registrations")
      .update({ status: "inscrit", cancelled_at: null })
      .eq("id", existing.id);
    return NextResponse.json({ registered: true });
  }

  const { error } = await supabase
    .from("event_registrations")
    .insert({ event_id: eventId, user_id: user.id, status: "inscrit" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ registered: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { eventId } = await request.json();

  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "annule", cancelled_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cancelled: true });
}
