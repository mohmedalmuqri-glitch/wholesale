/*
# Create offer categories and offer product fields

1. New Tables
- `offer_categories`: stores named sections used to group promotional products.
- `offer_categories.id`: unique UUID.
- `offer_categories.name`: section title shown in the admin panel and storefront.
- `offer_categories.created_at`: creation timestamp.

2. Modified Tables
- `products.is_offer`: marks a regular product as a promotional product.
- `products.offer_category_id`: links an offer product to one offer section.
- `products.discount_percentage`: discount percentage displayed on the offer card.
- `products.old_price`: original price displayed with a strikethrough.
- Existing product price and image columns remain the source for the discounted price and image.

3. Security
- Enable RLS on `offer_categories`.
- Add separate SELECT, INSERT, UPDATE, and DELETE policies for the shared no-sign-in app.
- Existing product policies already allow the frontend to manage the new offer fields.

4. Important Notes
- Existing products remain regular products because `is_offer` defaults to false.
- Deleting an offer section keeps its products and clears only their section link.
- This migration is additive and does not delete, rename, or change existing user data.
*/

CREATE TABLE IF NOT EXISTS public.offer_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_offer_categories" ON public.offer_categories;
CREATE POLICY "anon_select_offer_categories" ON public.offer_categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_offer_categories" ON public.offer_categories;
CREATE POLICY "anon_insert_offer_categories" ON public.offer_categories
  FOR INSERT TO anon, authenticated WITH CHECK (length(trim(name)) > 0);

DROP POLICY IF EXISTS "anon_update_offer_categories" ON public.offer_categories;
CREATE POLICY "anon_update_offer_categories" ON public.offer_categories
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (length(trim(name)) > 0);

DROP POLICY IF EXISTS "anon_delete_offer_categories" ON public.offer_categories;
CREATE POLICY "anon_delete_offer_categories" ON public.offer_categories
  FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_offer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_category_id uuid,
  ADD COLUMN IF NOT EXISTS discount_percentage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS old_price numeric;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_offer_category_id_fkey'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_offer_category_id_fkey
      FOREIGN KEY (offer_category_id) REFERENCES public.offer_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_offer_category_id
  ON public.products (offer_category_id)
  WHERE is_offer = true;

CREATE INDEX IF NOT EXISTS idx_products_is_offer
  ON public.products (is_offer, created_at DESC);