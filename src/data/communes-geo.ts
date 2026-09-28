export interface Commune {
  name: string;
  postalCode: string;
  lat: number;
  lng: number;
}

export const COMMUNES: Commune[] = [
  // ── Villes des conseillers ──
  { name: "Rennes", postalCode: "35000", lat: 48.1173, lng: -1.6778 },
  { name: "Rennes", postalCode: "35200", lat: 48.1173, lng: -1.6778 },
  { name: "Rennes", postalCode: "35700", lat: 48.1173, lng: -1.6778 },
  { name: "Betton", postalCode: "35830", lat: 48.1831, lng: -1.6356 },
  { name: "Corps-Nuds", postalCode: "35150", lat: 47.9983, lng: -1.5441 },
  { name: "Fougères", postalCode: "35300", lat: 48.3525, lng: -1.2037 },
  { name: "Saint-Gilles", postalCode: "35590", lat: 48.1453, lng: -1.8333 },
  { name: "Vezin-le-Coquet", postalCode: "35132", lat: 48.1192, lng: -1.7500 },
  { name: "La Bouëxière", postalCode: "35340", lat: 48.1757, lng: -1.4345 },
  { name: "Gahard", postalCode: "35490", lat: 48.2878, lng: -1.5167 },
  { name: "Saint-Jacques-de-la-Lande", postalCode: "35136", lat: 48.0882, lng: -1.7188 },
  { name: "Janzé", postalCode: "35150", lat: 47.9614, lng: -1.5006 },
  { name: "Combourg", postalCode: "35270", lat: 48.4103, lng: -1.7528 },
  { name: "Saint-Médard-sur-Ille", postalCode: "35250", lat: 48.2672, lng: -1.6233 },
  { name: "Melesse", postalCode: "35520", lat: 48.2181, lng: -1.6951 },
  { name: "Cesson-Sévigné", postalCode: "35510", lat: 48.1211, lng: -1.6028 },
  { name: "Sougéal", postalCode: "35610", lat: 48.4833, lng: -1.5167 },
  { name: "Vern-sur-Seiche", postalCode: "35770", lat: 48.0500, lng: -1.6033 },
  { name: "Pont-Péan", postalCode: "35131", lat: 48.0344, lng: -1.7161 },
  { name: "Pacé", postalCode: "35740", lat: 48.1500, lng: -1.7767 },
  { name: "Vitré", postalCode: "35500", lat: 48.1209, lng: -1.2100 },
  { name: "Châteaugiron", postalCode: "35410", lat: 48.0500, lng: -1.5044 },
  { name: "La Chapelle-Thouarault", postalCode: "35590", lat: 48.1375, lng: -1.8506 },
  { name: "Montfort-sur-Meu", postalCode: "35160", lat: 48.1375, lng: -1.9542 },
  { name: "Guignen", postalCode: "35580", lat: 47.9167, lng: -1.8544 },
  { name: "Saint-Erblon", postalCode: "35230", lat: 48.0361, lng: -1.6458 },
  { name: "Bain-de-Bretagne", postalCode: "35470", lat: 47.8461, lng: -1.6833 },
  { name: "Mordelles", postalCode: "35310", lat: 48.0747, lng: -1.8453 },
  { name: "Orgères", postalCode: "35230", lat: 48.0072, lng: -1.6686 },
  { name: "Cintré", postalCode: "35310", lat: 48.0981, lng: -1.8814 },
  { name: "Montauban-de-Bretagne", postalCode: "35360", lat: 48.1972, lng: -2.0517 },
  { name: "Crevin", postalCode: "35320", lat: 47.9358, lng: -1.6653 },
  { name: "Liffré", postalCode: "35340", lat: 48.2147, lng: -1.5069 },
  { name: "Bruz", postalCode: "35170", lat: 48.0256, lng: -1.7472 },
  { name: "La Mézière", postalCode: "35520", lat: 48.2183, lng: -1.7533 },
  { name: "Goven", postalCode: "35580", lat: 47.9869, lng: -1.8461 },
  { name: "Chavagne", postalCode: "35310", lat: 48.0647, lng: -1.7856 },
  { name: "Pleumeleuc", postalCode: "35137", lat: 48.1692, lng: -1.8842 },
  { name: "Chantepie", postalCode: "35135", lat: 48.0897, lng: -1.6161 },
  { name: "Chartres-de-Bretagne", postalCode: "35131", lat: 48.0442, lng: -1.7028 },
  { name: "Bourgbarré", postalCode: "35230", lat: 48.0011, lng: -1.6075 },
  { name: "Villedieu-les-Poêles-Rouffigny", postalCode: "50800", lat: 48.8419, lng: -1.2192 },
  { name: "Aytré", postalCode: "17440", lat: 46.1361, lng: -1.1000 },
  { name: "Binic", postalCode: "22520", lat: 48.6006, lng: -2.8317 },
  // ── Communes supplémentaires (Ille-et-Vilaine et alentours) ──
  { name: "Acigné", postalCode: "35690", lat: 48.1333, lng: -1.5333 },
  { name: "Saint-Grégoire", postalCode: "35760", lat: 48.1542, lng: -1.6861 },
  { name: "Le Rheu", postalCode: "35650", lat: 48.1042, lng: -1.7889 },
  { name: "L'Hermitage", postalCode: "35590", lat: 48.1100, lng: -1.8200 },
  { name: "Thorigné-Fouillard", postalCode: "35235", lat: 48.1556, lng: -1.5556 },
  { name: "Noyal-sur-Vilaine", postalCode: "35530", lat: 48.1167, lng: -1.5167 },
  { name: "Noyal-Châtillon-sur-Seiche", postalCode: "35230", lat: 48.0611, lng: -1.6700 },
  { name: "Saint-Armel", postalCode: "35230", lat: 48.0000, lng: -1.5833 },
  { name: "Domloup", postalCode: "35410", lat: 48.0833, lng: -1.5167 },
  { name: "Guichen", postalCode: "35580", lat: 47.9667, lng: -1.7833 },
  { name: "Bourg-des-Comptes", postalCode: "35890", lat: 47.9333, lng: -1.7500 },
  { name: "Chevaigné", postalCode: "35250", lat: 48.2000, lng: -1.6333 },
  { name: "Montreuil-sur-Ille", postalCode: "35440", lat: 48.3000, lng: -1.6500 },
  { name: "Hédé-Bazouges", postalCode: "35630", lat: 48.2958, lng: -1.7917 },
  { name: "Tinténiac", postalCode: "35190", lat: 48.3250, lng: -1.8333 },
  { name: "Dol-de-Bretagne", postalCode: "35120", lat: 48.5500, lng: -1.7500 },
  { name: "Saint-Malo", postalCode: "35400", lat: 48.6492, lng: -2.0067 },
  { name: "Redon", postalCode: "35600", lat: 47.6500, lng: -2.0833 },
  { name: "La Guerche-de-Bretagne", postalCode: "35130", lat: 47.9500, lng: -1.2333 },
  { name: "Retiers", postalCode: "35240", lat: 47.9167, lng: -1.3833 },
  { name: "Servon-sur-Vilaine", postalCode: "35530", lat: 48.1333, lng: -1.4667 },
  { name: "Romillé", postalCode: "35850", lat: 48.2000, lng: -1.8833 },
  { name: "Bédée", postalCode: "35137", lat: 48.1833, lng: -1.9333 },
  { name: "Saint-Aubin-du-Cormier", postalCode: "35140", lat: 48.2611, lng: -1.3981 },
  { name: "Saint-Aubin-d'Aubigné", postalCode: "35250", lat: 48.2500, lng: -1.6000 },
  { name: "Sens-de-Bretagne", postalCode: "35490", lat: 48.3333, lng: -1.5333 },
  { name: "Cancale", postalCode: "35260", lat: 48.6711, lng: -1.8508 },
  { name: "Dinard", postalCode: "35800", lat: 48.6319, lng: -2.0700 },
  { name: "Pipriac", postalCode: "35550", lat: 47.8167, lng: -1.9500 },
  { name: "Argentré-du-Plessis", postalCode: "35370", lat: 48.0500, lng: -1.1500 },
  { name: "Martigné-Ferchaud", postalCode: "35640", lat: 47.8333, lng: -1.3167 },
  { name: "Grand-Fougeray", postalCode: "35390", lat: 47.7333, lng: -1.7333 },
  { name: "Saint-Méen-le-Grand", postalCode: "35290", lat: 48.1833, lng: -2.1833 },
  { name: "Iffendic", postalCode: "35750", lat: 48.1333, lng: -2.0667 },
  { name: "Le Sel-de-Bretagne", postalCode: "35320", lat: 47.9333, lng: -1.6167 },
  { name: "Piré-Chancé", postalCode: "35150", lat: 48.0333, lng: -1.4333 },
  { name: "Gosné", postalCode: "35140", lat: 48.2167, lng: -1.4667 },
];

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function getCoordsFromCityString(
  cityStr: string,
): { lat: number; lng: number } | null {
  const match = cityStr.match(/^(.+?)\s*\((\d+)\)$/);
  if (!match) return null;
  const [, name, code] = match;
  const nameNorm = normalize(name);
  const found =
    COMMUNES.find(
      (c) => c.postalCode === code && normalize(c.name) === nameNorm,
    ) ?? COMMUNES.find((c) => c.postalCode === code);
  return found ? { lat: found.lat, lng: found.lng } : null;
}

export function searchCommunes(query: string, limit = 8): Commune[] {
  if (query.length < 2) return [];
  const q = normalize(query);
  return COMMUNES.filter((c) => normalize(c.name).includes(q)).slice(0, limit);
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
