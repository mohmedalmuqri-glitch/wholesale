/*
# Create app_settings table (single-tenant, no auth)

1. New Tables
- `app_settings` — single-row table storing global app configuration
  - `id` (int, primary key, always 1)
  - `whatsapp_number` (text, not null, default '967781995868') — supplier WhatsApp number for order forwarding
  - `admin_pin` (text, not null, default '1234') — PIN to access admin panel
  - `pin_required` (boolean, not null, default true) — whether admin requires PIN entry
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `app_settings`.
- Allow anon + authenticated CRUD because this is a single-tenant app with no sign-in.

3. Notes
- A seed row with id=1 is inserted with defaults so the app can read settings immediately.
*/

CREATE TABLE IF NOT EXISTS app_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  whatsapp_number text NOT NULL DEFAULT '967781995868',
  admin_pin text NOT NULL DEFAULT '1234',
  pin_required boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON app_settings;
CREATE POLICY "anon_select_settings" ON app_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON app_settings;
CREATE POLICY "anon_insert_settings" ON app_settings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON app_settings;
CREATE POLICY "anon_update_settings" ON app_settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO app_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;
