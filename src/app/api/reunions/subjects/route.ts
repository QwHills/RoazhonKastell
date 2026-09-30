import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canViewReunions } from "@/lib/supabase/auth";

export async function GET(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canViewReunions(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const meetingId = req.nextUrl.searchParams.get("meetingId");
  const supabase = await createClient();

  let query = supabase
    .from("meeting_subjects")
    .select("*, profiles!meeting_subjects_proposed_by_fkey(first_name, last_name)")
    .order("sort_order", { ascending: true });

  if (meetingId) {
    query = query.eq("meeting_id", meetingId);
  } else {
    query = query.is("meeting_id", null).eq("status", "propose");
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canViewReunions(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, meeting_id } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_subjects")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      meeting_id: meeting_id || null,
      proposed_by: profile.id,
      status: meeting_id ? "a_traiter" : "propose",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canViewReunions(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_subjects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canViewReunions(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("meeting_subjects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
