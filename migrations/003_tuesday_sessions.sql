-- Migration: Tables pour le mode animation du mardi
-- A executer dans le SQL Editor de Supabase AVANT deploiement

-- Seances du mardi
CREATE TABLE tuesday_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'preparation'
    CHECK (status IN ('preparation', 'active', 'completed')),
  current_property_id UUID,
  timer_state JSONB DEFAULT '{"status":"ready","remaining_ms":60000}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_date)
);

-- Biens inscrits a une seance
CREATE TABLE tuesday_session_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES tuesday_sessions(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES shared_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'a_presenter'
    CHECK (status IN ('a_presenter', 'en_cours', 'mis_de_cote', 'presente')),
  draw_order INT,
  presented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, property_id)
);

-- FK vers la propriete en cours de presentation
ALTER TABLE tuesday_sessions
ADD CONSTRAINT fk_current_property
FOREIGN KEY (current_property_id) REFERENCES tuesday_session_properties(id)
ON DELETE SET NULL;

-- Index
CREATE INDEX idx_tsp_session ON tuesday_session_properties(session_id);
CREATE INDEX idx_tsp_owner ON tuesday_session_properties(owner_id);
CREATE INDEX idx_ts_date ON tuesday_sessions(session_date);

-- RLS
ALTER TABLE tuesday_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuesday_session_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_sessions" ON tuesday_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_session_properties" ON tuesday_session_properties
  FOR SELECT TO authenticated USING (true);

-- Ecriture geree par les API routes avec service_role_key
