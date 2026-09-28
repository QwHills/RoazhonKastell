/**
 * Crée les comptes de tous les conseillers et partenaires
 * avec le mot de passe par défaut.
 *
 * ⚠️  ÉCRIT DANS LA BASE SUPABASE (production).
 * Usage : node scripts/create-all-accounts.mjs [--dry-run]
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

const DRY_RUN = process.argv.includes("--dry-run");
const DEFAULT_PASSWORD = "Roazhonkastell35";

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

// ── Récupérer les conseillers depuis le Google Sheet ──

const SHEET_ID = "1FEwQ7MfgqKp3VIijuRNEQi_lTYKrBc4w";
const GID = "430186681";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

const EXTRA_MEMBERS = [
  ["Sonia", "Orhant"], ["Hélène", "Al Halabiya"], ["Islam", "Benaini"],
  ["Emilie", "Boudey"], ["Thibault", "Irlinger"], ["Loic", "Corbin"],
  ["Bernard", "Venevongsos"], ["Coralie", "Roulois"], ["Gaela", "Kuzminski"],
  ["Audrey", "Boura"], ["Anne-Sophie", "Coignard"], ["Alexandra", "Marais"],
  ["Alexandra", "Jugan"], ["Mael", "Guilleux"], ["Sandy-Ann", "Nepert"],
  ["Cédric", "Gorge"], ["Isabelle", "Scudeller"],
];

const EXCLUDED = new Set([
  "bochra.benjelloun", "erwan.roze", "tasnime.hassanaly", "mathieu.deuve",
  "marine.lequentrec", "nicolas.touboulic", "laura.martine", "celine.gavard",
  "patricia.hoareau", "walid.ulomi", "morgane.bendouma", "nicolas.giraud",
  "nicolas.schleich",
]);

function slugify(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "").toLowerCase();
}

function makeSlug(first, last) {
  return `${slugify(first)}.${slugify(last)}`;
}

function makeEmail(first, last) {
  return `${makeSlug(first, last)}@iadfrance.fr`;
}

function parseCSVSimple(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const fields = [];
    let field = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === "," && !inQ) { fields.push(field.trim()); field = ""; }
      else if (c !== "\r") { field += c; }
    }
    fields.push(field.trim());
    rows.push(fields);
  }
  return rows;
}

async function getConseillers() {
  const res = await fetch(CSV_URL);
  const text = await res.text();
  const rows = parseCSVSimple(text);

  const members = [];
  const slugsSeen = new Set();

  for (const cols of rows) {
    const first = (cols[0] || "").trim();
    const last = (cols[1] || "").trim();
    if (!first || !last) continue;
    const slug = makeSlug(first, last);
    if (EXCLUDED.has(slug) || slugsSeen.has(slug)) continue;
    slugsSeen.add(slug);
    members.push({ firstName: first, lastName: last, email: makeEmail(first, last), slug });
  }

  for (const [first, last] of EXTRA_MEMBERS) {
    const slug = makeSlug(first, last);
    if (slugsSeen.has(slug)) continue;
    slugsSeen.add(slug);
    members.push({ firstName: first, lastName: last, email: makeEmail(first, last), slug });
  }

  return members;
}

// ── Création des comptes ──

async function createAccount(member) {
  const { email, firstName, lastName, slug } = member;

  // Vérifier si le user auth existe déjà
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`, { headers });
  const listData = await listRes.json();
  const users = listData?.users || [];
  const existing = users.find((u) => u.email === email);

  let userId;

  if (existing) {
    userId = existing.id;
    // Mettre à jour le mot de passe
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ password: DEFAULT_PASSWORD }),
    });
    console.log(`  ↻ ${email} — mot de passe mis à jour`);
  } else {
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
      }),
    });
    const created = await createRes.json();
    if (!created.id) {
      console.error(`  ✗ ${email} — erreur :`, created.msg || created.message || JSON.stringify(created));
      return;
    }
    userId = created.id;
    console.log(`  ✓ ${email} — compte créé`);
  }

  // Upsert le profil
  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, { headers });
  const profData = await profRes.json();

  if (profData.length > 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ iad_slug: slug, member_status: "actif" }),
    });
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        iad_slug: slug,
        roles: ["adherent"],
        member_status: "actif",
      }),
    });
  }
}

async function main() {
  console.log(DRY_RUN ? "=== MODE DRY-RUN (aucune écriture) ===" : "=== CRÉATION DES COMPTES ===");
  console.log(`Base : ${SUPABASE_URL}\n`);

  const conseillers = await getConseillers();
  console.log(`${conseillers.length} conseillers trouvés\n`);

  if (DRY_RUN) {
    for (const m of conseillers) {
      console.log(`  ${m.firstName} ${m.lastName} → ${m.email}`);
    }
    console.log(`\nRelancez sans --dry-run pour créer les comptes.`);
    return;
  }

  // Charger la liste des users existants une seule fois
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

  for (const member of conseillers) {
    const existing = allUsers.find((u) => u.email === member.email);
    let userId;

    if (existing) {
      userId = existing.id;
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ password: DEFAULT_PASSWORD }),
      });
      console.log(`  ↻ ${member.email} — existant, mdp mis à jour`);
    } else {
      const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: member.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: { first_name: member.firstName, last_name: member.lastName },
        }),
      });
      const created = await createRes.json();
      if (!created.id) {
        console.error(`  ✗ ${member.email} — erreur :`, created.msg || created.message || "");
        continue;
      }
      userId = created.id;
      console.log(`  ✓ ${member.email} — créé`);
    }

    // Profil
    const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, { headers });
    const profData = await profRes.json();

    if (profData.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ iad_slug: member.slug, member_status: "actif" }),
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id: userId,
          email: member.email,
          first_name: member.firstName,
          last_name: member.lastName,
          iad_slug: member.slug,
          roles: ["adherent"],
          member_status: "actif",
        }),
      });
    }
  }

  console.log("\n✅ Terminé !");
  console.log(`Mot de passe commun : ${DEFAULT_PASSWORD}`);
}

main().catch(console.error);
