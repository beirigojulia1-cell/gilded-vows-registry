-- Create the gift-images storage bucket (public, so uploaded images are accessible via CDN URL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gift-images',
  'gift-images',
  true,
  5242880, -- 5 MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Policy: authenticated admin users can upload/delete images
DROP POLICY IF EXISTS "Admins can upload gift images" ON storage.objects;
CREATE POLICY "Admins can upload gift images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gift-images'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins can update gift images" ON storage.objects;
CREATE POLICY "Admins can update gift images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'gift-images'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete gift images" ON storage.objects;
CREATE POLICY "Admins can delete gift images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gift-images'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Policy: anyone (including anon) can read public gift images
DROP POLICY IF EXISTS "Public can view gift images" ON storage.objects;
CREATE POLICY "Public can view gift images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'gift-images');
