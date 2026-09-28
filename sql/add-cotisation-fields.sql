-- Ajouter les champs de cotisation aux profils (adhérents)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cotisation_mensuelle numeric DEFAULT NULL;

-- Ajouter les champs de cotisation aux partenaires
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS cotisation_montant numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cotisation_frequence text DEFAULT NULL
    CHECK (cotisation_frequence IN ('mensuel', 'annuel'));
