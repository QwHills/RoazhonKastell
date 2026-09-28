import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const TEST_ACCOUNTS: Record<string, { email: string; firstName: string; lastName: string; roles: string[] }> = {
  adherent: {
    email: "test-adherent@roazhonkastell.test",
    firstName: "Test",
    lastName: "Adhérent",
    roles: ["adherent"],
  },
  admin: {
    email: "test-admin@roazhonkastell.test",
    firstName: "Julien",
    lastName: "Test-Admin",
    roles: ["adherent", "gestionnaire_evenements"],
  },
};

// DEV ONLY — connexion directe au compte test
// Usage: /auth/dev-login?role=adherent (défaut) ou /auth/dev-login?role=admin
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "Missing env" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "adherent";
  const account = TEST_ACCOUNTS[role];
  if (!account) {
    return NextResponse.json({ error: "Role inconnu", available: Object.keys(TEST_ACCOUNTS) }, { status: 400 });
  }

  const testEmail = account.email;
  const adminHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  // Créer le user auth s'il n'existe pas
  const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=500`, { headers: adminHeaders });
  const listData = await listRes.json();
  const users = listData?.users || listData || [];
  const existing = users.find((u: { email: string }) => u.email === testEmail);

  let userId: string;
  if (existing) {
    userId = existing.id;
  } else {
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        email: testEmail,
        email_confirm: true,
        user_metadata: { first_name: account.firstName, last_name: account.lastName },
      }),
    });
    const created = await createRes.json();
    userId = created.id;
  }

  // Vérifier si le profil existe
  const profRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    headers: adminHeaders,
  });
  const profData = await profRes.json();

  if (profData.length > 0) {
    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({
        first_name: account.firstName,
        last_name: account.lastName,
        roles: account.roles,
        member_status: "actif",
      }),
    });
  } else {
    await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        id: userId,
        email: testEmail,
        first_name: account.firstName,
        last_name: account.lastName,
        roles: account.roles,
        member_status: "actif",
        city: "Rennes",
      }),
    });
  }

  // Générer un magic link via l'admin API
  const linkRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      type: "magiclink",
      email: testEmail,
    }),
  });

  if (!linkRes.ok) {
    const err = await linkRes.json().catch(() => null);
    return NextResponse.json({ error: "Link gen failed", details: err }, { status: 500 });
  }

  const linkData = await linkRes.json();
  const tokenHash = linkData?.hashed_token || linkData?.properties?.hashed_token;
  const emailOtp = linkData?.email_otp;

  if (!tokenHash && !emailOtp) {
    return NextResponse.json({ error: "No token", data: linkData }, { status: 500 });
  }

  // Vérifier l'OTP pour créer une session
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp(
    tokenHash
      ? { type: "magiclink", token_hash: tokenHash }
      : { type: "magiclink", email: testEmail, token: emailOtp! },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL("/espace", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
