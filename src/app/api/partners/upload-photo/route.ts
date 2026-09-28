import { NextResponse } from "next/server";
import { getCurrentUser, hasRole, canManageMembers } from "@/lib/supabase/auth";
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
  if (!profile) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const isManager = canManageMembers(profile);
  const isPartner = hasRole(profile, "partenaire");

  if (!isManager && !isPartner) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const partnerId = formData.get("partnerId") as string | null;
  const type = (formData.get("type") as string) || "photo";

  if (!file || !partnerId) {
    return NextResponse.json({ error: "Fichier et ID requis" }, { status: 400 });
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (JPG, PNG, WebP)" }, { status: 400 });
  }

  const admin = getAdminClient();

  if (!isManager) {
    const { data: membership } = await admin
      .from("partner_members")
      .select("partner_id")
      .eq("user_id", profile.id)
      .eq("partner_id", partnerId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `properties/${partnerId}/${type}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("photos")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Erreur upload : " + uploadError.message },
      { status: 500 },
    );
  }

  const { data: urlData } = admin.storage
    .from("photos")
    .getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
}

export async function DELETE(request: Request) {
  const profile = await getCurrentUser();
  if (!profile) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const isManager = canManageMembers(profile);
  const isPartner = hasRole(profile, "partenaire");

  if (!isManager && !isPartner) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { filePath, partnerId } = await request.json();
  if (!filePath || !partnerId) {
    return NextResponse.json({ error: "Paramètres requis" }, { status: 400 });
  }

  const admin = getAdminClient();

  if (!isManager) {
    const { data: membership } = await admin
      .from("partner_members")
      .select("partner_id")
      .eq("user_id", profile.id)
      .eq("partner_id", partnerId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
  }

  const url = new URL(filePath);
  const pathParts = url.pathname.split("/storage/v1/object/public/photos/");
  const storagePath = pathParts[1];

  if (storagePath) {
    await admin.storage.from("photos").remove([storagePath]);
  }

  return NextResponse.json({ ok: true });
}
