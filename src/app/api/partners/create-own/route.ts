import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/supabase/auth";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const profile = await getCurrentUser();
  if (!profile || !hasRole(profile, "partenaire")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { name, category } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Vérifier que le partenaire n'a pas déjà une fiche
  const { data: existing } = await adminClient
    .from("partner_members")
    .select("partner_id")
    .eq("user_id", profile.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Vous avez déjà une fiche partenaire." }, { status: 400 });
  }

  const { data: partner, error: partnerError } = await adminClient
    .from("partners")
    .insert({
      name: name.trim(),
      category: category?.trim() || null,
      status: "brouillon",
      remuneration: false,
    })
    .select("id")
    .single();

  if (partnerError || !partner) {
    return NextResponse.json({ error: partnerError?.message || "Erreur création" }, { status: 500 });
  }

  await adminClient
    .from("partner_members")
    .insert({ partner_id: partner.id, user_id: profile.id });

  return NextResponse.json({ ok: true, partnerId: partner.id });
}
