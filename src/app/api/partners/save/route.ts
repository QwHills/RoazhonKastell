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

function generateSlug(name: string): string {
  const accents: Record<string, string> = {
    à: "a", á: "a", â: "a", ã: "a", ä: "a", å: "a",
    è: "e", é: "e", ê: "e", ë: "e",
    ì: "i", í: "i", î: "i", ï: "i",
    ò: "o", ó: "o", ô: "o", õ: "o", ö: "o",
    ù: "u", ú: "u", û: "u", ü: "u",
    ý: "y", ÿ: "y", ñ: "n", ç: "c",
  };
  return name
    .toLowerCase()
    .split("")
    .map((c) => accents[c] || c)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const profile = await getCurrentUser();
  if (!profile) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const isManager = canManageMembers(profile);
  const isPartner = hasRole(profile, "partenaire");

  if (!isManager && !isPartner) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await request.json();
  const { partnerId, partner: partnerData, contacts } = body;

  if (!partnerId) {
    return NextResponse.json({ error: "ID partenaire requis" }, { status: 400 });
  }

  const admin = getAdminClient();

  if (isPartner && !isManager) {
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

  let slug = partnerData.slug;
  if (!slug && partnerData.name) {
    slug = generateSlug(partnerData.name);
    const { data: existing } = await admin
      .from("partners")
      .select("id")
      .eq("slug", slug)
      .neq("id", partnerId)
      .single();
    if (existing) {
      slug = slug + "-" + partnerId.slice(0, 6);
    }
  }

  const { error: partnerError } = await admin
    .from("partners")
    .update({
      name: partnerData.name,
      slug,
      tagline: partnerData.tagline || null,
      category: partnerData.category || null,
      sector: partnerData.sector || null,
      description: partnerData.description || null,
      services: partnerData.services || null,
      contact_reason: partnerData.contact_reason || null,
      coverage_area: partnerData.coverage_area || null,
      website: partnerData.website || null,
      social_links: partnerData.social_links || {},
      logo_url: partnerData.logo_url || null,
      cover_photo: partnerData.cover_photo || null,
      photos: partnerData.photos || [],
      why_choose_us: partnerData.why_choose_us || null,
      why_choose_us_points: partnerData.why_choose_us_points || [],
      contact_situations: partnerData.contact_situations || [],
      remuneration: partnerData.remuneration ?? false,
      status: partnerData.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", partnerId);

  if (partnerError) {
    return NextResponse.json(
      { error: "Erreur sauvegarde : " + partnerError.message },
      { status: 500 },
    );
  }

  const { error: deleteError } = await admin
    .from("partner_contacts")
    .delete()
    .eq("partner_id", partnerId);

  if (deleteError) {
    return NextResponse.json(
      { error: "Erreur contacts : " + deleteError.message },
      { status: 500 },
    );
  }

  if (contacts && contacts.length > 0) {
    const { error: insertError } = await admin
      .from("partner_contacts")
      .insert(
        contacts.map((c: Record<string, unknown>, i: number) => ({
          partner_id: partnerId,
          name: c.name || "",
          role: c.role || null,
          phone: c.phone || null,
          email: c.email || null,
          note: c.note || null,
          photo_url: c.photo_url || null,
          is_primary: c.is_primary || false,
          sort_order: i,
        })),
      );

    if (insertError) {
      return NextResponse.json(
        { error: "Erreur insertion contacts : " + insertError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, slug });
}
