import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/supabase/types";

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  const roles = (profile as { roles: UserRole[] } | null)?.roles ?? [];
  if (!roles.includes("admin") && !roles.includes("gestionnaire_membres")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await request.json();
  const { email, firstName, lastName } = body;

  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  if (inviteData.user) {
    await adminClient.from("profiles").update({
      first_name: firstName || "",
      last_name: lastName || "",
      member_status: "en_attente",
    }).eq("id", inviteData.user.id);
  }

  return NextResponse.json({ success: true });
}
