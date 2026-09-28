-- Date d'adhésion pour les membres
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_adhesion date DEFAULT NULL;

-- Date de début de cotisation pour les partenaires
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS cotisation_debut date DEFAULT NULL;
