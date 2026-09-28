import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/supabase/types";

const DEFAULT_PASSWORD = process.env.PARTNER_DEFAULT_PASSWORD || "Roazhonkastell35";

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

  // Vérifier si le compte existe déjà
  const { data: existingUsers } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (existing) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 400 });
  }

  const { data: createData, error: createError } =
    await adminClient.auth.admin.createUser({
      email: email.toLowerCase(),
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: firstName || "", last_name: lastName || "" },
    });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  if (createData.user) {
    await adminClient.from("profiles").update({
      first_name: firstName || "",
      last_name: lastName || "",
      member_status: "actif",
    }).eq("id", createData.user.id);
  }

  return NextResponse.json({ success: true });
}
