import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getAdminClient } from "@/lib/mardi";

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image requise" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "5 Mo maximum" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${profile.id}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getAdminClient();

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ photo_url: urlData.publicUrl })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url: urlData.publicUrl });
}

export async function DELETE() {
  const profile = await getCurrentUser();
  if (!profile) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = getAdminClient();

  await supabase
    .from("profiles")
    .update({ photo_url: null })
    .eq("id", profile.id);

  return NextResponse.json({ ok: true });
}
