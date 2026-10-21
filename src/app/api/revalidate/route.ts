import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdmin, canManageMembers } from "@/lib/supabase/auth";

export async function POST(request: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || (!isAdmin(profile) && !canManageMembers(profile))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paths } = await request.json();
  if (!Array.isArray(paths)) {
    return NextResponse.json({ error: "Invalid paths" }, { status: 400 });
  }

  const allowed = ["/conseillers", "/partenaires"];
  for (const p of paths) {
    if (allowed.includes(p)) {
      revalidatePath(p);
    }
  }

  return NextResponse.json({ revalidated: true });
}
