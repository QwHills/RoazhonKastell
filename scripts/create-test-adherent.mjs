/**
 * Crée un compte test adhérent et génère un lien de connexion.
 * Utilise l'API REST Supabase directement (pas de dépendance au SDK).
 * Usage : node scripts/create-test-adherent.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");

function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim() : null;
}

const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Variables manquantes dans .env.local");
  process.exit(1);
}

const TEST_EMAIL = "test-adherent@roazhonkastell.test";

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

async function adminRequest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data: body };
}

async function main() {
  // 1. Lister les utilisateurs pour vérifier si le compte test existe
  const listRes = await adminRequest("/auth/v1/admin/users?page=1&per_page=500");
  if (!listRes.ok) {
    console.error("Erreur listing users:", listRes.data);
    process.exit(1);
  }

  const users = listRes.data?.users || listRes.data || [];
  const existing = users.find((u) => u.email === TEST_EMAIL);
  let userId;

  if (existing) {
    console.log("Compte test existant :", existing.id);
    userId = existing.id;
  } else {
    // 2. Créer l'utilisateur
    const createRes = await adminRequest("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: TEST_EMAIL,
        email_confirm: true,
        user_metadata: { first_name: "Test", last_name: "Adhérent" },
      }),
    });

    if (!createRes.ok) {
      console.error("Erreur création :", createRes.data);
      process.exit(1);
    }

    userId = createRes.data.id;
    console.log("Compte test créé :", userId);
  }

  // 3. Mettre à jour le profil
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: "GET",
      headers: { ...headers, Prefer: "return=representation" },
    },
  );
  const profileData = await profileRes.json();

  if (profileData.length === 0) {
    // Insérer
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        id: userId,
        email: TEST_EMAIL,
        first_name: "Test",
        last_name: "Adhérent",
        roles: ["adherent"],
        member_status: "actif",
        city: "Rennes",
      }),
    });
    if (!insertRes.ok) {
      const err = await insertRes.json().catch(() => null);
      console.error("Erreur insert profil :", err);
    } else {
      console.log("Profil créé : rôle adherent, statut actif");
    }
  } else {
    // Mettre à jour
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          roles: ["adherent"],
          member_status: "actif",
        }),
      },
    );
    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => null);
      console.error("Erreur update profil :", err);
    } else {
      console.log("Profil mis à jour : rôle adherent, statut actif");
    }
  }

  // 4. Générer un magic link
  const linkRes = await adminRequest("/auth/v1/admin/generate_link", {
    method: "POST",
    body: JSON.stringify({
      type: "magiclink",
      email: TEST_EMAIL,
      options: {
        redirect_to: "http://localhost:3000/auth/callback?next=/espace",
      },
    }),
  });

  if (!linkRes.ok) {
    console.error("Erreur lien :", linkRes.data);
    process.exit(1);
  }

  const actionLink =
    linkRes.data?.properties?.action_link || linkRes.data?.action_link;

  if (!actionLink) {
    console.error("Pas de lien retourné. Réponse :", JSON.stringify(linkRes.data, null, 2));
    process.exit(1);
  }

  console.log("\n========================================");
  console.log("Ouvrez ce lien dans votre navigateur :");
  console.log(actionLink);
  console.log("========================================");
  console.log("(Vous serez connecté et redirigé vers /espace)\n");
}

main().catch(console.error);
