import { NextResponse } from "next/server";
import { getCurrentUser, canManageMembers } from "@/lib/supabase/auth";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST(request: Request) {
  const profile = await getCurrentUser();
  if (!profile || !canManageMembers(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)" }, { status: 400 });
  }

  const admin = getAdminClient();
  const ext = file.name.split(".").pop() || "pdf";
  const fileName = `resources/${profile.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("photos")
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: "Erreur upload : " + uploadError.message },
      { status: 500 },
    );
  }

  const { data: urlData } = admin.storage.from("photos").getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
}
