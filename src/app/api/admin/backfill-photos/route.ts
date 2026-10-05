import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/supabase/auth";
import { getAdminClient } from "@/lib/mardi";
import { scrapeIadProfilePhoto } from "@/lib/iad-utils";
import PROFILES from "@/data/conseillers-profiles";
import { getIadSlug } from "@/lib/iad-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const profile = await getCurrentUser();
  if (!profile || !isAdmin(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const admin = getAdminClient();
  const { data: members } = await admin
    .from("profiles")
    .select("id, first_name, last_name, photo_url")
    .is("photo_url", null)
    .not("first_name", "is", null)
    .not("first_name", "eq", "");

  if (!members || members.length === 0) {
    return NextResponse.json({ updated: 0, message: "Tous les membres ont déjà une photo." });
  }

  const results: { name: string; status: string }[] = [];

  for (const m of members) {
    const slug = getIadSlug(m.first_name, m.last_name);
    let photoUrl: string | null = null;

    const staticProfile = PROFILES[slug];
    if (staticProfile?.photo) {
      photoUrl = staticProfile.photo;
    } else {
      photoUrl = await scrapeIadProfilePhoto(m.first_name, m.last_name);
    }

    if (photoUrl) {
      await admin
        .from("profiles")
        .update({ photo_url: photoUrl })
        .eq("id", m.id);
      results.push({ name: `${m.first_name} ${m.last_name}`, status: "ok" });
    } else {
      results.push({ name: `${m.first_name} ${m.last_name}`, status: "non trouvée" });
    }
  }

  return NextResponse.json({
    updated: results.filter((r) => r.status === "ok").length,
    total: members.length,
    results,
  });
}
