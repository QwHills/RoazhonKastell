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
