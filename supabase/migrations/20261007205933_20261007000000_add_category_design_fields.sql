/*
# Add category design and hierarchy fields

1. Modified Tables
- `categories.image`: normal category icon shown in the storefront.
- `categories.active_image`: pressed/selected category icon shown during interaction.
- `categories.parent_id`: optional parent category for hierarchical admin dropdowns.
- `categories.sort_order`: display order for the category rail and admin list.

2. Security
- Existing RLS and shared single-tenant CRUD policies on `categories` remain active.
- Add a self-reference so a category can be organised under another category without changing existing product links.

3. Important Notes
- Existing categories keep their names, products, and current appearance because new image fields default to empty values.
- Category names remain administration-only; the storefront uses the uploaded icons without rendering names.
- This migration is additive and does not delete, rename, or change existing category data.
*/

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS active_image text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS parent_id uuid,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_parent_id_fkey'
      AND conrelid = 'public.categories'::regclass
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_parent_order
  ON public.categories (parent_id, sort_order, created_at);