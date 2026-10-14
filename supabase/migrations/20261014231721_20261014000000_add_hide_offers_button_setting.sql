/*
# Add hide_offers_button setting to app_settings

1. Modified Tables
- `app_settings`: add `hide_offers_button` boolean column (default false).
  When true, the offers button is hidden from the customer app's bottom navigation bar.
2. Security
- No new tables. Existing RLS policies on app_settings remain unchanged.
3. Important Notes
- Default is false, so the offers button remains visible by default (no behavior change).
- The column is nullable-safe via DO block / IF NOT EXISTS.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'hide_offers_button'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN hide_offers_button boolean NOT NULL DEFAULT false;
  END IF;
END $$;
