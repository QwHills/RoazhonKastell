import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser, isAdmin, canManageMembers } from "@/lib/supabase/auth";
import { scrapeIadProfilePhoto } from "@/lib/iad-utils";

export async function POST(request: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || (!isAdmin(profile) && !canManageMembers(profile))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paths, memberId } = await request.json();
  if (!Array.isArray(paths)) {
    return NextResponse.json({ error: "Invalid paths" }, { status: 400 });
  }

  const allowed = ["/conseillers", "/partenaires"];
  for (const p of paths) {
    if (allowed.includes(p)) {
      revalidatePath(p);
    }
  }

  if (memberId) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: member } = await adminClient
      .from("profiles")
      .select("first_name, last_name, photo_url, member_status")
      .eq("id", memberId)
      .single();

    if (member && member.member_status === "actif" && !member.photo_url) {
      scrapeIadProfilePhoto(member.first_name, member.last_name).then((photoUrl) => {
        if (photoUrl) {
          adminClient.from("profiles").update({ photo_url: photoUrl }).eq("id", memberId);
        }
      }).catch(() => {});
    }
  }

  return NextResponse.json({ revalidated: true });
}
