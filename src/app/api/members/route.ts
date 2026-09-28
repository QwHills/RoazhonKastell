import { NextResponse } from "next/server";
import { getCurrentUser, canManageMembers } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();

  // Supprimer le profil
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Supprimer le user auth via l'admin API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
