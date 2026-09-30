import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canViewReunions } from "@/lib/supabase/auth";

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canViewReunions(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { title, meeting_date, starts_time, ends_time, location, video_link, referent_id, status } = body;

  if (!title?.trim() || !meeting_date) {
    return NextResponse.json({ error: "Titre et date requis" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      title: title.trim(),
      meeting_date,
      starts_time: starts_time || null,
      ends_time: ends_time || null,
      location: location?.trim() || null,
      video_link: video_link?.trim() || null,
      referent_id: referent_id || null,
      status: status || "planifie",
      created_by: profile.id,
    })
    .select("*, profiles!meetings_created_by_fkey(first_name, last_name)")
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
    .from("meetings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, profiles!meetings_created_by_fkey(first_name, last_name)")
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
  const { error } = await supabase.from("meetings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
