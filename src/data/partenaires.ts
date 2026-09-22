export interface Contact {
  nom: string;
  telephone?: string;
  email?: string;
  note?: string;
}

export interface Partenaire {
  nom: string;
  metier: string;
  secteur: string;
  remuneration: boolean;
  logo?: string;
  contacts: Contact[];
}

export const metiers = [
  "Tous métiers",
  "Finance & Assurance",
  "Diagnostic",
  "Travaux & Rénovation",
  "Services",
  "Habitat & Équipement",
];

export const partenaires: Partenaire[] = [
  /* ── Finance & Assurance ── */
  {
    nom: "Cafpi",
    metier: "Finance & Assurance",
    secteur: "Prêt immobilier, Prêt professionnel, Assurance emprunteur",
    remuneration: true,
    logo: "/logos/cafpi.svg",
    contacts: [
      { nom: "Julie Monreal", telephone: "06 42 45 19 77", email: "j.monreal@cafpi.fr", note: "Prêt immo, Assurance emprunteur" },
      { nom: "Sadok Blanchais", telephone: "06 48 38 98 09", email: "s.blanchais@cafpi.fr", note: "Prêt immo, Assurance emprunteur" },
      { nom: "Florian Morgant", telephone: "06 17 80 44 06", email: "f.morgant@cafpi.fr", note: "Prêt immo, Assurance emprunteur" },
      { nom: "Kevin Cabaillot", telephone: "06 77 37 69 91", email: "k.cabaillot@cafpi.fr", note: "Prêt immo, Prêt pro, Assurance emprunteur" },
    ],
  },
  {
    nom: "EB Expertise",
    metier: "Finance & Assurance",
    secteur: "Expert comptable",
    remuneration: false,
    logo: "/logos/eb-expertise.jpg",
    contacts: [
      { nom: "Emmanuelle Bourgogne", telephone: "06 61 98 43 58", email: "emmanuelle.bourgogne@eb-expertise.com" },
    ],
  },
  {
    nom: "AXA",
    metier: "Finance & Assurance",
    secteur: "Assurance, mutuelle et prévoyance",
    remuneration: false,
    logo: "/logos/axa.svg",
    contacts: [
      { nom: "Sébastien Packer", telephone: "07 59 66 46 33", email: "sebastien.packer.a2p@axa.fr" },
    ],
  },

  {
    nom: "Allegacie",
    metier: "Finance & Assurance",
    secteur: "Family Office — Stratégie patrimoniale, fiscalité, transmission et investissement",
    remuneration: true,
    contacts: [
      { nom: "Florent Allombert", telephone: "06 62 69 99 32", email: "fallombert@allegacie.fr" },
      { nom: "Julie Ribeiro Fernandes", telephone: "06 34 17 02 42", email: "jribeirofernandes@allegacie.fr" },
    ],
  },

  /* ── Diagnostic ── */
  {
    nom: "BC2E",
    metier: "Diagnostic",
    secteur: "Diagnostiqueur immobilier",
    remuneration: false,
    logo: "/logos/bc2e.png",
    contacts: [
      { nom: "Nicolas Wentzinger", telephone: "07 60 03 12 83", email: "nicolas.wentzinger@bc2e.com" },
    ],
  },
  {
    nom: "Real Diag",
    metier: "Diagnostic",
    secteur: "Diagnostiqueur immobilier",
    remuneration: false,
    logo: "/logos/real-diag.png",
    contacts: [
      { nom: "Christophe Garnier", telephone: "06 31 24 44 14", email: "contact@real-diag.fr" },
    ],
  },

  /* ── Travaux & Rénovation ── */
  {
    nom: "Maisons Demeurance",
    metier: "Travaux & Rénovation",
    secteur: "Constructeur de maisons individuelles",
    remuneration: true,
    logo: "/logos/maisons-demeurance.svg",
    contacts: [
      { nom: "Aymeric Lemoine", telephone: "06 98 74 98 50", email: "alemoine@maisons-demeurance.com" },
    ],
  },
  {
    nom: "Inside Conception",
    metier: "Travaux & Rénovation",
    secteur: "Chiffrage, travaux, rénovation et aménagement",
    remuneration: true,
    contacts: [
      { nom: "Nicolas Paillard", telephone: "06 61 62 33 24", email: "nicolas.paillard@insideconception.net" },
    ],
  },
  {
    nom: "Inoker",
    metier: "Travaux & Rénovation",
    secteur: "Plomberie, chauffage, sanitaire, électricité et menuiserie",
    remuneration: false,
    logo: "/logos/inoker.png",
    contacts: [
      { nom: "Axel Leullier", telephone: "06 29 66 15 92", email: "a.leullier@inoker.fr", note: "Plomberie, chauffage, sanitaire, élec" },
      { nom: "Anthony Gilbert", telephone: "06 29 05 29 20", email: "a.gilbert@inoker.fr", note: "Plomberie, chauffage, sanitaire, élec" },
      { nom: "Pierre Henry", telephone: "06 43 88 10 81", email: "p.henry@inoker.fr", note: "Menuiserie" },
    ],
  },
  {
    nom: "Esmée Services",
    metier: "Services",
    secteur: "Nettoyage, vide maison et travaux divers",
    remuneration: true,
    logo: "/logos/esmee-services.png",
    contacts: [
      { nom: "Didier Goksuguzel", telephone: "06 15 57 43 77", email: "esmeeservices35@gmail.com" },
    ],
  },

  /* ── Habitat & Équipement ── */
  {
    nom: "Cuisines Envia",
    metier: "Habitat & Équipement",
    secteur: "Cuisiniste",
    remuneration: true,
    logo: "/logos/cuisines-envia.png",
    contacts: [
      { nom: "Mélanie Cuisinier", telephone: "07 56 41 94 67", email: "melanie.envia.gusto@gmail.com" },
      { nom: "Kevin Lhermenier", telephone: "06 17 95 06 48", email: "envia35@envia.fr" },
    ],
  },
];
