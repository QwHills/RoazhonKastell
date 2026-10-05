/**
 * Utilitaires IAD France
 *
 * Construit l'URL du mini-site IAD à partir du nom/prénom.
 * Pattern : https://www.iadfrance.fr/conseiller-immobilier/prenom.nom
 */

function normalizeForUrl(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/'/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * URLs vérifiées qui ne suivent pas le pattern standard prenom.nom
 * Clé = "prenom.nom" normalisé, Valeur = slug réel sur iadfrance.fr
 */
const URL_OVERRIDES: Record<string, string> = {
  "violaine.quemerais": "violaine.govorun",
  "guillaume.lefevre": "g.lefevre",
  "jessi.pacaud": "jessi-khan.pacaud",
  "laure.floutier": "laure.floutier-cabale",
  "marine.le-quentrec": "marine.lequentrec",
};

export function getIadSlug(firstName: string, lastName: string): string {
  const f = normalizeForUrl(firstName);
  const l = normalizeForUrl(lastName);
  const key = `${f}.${l}`;
  return URL_OVERRIDES[key] || key;
}

export function buildIadMiniSiteUrl(firstName: string, lastName: string): string {
  return `https://www.iadfrance.fr/conseiller-immobilier/${getIadSlug(firstName, lastName)}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${(firstName[0] || "").toUpperCase()}${(lastName[0] || "").toUpperCase()}`;
}

export async function scrapeIadProfilePhoto(
  firstName: string,
  lastName: string,
): Promise<string | null> {
  try {
    const url = buildIadMiniSiteUrl(firstName, lastName);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RoazhonKastell/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const ogMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
    );
    if (!ogMatch?.[1]) return null;

    let photoUrl = ogMatch[1].replace(/&amp;/g, "&");
    photoUrl = photoUrl.replace(/\?.*$/, "");

    if (!photoUrl.includes("images.iadfrance.fr/profile-picture/")) return null;
    return `${photoUrl}?format=auto&width=320`;
  } catch {
    return null;
  }
}
