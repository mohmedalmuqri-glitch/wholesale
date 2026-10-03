/*
# Validate promotional product values

1. Modified Tables
- `products.discount_percentage`: must stay between 0 and 100.
- `products.old_price`: required and positive when a product is marked as an offer.
- `products.offer_category_id`: required when a product is marked as an offer.
- `products.price`: must be non-negative for offer products.

2. Security
- Add database checks so invalid offer values cannot be stored through direct API requests.
- Existing regular products are unaffected because the offer-specific checks apply only when `is_offer` is true.

3. Important Notes
- This migration is additive and does not delete or change existing regular product data.
- The frontend continues to validate the same rules before saving for immediate user feedback.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_offer_discount_percentage_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_offer_discount_percentage_check
      CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_offer_values_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_offer_values_check
      CHECK (
        NOT is_offer
        OR (
          offer_category_id IS NOT NULL
          AND old_price IS NOT NULL
          AND old_price > 0
          AND price >= 0
        )
      );
  END IF;
END $$;