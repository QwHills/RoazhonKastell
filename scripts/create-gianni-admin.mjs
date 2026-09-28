/**
 * Crée le compte admin de Gianni Schiariti.
 * Usage : node scripts/create-gianni-admin.mjs
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

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

const GIANNI = {
  email: "gianni.schiariti@iadfrance.fr",
  firstName: "Gianni",
  lastName: "Schiariti",
  roles: ["admin"],
  password: "Roazhonkastell35",
};

async function main() {
  console.log("=== Création du compte admin Gianni Schiariti ===\n");

  // Vérifier si le user existe déjà
  let page = 1;
  let allUsers = [];
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=500`, { headers });
    const data = await res.json();
    const users = data?.users || [];
    allUsers.push(...users);
    if (users.length < 500) break;
    page++;
  }

  const existing = allUsers.find((u) => u.email === GIANNI.email);
  let userId;

  if (existing) {
    userId = existing.id;
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ password: GIANNI.password }),
    });
    console.log(`  ↻ ${GIANNI.email} — compte existant, mot de passe mis à jour`);
  } else {
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: GIANNI.email,
        password: GIANNI.password,
        email_confirm: true,
        user_metadata: { first_name: GIANNI.firstName, last_name: GIANNI.lastName },
      }),
    });
    const created = await createRes.json();
    if (!created.id) {
      console.error("  ✗ Erreur :", created.msg || created.message || JSON.stringify(created));
      process.exit(1);
    }
    userId = created.id;
    console.log(`  ✓ ${GIANNI.email} — compte créé`);
  }

  // Profil
  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, { headers });
  const profData = await profRes.json();

  const profilePayload = {
    first_name: GIANNI.firstName,
    last_name: GIANNI.lastName,
    roles: GIANNI.roles,
    member_status: "actif",
    iad_slug: "gianni.schiariti",
  };

  if (profData.length > 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(profilePayload),
    });
    console.log("  ✓ Profil mis à jour avec le rôle admin");
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: userId,
        email: GIANNI.email,
        ...profilePayload,
      }),
    });
    console.log("  ✓ Profil créé avec le rôle admin");
  }

  console.log(`\n✅ Gianni Schiariti peut se connecter avec :`);
  console.log(`   Email : ${GIANNI.email}`);
  console.log(`   Mot de passe : ${GIANNI.password}`);
  console.log(`   Rôles : ${GIANNI.roles.join(", ")}`);
  console.log(`\n   Il aura accès à : Membres, Partenaires, Finances, Événements, Biens du mardi`);
}

main().catch(console.error);
