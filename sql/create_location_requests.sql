-- Migration : table location_requests
-- À exécuter dans l'éditeur SQL de Supabase

CREATE TYPE location_request_status AS ENUM (
  'nouvelle',
  'acceptee',
  'refusee',
  'contrat_envoye',
  'contrat_signe'
);

CREATE TABLE location_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formule text NOT NULL,
  date_debut date NOT NULL,
  date_fin date,
  objet text NOT NULL,
  nb_personnes integer NOT NULL,
  is_adherent boolean DEFAULT false,
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL,
  telephone text NOT NULL,
  adresse text NOT NULL,
  code_postal text NOT NULL,
  ville text NOT NULL,
  societe text,
  siret text,
  besoins text,
  status location_request_status DEFAULT 'nouvelle',
  admin_note text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les requêtes courantes
CREATE INDEX idx_location_requests_status ON location_requests(status);
CREATE INDEX idx_location_requests_created ON location_requests(created_at DESC);

-- RLS
ALTER TABLE location_requests ENABLE ROW LEVEL SECURITY;

-- Les gestionnaires et admins peuvent tout voir et modifier
CREATE POLICY "Gestionnaires et admins: accès complet aux locations"
  ON location_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.roles @> ARRAY['admin']::user_role[]
        OR profiles.roles @> ARRAY['gestionnaire_evenements']::user_role[]
      )
    )
  );

-- Le formulaire public insère sans authentification (via service role ou anon)
CREATE POLICY "Insertion publique des demandes de location"
  ON location_requests
  FOR INSERT
  WITH CHECK (true);
