import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canViewReunions } from "@/lib/supabase/auth";

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canViewReunions(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { meeting_id, response } = await req.json();

  if (!meeting_id || !["present", "absent", "en_attente"].includes(response)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_attendees")
    .upsert(
      { meeting_id, user_id: profile.id, response, updated_at: new Date().toISOString() },
      { onConflict: "meeting_id,user_id" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
