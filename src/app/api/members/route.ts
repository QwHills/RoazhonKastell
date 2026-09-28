import { NextResponse } from "next/server";
import { getCurrentUser, canManageMembers } from "@/lib/supabase/auth";
import { getAdminClient } from "@/lib/mardi";

export async function DELETE(request: Request) {
  const profile = await getCurrentUser();
  if (!profile || !canManageMembers(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId manquant" }, { status: 400 });
  }

  if (userId === profile.id) {
    return NextResponse.json({ error: "Impossible de supprimer votre propre compte" }, { status: 400 });
  }

  const admin = getAdminClient();

  await admin.from("events").update({ created_by: profile.id }).eq("created_by", userId);
  await admin.from("atelier_actions").update({ validated_by: null }).eq("validated_by", userId);

  const { error: profileError } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await admin.auth.admin.deleteUser(userId);

  return NextResponse.json({ ok: true });
}
