-- Add flexible 'content' JSONB column to settings for site-wide text/image customisation.
-- Existing columns (couple_names, wedding_date, pix_*) are preserved.
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS content jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Create a storage bucket for site-level images (hero, closing, gallery overrides).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-images',
  'site-images',
  true,
  10485760, -- 10 MB
  ARRAY['image/png','image/jpeg','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "site_images_public_read" ON storage.objects;
CREATE POLICY "site_images_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'site-images');

-- Authenticated admins can upload / delete
DROP POLICY IF EXISTS "site_images_admin_insert" ON storage.objects;
CREATE POLICY "site_images_admin_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'site-images'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "site_images_admin_delete" ON storage.objects;
CREATE POLICY "site_images_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'site-images'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

NOTIFY pgrst, 'reload schema';
