/*
# Create dynamic app banners and banner image storage

1. New Tables
- `app_banners`: stores one active banner configuration per app placement.
- `app_banners.id`: stable placement key (`home` or `offers`).
- `app_banners.image_url`: public URL displayed by the storefront.
- `app_banners.storage_path`: path of the uploaded image in the banner bucket.
- `app_banners.alt_text`: accessible alternative text for the banner.
- `app_banners.updated_at`: timestamp for cache refresh and administration feedback.

2. Storage
- Create the public `banners` bucket for storefront-visible banner images.
- Limit uploads to image formats used by the banner editor and to 10 MB.

3. Security
- Enable RLS on `app_banners`.
- Add separate SELECT, INSERT, UPDATE, and DELETE policies for the intentionally shared single-tenant app.
- Add separate storage object policies for reading, uploading, replacing, and deleting only banner images in the `home` or `offers` folders.

4. Important Notes
- This app does not have a sign-in screen, so the public storefront must be able to read the active banner configuration as `anon`.
- The existing admin PIN gate remains the app's current administration flow; this migration keeps the same single-tenant model used by the existing admin tables.
*/

CREATE TABLE IF NOT EXISTS public.app_banners (
  id text PRIMARY KEY CHECK (id IN ('home', 'offers')),
  image_url text NOT NULL DEFAULT '',
  storage_path text NOT NULL DEFAULT '',
  alt_text text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_banners" ON public.app_banners;
CREATE POLICY "anon_select_app_banners" ON public.app_banners
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_app_banners" ON public.app_banners;
CREATE POLICY "anon_insert_app_banners" ON public.app_banners
  FOR INSERT TO anon, authenticated WITH CHECK (id IN ('home', 'offers'));

DROP POLICY IF EXISTS "anon_update_app_banners" ON public.app_banners;
CREATE POLICY "anon_update_app_banners" ON public.app_banners
  FOR UPDATE TO anon, authenticated
  USING (id IN ('home', 'offers'))
  WITH CHECK (id IN ('home', 'offers'));

DROP POLICY IF EXISTS "anon_delete_app_banners" ON public.app_banners;
CREATE POLICY "anon_delete_app_banners" ON public.app_banners
  FOR DELETE TO anon, authenticated USING (id IN ('home', 'offers'));

INSERT INTO public.app_banners (id, image_url, storage_path, alt_text)
VALUES
  ('home', '', '', 'بانر الصفحة الرئيسية'),
  ('offers', '', '', 'بانر العروض')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "anon_read_banner_objects" ON storage.objects;
CREATE POLICY "anon_read_banner_objects" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] IN ('home', 'offers')
  );

DROP POLICY IF EXISTS "anon_insert_banner_objects" ON storage.objects;
CREATE POLICY "anon_insert_banner_objects" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] IN ('home', 'offers')
    AND storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp')
  );

DROP POLICY IF EXISTS "anon_update_banner_objects" ON storage.objects;
CREATE POLICY "anon_update_banner_objects" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] IN ('home', 'offers')
  )
  WITH CHECK (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] IN ('home', 'offers')
    AND storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp')
  );

DROP POLICY IF EXISTS "anon_delete_banner_objects" ON storage.objects;
CREATE POLICY "anon_delete_banner_objects" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] IN ('home', 'offers')
  );