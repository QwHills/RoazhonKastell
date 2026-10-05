import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/mardi";
import { getCurrentUser, isAdmin } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  const profile = await getCurrentUser();
  if (!profile) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await request.json();
  const { type, title, story, origin, property_id, stage, stage_date, photo_url, participants, financials } = body;

  if (!type || !title || !origin) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const supabase = getAdminClient();

  const { data: success, error } = await supabase
    .from("successes")
    .insert({
      type,
      title,
      story: story || null,
      origin,
      property_id: property_id || null,
      stage: stage || "en_cours",
      stage_date: stage_date || null,
      photo_url: photo_url || null,
      status: body.submit ? "publie" : "brouillon",
      declared_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from("success_participants").insert({
    success_id: success.id,
    user_id: profile.id,
    role: "declarant",
    confirmation_status: "confirme",
    publish_consent: true,
    confirmed_at: new Date().toISOString(),
  });

  if (participants && Array.isArray(participants)) {
    for (const p of participants) {
      await supabase.from("success_participants").insert({
        success_id: success.id,
        user_id: p.user_id || null,
        partner_id: p.partner_id || null,
        role: p.role || "contributeur",
        confirmation_status: "confirme",
        publish_consent: true,
        confirmed_at: new Date().toISOString(),
      });
    }
  }

  if (financials && type === "vente_partage") {
    await supabase.from("success_financials").upsert({
      success_id: success.id,
      user_id: profile.id,
      total_fees: financials.total_fees || null,
      share_percent: financials.share_percent ?? 50,
    });
  }

  return NextResponse.json({ success: true, id: success.id });
}

export async function PATCH(request: Request) {
  const profile = await getCurrentUser();
  if (!profile) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await request.json();
  const { id, action, ...fields } = body;

  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const supabase = getAdminClient();
  const admin = isAdmin(profile);

  if (action === "unpublish" && admin) {
    await supabase.from("successes").update({ status: "brouillon" }).eq("id", id);
    return NextResponse.json({ success: true });
  }

  if (action === "feature" && admin) {
    await supabase.from("successes").update({ featured: false }).neq("id", id);
    await supabase.from("successes").update({ featured: true }).eq("id", id);
    return NextResponse.json({ success: true });
  }

  if (action === "update_financials") {
    await supabase.from("success_financials").upsert({
      success_id: id,
      user_id: profile.id,
      total_fees: fields.total_fees ?? null,
      share_percent: fields.share_percent ?? 50,
      actual_amount: fields.actual_amount ?? null,
      encashment_date: fields.encashment_date ?? null,
    }, { onConflict: "success_id,user_id" });

    return NextResponse.json({ success: true });
  }

  if (action === "update_stage") {
    const { data: s } = await supabase.from("successes").select("declared_by").eq("id", id).single();
    if (!s || (s.declared_by !== profile.id && !admin)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const update: Record<string, unknown> = {};
    if (fields.stage) update.stage = fields.stage;
    if (fields.stage_date) update.stage_date = fields.stage_date;
    if (fields.title) update.title = fields.title;
    if (fields.story !== undefined) update.story = fields.story;

    if (Object.keys(update).length > 0) {
      await supabase.from("successes").update(update).eq("id", id);
    }

    return NextResponse.json({ success: true });
  }

  const { data: s } = await supabase.from("successes").select("declared_by, status").eq("id", id).single();
  if (!s || (s.declared_by !== profile.id && !admin)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const allowed: Record<string, unknown> = {};
  if (fields.title) allowed.title = fields.title;
  if (fields.story !== undefined) allowed.story = fields.story;
  if (fields.origin) allowed.origin = fields.origin;
  if (fields.stage) allowed.stage = fields.stage;
  if (fields.stage_date !== undefined) allowed.stage_date = fields.stage_date;
  if (fields.photo_url !== undefined) allowed.photo_url = fields.photo_url;
  if (fields.status && (s.status === "brouillon" || admin)) allowed.status = fields.status;

  if (Object.keys(allowed).length > 0) {
    await supabase.from("successes").update(allowed).eq("id", id);
  }

  return NextResponse.json({ success: true });
}
