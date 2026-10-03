/*
# Create multi-slide app banners

1. New Tables
- `app_banner_slides`: stores any number of banner images for the storefront.
- `app_banner_slides.id`: unique UUID for each slide.
- `app_banner_slides.placement`: where the slide appears, either `home` or `offers`.
- `app_banner_slides.image_url`: public image URL shown to customers.
- `app_banner_slides.storage_path`: uploaded file path used when removing an image.
- `app_banner_slides.alt_text`: accessible alternative text.
- `app_banner_slides.sort_order`: position inside its placement, with lower numbers shown first.
- `app_banner_slides.is_active`: allows a slide to be hidden without deleting it.
- `app_banner_slides.created_at` and `updated_at`: record lifecycle timestamps.

2. Data Migration
- Copy every existing non-empty banner from the previous one-banner-per-placement table into the new slide table.
- Existing empty placeholders are not copied.

3. Security
- Enable RLS on `app_banner_slides`.
- Add separate SELECT, INSERT, UPDATE, and DELETE policies for the intentionally shared single-tenant app.
- Restrict placement values and require non-empty image URLs for stored slides.

4. Important Notes
- The storefront does not use sign-in, so policies allow the anon and authenticated roles to manage this shared app content.
- Existing `app_banners` data is preserved; the new table is additive and does not delete or rename anything.
- Existing banner storage policies already allow uploads under the `home` and `offers` folders.
*/

CREATE TABLE IF NOT EXISTS public.app_banner_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement text NOT NULL CHECK (placement IN ('home', 'offers')),
  image_url text NOT NULL CHECK (length(trim(image_url)) > 0),
  storage_path text NOT NULL DEFAULT '',
  alt_text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_banner_slides_placement_order
  ON public.app_banner_slides (placement, sort_order, created_at);

ALTER TABLE public.app_banner_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_banner_slides" ON public.app_banner_slides;
CREATE POLICY "anon_select_app_banner_slides" ON public.app_banner_slides
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_app_banner_slides" ON public.app_banner_slides;
CREATE POLICY "anon_insert_app_banner_slides" ON public.app_banner_slides
  FOR INSERT TO anon, authenticated
  WITH CHECK (placement IN ('home', 'offers') AND length(trim(image_url)) > 0 AND sort_order >= 0);

DROP POLICY IF EXISTS "anon_update_app_banner_slides" ON public.app_banner_slides;
CREATE POLICY "anon_update_app_banner_slides" ON public.app_banner_slides
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (placement IN ('home', 'offers') AND length(trim(image_url)) > 0 AND sort_order >= 0);

DROP POLICY IF EXISTS "anon_delete_app_banner_slides" ON public.app_banner_slides;
CREATE POLICY "anon_delete_app_banner_slides" ON public.app_banner_slides
  FOR DELETE TO anon, authenticated USING (true);

INSERT INTO public.app_banner_slides (placement, image_url, storage_path, alt_text, sort_order)
SELECT id, image_url, storage_path, alt_text, 0
FROM public.app_banners
WHERE image_url <> ''
  AND id IN ('home', 'offers')
  AND NOT EXISTS (
    SELECT 1 FROM public.app_banner_slides existing
    WHERE existing.placement = public.app_banners.id
  );