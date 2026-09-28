import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/supabase/auth";
import { getAdminClient } from "@/lib/mardi";

const MAX_PER_COUNSELOR = 3;

export async function POST(request: Request) {
  const profile = await getCurrentUser();
  if (!profile || hasRole(profile, "partenaire")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { sessionId, propertyId } = await request.json();
  if (!sessionId || !propertyId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const admin = getAdminClient();

  const { data: session } = await admin
    .from("tuesday_sessions")
    .select("status")
    .eq("id", sessionId)
    .single();

  if (!session || session.status !== "preparation") {
    return NextResponse.json({ error: "La séance est déjà lancée ou terminée" }, { status: 400 });
  }

  const { data: property } = await admin
    .from("shared_properties")
    .select("id, owner_id")
    .eq("id", propertyId)
    .single();

  if (!property || property.owner_id !== profile.id) {
    return NextResponse.json({ error: "Bien non trouvé ou non autorisé" }, { status: 403 });
  }

  const { count } = await admin
    .from("tuesday_session_properties")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("owner_id", profile.id);

  if ((count || 0) >= MAX_PER_COUNSELOR) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PER_COUNSELOR} biens par séance` },
      { status: 400 },
    );
  }

  const { error } = await admin
    .from("tuesday_session_properties")
    .insert({
      session_id: sessionId,
      property_id: propertyId,
      owner_id: profile.id,
    });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ce bien est déjà inscrit" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const profile = await getCurrentUser();
  if (!profile) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { sessionPropertyId } = await request.json();
  if (!sessionPropertyId) {
    return NextResponse.json({ error: "Paramètre manquant" }, { status: 400 });
  }

  const admin = getAdminClient();

  const { data: sp } = await admin
    .from("tuesday_session_properties")
    .select("id, owner_id, session_id")
    .eq("id", sessionPropertyId)
    .single();

  if (!sp || sp.owner_id !== profile.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { data: session } = await admin
    .from("tuesday_sessions")
    .select("status")
    .eq("id", sp.session_id)
    .single();

  if (!session || session.status !== "preparation") {
    return NextResponse.json({ error: "La séance est déjà lancée" }, { status: 400 });
  }

  const { error } = await admin
    .from("tuesday_session_properties")
    .delete()
    .eq("id", sessionPropertyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
