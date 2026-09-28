-- Distinguer les écritures récurrentes des ponctuelles
ALTER TABLE financial_entries
  ADD COLUMN IF NOT EXISTS recurrence text DEFAULT 'ponctuel'
  CHECK (recurrence IN ('mensuel', 'ponctuel'));
