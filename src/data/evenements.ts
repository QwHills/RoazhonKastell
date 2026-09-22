export type FormType = "standard" | "professionnel";

export interface Evenement {
  id: string;
  titre: string;
  date: string;
  heure: string;
  lieu: string;
  adresse: string;
  description: string;
  image?: string;
  inscriptionEmail: string;
  formType: FormType;
  inscriptionExterne?: string;
  actif: boolean;
}

export const evenements: Evenement[] = [];
