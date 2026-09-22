/**
 * Google Sheets CSV fetch + parse
 *
 * La sheet doit être :
 * 1) Partagée "Toute personne avec le lien" (Lecteur)
 * 2) Publiée sur le web (Fichier → Partager → Publier sur le web)
 */

const SHEET_ID = "1FEwQ7MfgqKp3VIijuRNEQi_lTYKrBc4w";
const GID = "430186681";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

export interface SheetMember {
  firstName: string;
  lastName: string;
  company: string;
  miniSiteUrl: string | null;
  photoUrl: string | null;
}

/* ── CSV parser robuste (guillemets, virgules, sauts de ligne) ── */

function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      fields.push(field.trim());
      field = "";
    } else {
      field += c;
    }
  }
  fields.push(field.trim());
  return fields;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      current += '"';
    } else if (c === "\n" && !inQuotes) {
      if (current.trim()) rows.push(parseCSVRow(current));
      current = "";
    } else if (c === "\r") {
      // skip
    } else {
      current += c;
    }
  }
  if (current.trim()) rows.push(parseCSVRow(current));
  return rows;
}

/* ── Mapping colonnes → SheetMember ── */

function rowToMember(cols: string[]): SheetMember | null {
  // Structure : col0=prénom, col1=nom
  const firstName = (cols[0] || "").trim();
  const lastName = (cols[1] || "").trim();
  const company = (cols[4] || "").trim();

  // Colonnes optionnelles si elles existent dans le futur
  const miniSiteUrl = (cols[5] || "").trim() || null;
  const photoUrl = (cols[6] || "").trim() || null;

  // On exige prénom ET nom pour un conseiller valide
  // (filtre les lignes "Partenaires", noms d'entreprises seuls, etc.)
  if (!firstName || !lastName) return null;

  return { firstName, lastName, company, miniSiteUrl, photoUrl };
}

/* ── Membres supplémentaires (pas encore dans le Google Sheet) ── */

const EXTRA_MEMBERS: SheetMember[] = [
  { firstName: "Sonia", lastName: "Orhant", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Hélène", lastName: "Al Halabiya", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Islam", lastName: "Benaini", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Emilie", lastName: "Boudey", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Thibault", lastName: "Irlinger", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Loic", lastName: "Corbin", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Bernard", lastName: "Venevongsos", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Coralie", lastName: "Roulois", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Gaela", lastName: "Kuzminski", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Audrey", lastName: "Boura", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Anne-Sophie", lastName: "Coignard", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Alexandra", lastName: "Marais", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Alexandra", lastName: "Jugan", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Mael", lastName: "Guilleux", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Sandy-Ann", lastName: "Nepert", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Cédric", lastName: "Gorge", company: "", miniSiteUrl: null, photoUrl: null },
  { firstName: "Isabelle", lastName: "Scudeller", company: "", miniSiteUrl: null, photoUrl: null },
];

/* ── Normalisation des noms (accents, espaces) ── */

function normalizeSlug(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "").toLowerCase();
}

function memberSlug(firstName: string, lastName: string): string {
  return `${normalizeSlug(firstName)}.${normalizeSlug(lastName)}`;
}

/* ── Membres à exclure (retirés du réseau mais encore dans le Google Sheet) ── */

const EXCLUDED_MEMBERS = new Set([
  "bochra.benjelloun",
  "erwan.roze",
  "tasnime.hassanaly",
  "mathieu.deuve",
  "marine.lequentrec",
  "nicolas.touboulic",
  "laura.martine",
  "celine.gavard",
  "patricia.hoareau",
  "walid.ulomi",
  "morgane.bendouma",
  "nicolas.giraud",
  "nicolas.schleich",
]);

/* ── Fetch public ── */

export async function fetchMembersFromSheet(): Promise<SheetMember[]> {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Sheet fetch error: ${res.status}`);

  const text = await res.text();
  const rows = parseCSV(text);

  const sheetMembers = rows
    .map(rowToMember)
    .filter((m): m is SheetMember => m !== null)
    .filter((m) => !EXCLUDED_MEMBERS.has(memberSlug(m.firstName, m.lastName)));

  // Fusionner les membres du sheet avec les membres supplémentaires
  // (éviter les doublons si un membre extra est aussi dans le sheet)
  const existingSlugs = new Set(
    sheetMembers.map((m) => memberSlug(m.firstName, m.lastName))
  );

  const newExtras = EXTRA_MEMBERS.filter(
    (m) => !existingSlugs.has(memberSlug(m.firstName, m.lastName))
  );

  return [...sheetMembers, ...newExtras];
}
