-- Migration : refonte complète de la fiche partenaire
-- À exécuter dans Supabase SQL Editor

-- 1. Nouveaux champs sur partners
ALTER TABLE partners ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS cover_photo text;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS why_choose_us text;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS why_choose_us_points jsonb DEFAULT '[]';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_situations jsonb DEFAULT '[]';

-- 2. Nouveaux champs sur partner_contacts
ALTER TABLE partner_contacts ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE partner_contacts ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

-- 3. Générer un slug pour les partenaires existants
UPDATE partners
SET slug = lower(
  regexp_replace(
    regexp_replace(
      translate(name, 'àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÑÇ', 'aaaaaaeeeeiiiioooooouuuuyyncAAAAAAEEEEIIIIOOOOOUUUUYYNC'),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- 4. Créer un bucket Storage pour les photos partenaires (à faire via le dashboard Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('partners', 'partners', true);

-- 5. Policy de stockage pour le bucket partners (à faire via le dashboard ou après création du bucket)
-- CREATE POLICY "Public read partners photos" ON storage.objects FOR SELECT USING (bucket_id = 'partners');
-- CREATE POLICY "Authenticated upload partners photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'partners' AND auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated delete own partners photos" ON storage.objects FOR DELETE USING (bucket_id = 'partners' AND auth.role() = 'authenticated');
