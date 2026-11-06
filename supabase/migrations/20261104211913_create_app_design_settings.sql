/*
# Create app design settings (single row)

1. New Table
- `app_design_settings` holds one row (id = 1) that controls the storefront look and layout.
- Colors: primary brand color, active section color, button color, offer badge color (hex values).
- Typography: font family, regular and bold weights, and size multipliers for headings, body text and buttons.
- Layout: order of the bottom navigation tabs, order of home sections, list of hidden components, and product layout (grid or list).

2. Security
- Enable RLS on `app_design_settings`.
- Grant SELECT, INSERT and UPDATE to `anon` and `authenticated`, matching the existing app settings table (the app has no customer sign-in).
- Policies allow read, insert and update. Deleting the row is not allowed.

3. Realtime
- The table is added to the realtime publication so storefronts receive changes instantly after an admin saves.

4. Important notes
- Value limits are enforced by CHECK constraints so invalid colors, fonts, weights or scales cannot be saved.
- The insert of the default row is idempotent.
*/

CREATE TABLE IF NOT EXISTS app_design_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  primary_color text NOT NULL DEFAULT '#059669' CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  active_color text NOT NULL DEFAULT '#047857' CHECK (active_color ~ '^#[0-9A-Fa-f]{6}$'),
  button_color text NOT NULL DEFAULT '#3B82F6' CHECK (button_color ~ '^#[0-9A-Fa-f]{6}$'),
  badge_color text NOT NULL DEFAULT '#f97316' CHECK (badge_color ~ '^#[0-9A-Fa-f]{6}$'),
  font_family text NOT NULL DEFAULT 'Tajawal' CHECK (font_family IN ('Tajawal', 'Cairo', 'Almarai', 'Changa', 'IBM Plex Sans Arabic', 'Noto Kufi Arabic')),
  body_weight integer NOT NULL DEFAULT 400 CHECK (body_weight IN (400, 500, 600)),
  bold_weight integer NOT NULL DEFAULT 700 CHECK (bold_weight IN (700, 800, 900)),
  heading_scale numeric(4,2) NOT NULL DEFAULT 1.00 CHECK (heading_scale BETWEEN 0.80 AND 1.40),
  body_scale numeric(4,2) NOT NULL DEFAULT 1.00 CHECK (body_scale BETWEEN 0.80 AND 1.40),
  button_scale numeric(4,2) NOT NULL DEFAULT 1.00 CHECK (button_scale BETWEEN 0.80 AND 1.40),
  nav_order text[] NOT NULL DEFAULT ARRAY['home', 'offers', 'store', 'orders', 'profile'],
  home_section_order text[] NOT NULL DEFAULT ARRAY['banner', 'stats', 'offers_card', 'support_card'],
  hidden_components text[] NOT NULL DEFAULT '{}',
  product_layout text NOT NULL DEFAULT 'grid' CHECK (product_layout IN ('grid', 'list')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_design_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_design_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON app_design_settings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_design_settings" ON app_design_settings;
CREATE POLICY "anon_select_design_settings" ON app_design_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_design_settings" ON app_design_settings;
CREATE POLICY "anon_insert_design_settings" ON app_design_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_design_settings" ON app_design_settings;
CREATE POLICY "anon_update_design_settings" ON app_design_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_design_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_design_settings;
  END IF;
END $$;
