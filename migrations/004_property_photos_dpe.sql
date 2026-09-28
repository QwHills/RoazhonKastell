-- Add photos array and DPE fields to shared_properties
ALTER TABLE shared_properties
  ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dpe_energy_class TEXT,
  ADD COLUMN IF NOT EXISTS dpe_energy_value INTEGER,
  ADD COLUMN IF NOT EXISTS dpe_ges_class TEXT,
  ADD COLUMN IF NOT EXISTS dpe_ges_value INTEGER;
