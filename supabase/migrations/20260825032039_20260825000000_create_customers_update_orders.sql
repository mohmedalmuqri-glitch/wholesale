/*
# Create customers table + link orders to customers + realtime on orders

## Overview
Adds a customers table for storing business/facility data with GPS coordinates.
Links orders to customers via customer_id. Enables realtime on orders table.

## New Tables
1. customers — registered businesses/shops with location data
   - id (uuid PK)
   - user_name (text) — the person's name
   - business_name (text) — shop/restaurant name
   - phone (text) — contact phone
   - latitude (numeric) — GPS latitude
   - longitude (numeric) — GPS longitude
   - created_at (timestamptz)

## Modified Tables
1. orders — added customer_id column (nullable, references customers)

## Security
RLS enabled on customers with full anon+authenticated CRUD (no-auth app).
Realtime replication added for orders and customers tables.

## Notes
1. customer_id on orders is nullable so existing orders without a customer still work.
2. All policies use TO anon, authenticated because the app has no sign-in screen.
*/

-- ---------- customers ----------
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL DEFAULT '',
  business_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  latitude numeric,
  longitude numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_customers" ON customers;
CREATE POLICY "anon_select_customers" ON customers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_customers" ON customers;
CREATE POLICY "anon_delete_customers" ON customers FOR DELETE TO anon, authenticated USING (true);

-- ---------- Add customer_id to orders ----------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------- Realtime for orders + customers ----------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'customers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
