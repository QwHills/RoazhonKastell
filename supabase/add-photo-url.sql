-- Ajouter la colonne photo_url à shared_properties
ALTER TABLE shared_properties ADD COLUMN IF NOT EXISTS photo_url text;

-- Créer le bucket Storage pour les photos de biens
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Politique : les utilisateurs authentifiés peuvent uploader dans leur dossier
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = 'properties' AND (storage.foldername(name))[2] = auth.uid()::text);

-- Politique : tout le monde peut voir les photos (bucket public)
CREATE POLICY "Public read access for photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');
