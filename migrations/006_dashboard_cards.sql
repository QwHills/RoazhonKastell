-- Migration 006: Dashboard cards – actions, rencontres, découverte partenaires
-- À exécuter dans le SQL Editor de Supabase AVANT de tester les fonctionnalités.

-- ============================================================
-- 1. Actions métier liées aux ateliers du mardi
-- ============================================================

CREATE TABLE IF NOT EXISTS atelier_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instruction TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 15,
  resource_url TEXT,
  resource_title TEXT,
  ai_suggestions JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'valide', 'archive')),
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS atelier_actions_event_valide
  ON atelier_actions (event_id) WHERE status = 'valide';

CREATE TABLE IF NOT EXISTS user_action_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES atelier_actions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'a_faire' CHECK (status IN ('a_faire', 'realisee', 'declinee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (action_id, user_id)
);

-- ============================================================
-- 2. Suggestions de rencontres entre conseillers
-- ============================================================

CREATE TABLE IF NOT EXISTS meet_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suggested_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'proposee' CHECK (status IN ('proposee', 'acceptee', 'echangee', 'declinee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS known_contacts (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  known_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'self_declared' CHECK (source IN ('self_declared', 'met_at_event')),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, known_user_id),
  CHECK (user_id <> known_user_id)
);

-- ============================================================
-- 3. Découverte partenaires (rotation hebdomadaire)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT true,
  response TEXT DEFAULT 'proposee' CHECK (response IN ('proposee', 'connue', 'vue', 'reportee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_discoveries_current
  ON partner_discoveries (user_id) WHERE is_current = true;

-- ============================================================
-- 4. RLS policies
-- ============================================================

ALTER TABLE atelier_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_action_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE meet_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE known_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_discoveries ENABLE ROW LEVEL SECURITY;

-- atelier_actions: lecture pour tous les authentifiés, écriture pour gestionnaires
CREATE POLICY "atelier_actions_select" ON atelier_actions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "atelier_actions_insert" ON atelier_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (roles @> ARRAY['admin']::user_role[] OR roles @> ARRAY['gestionnaire_evenements']::user_role[])
    )
  );

CREATE POLICY "atelier_actions_update" ON atelier_actions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (roles @> ARRAY['admin']::user_role[] OR roles @> ARRAY['gestionnaire_evenements']::user_role[])
    )
  );

-- user_action_tracking: chacun gère son propre suivi
CREATE POLICY "user_action_tracking_select" ON user_action_tracking
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "user_action_tracking_insert" ON user_action_tracking
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_action_tracking_update" ON user_action_tracking
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Lecture admin pour les bilans agrégés (sans exposer les réponses individuelles aux autres membres)
CREATE POLICY "user_action_tracking_admin_select" ON user_action_tracking
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (roles @> ARRAY['admin']::user_role[] OR roles @> ARRAY['gestionnaire_evenements']::user_role[])
    )
  );

-- meet_suggestions: chacun voit/gère ses propres suggestions
CREATE POLICY "meet_suggestions_own" ON meet_suggestions
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- known_contacts: chacun gère ses propres contacts connus
CREATE POLICY "known_contacts_own" ON known_contacts
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- partner_discoveries: chacun gère ses propres découvertes
CREATE POLICY "partner_discoveries_own" ON partner_discoveries
  FOR ALL TO authenticated USING (user_id = auth.uid());
