import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, canViewReunions } from "@/lib/supabase/auth";
import { getAdminClient } from "@/lib/mardi";

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canViewReunions(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const meetingId = formData.get("meeting_id") as string | null;

  if (!file || !meetingId) {
    return NextResponse.json({ error: "Fichier et meeting_id requis" }, { status: 400 });
  }

  if (file.size > 100 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (100 Mo max)" }, { status: 400 });
  }

  const ext = file.type === "audio/webm" ? "webm" : file.type === "audio/mp4" ? "m4a" : "webm";
  const path = `meetings/${meetingId}/audio-${Date.now()}.${ext}`;

  const admin = getAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("photos")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("photos").getPublicUrl(path);

  const { error: updateError } = await admin
    .from("meetings")
    .update({ audio_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", meetingId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url: urlData.publicUrl });
}
