-- Jour du mois où la cotisation est prélevée (1 à 31)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS jour_prelevement integer DEFAULT NULL
  CHECK (jour_prelevement >= 1 AND jour_prelevement <= 31);

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS jour_prelevement integer DEFAULT NULL
  CHECK (jour_prelevement >= 1 AND jour_prelevement <= 31);
