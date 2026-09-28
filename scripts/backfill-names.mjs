/**
 * Met à jour les prénoms/noms manquants dans les profils
 * en les dérivant de l'adresse email IAD (prenom.nom@iadfrance.fr).
 *
 * Usage : node scripts/backfill-names.mjs
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

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function emailToName(email) {
  const local = email.split("@")[0];
  const parts = local.split(".");
  if (parts.length < 2) return null;
  const firstName = parts[0].split("-").map(capitalize).join("-");
  const lastName = parts.slice(1).join(" ").split("-").map(capitalize).join("-");
  return { firstName: capitalize(firstName), lastName: lastName.toUpperCase() };
}

async function main() {
  console.log("=== Backfill des prénoms/noms ===\n");

  // Récupérer tous les profils sans nom
  let offset = 0;
  let allProfiles = [];
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id,email,first_name,last_name&order=created_at&offset=${offset}&limit=500`,
      { headers },
    );
    const data = await res.json();
    allProfiles.push(...data);
    if (data.length < 500) break;
    offset += 500;
  }

  const toUpdate = allProfiles.filter(
    (p) => (!p.first_name || !p.last_name) && p.email?.includes("@iadfrance.fr"),
  );

  console.log(`${allProfiles.length} profils au total, ${toUpdate.length} sans nom à corriger\n`);

  let updated = 0;
  for (const profile of toUpdate) {
    const names = emailToName(profile.email);
    if (!names) continue;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        first_name: names.firstName,
        last_name: names.lastName,
      }),
    });

    if (res.ok) {
      console.log(`  ✓ ${profile.email} → ${names.firstName} ${names.lastName}`);
      updated++;
    } else {
      console.log(`  ✗ ${profile.email} — erreur`);
    }
  }

  console.log(`\n✅ ${updated} profil(s) mis à jour`);
}

main().catch(console.error);
