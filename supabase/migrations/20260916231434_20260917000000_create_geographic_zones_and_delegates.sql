/*
# Create geographic zones and delegates

1. New Tables
- `geographic_zones` stores the delivery areas used by customers and delegates.
  - `id` (uuid, primary key)
  - `name` (text, required)
  - `description` (text, optional)
  - `created_at` (timestamptz)
- `delegates` stores delivery representatives assigned to one geographic zone.
  - `id` (uuid, primary key)
  - `name` (text, required)
  - `phone` (text, required)
  - `zone_id` (uuid, optional foreign key to geographic_zones)
  - `created_at` (timestamptz)

2. Modified Tables
- `customers` gains `zone_id` and `delegate_id` so each customer is linked to their selected geographic zone and its responsible delegate.

3. Automatic Assignment
- A trigger assigns the zone's current delegate to a customer whenever the customer's zone is created or changed.
- Changing a delegate's zone refreshes delegate assignments for customers in that zone.

4. Security
- Enable RLS on both new tables.
- Allow anon and authenticated roles to perform separate select, insert, update, and delete operations because this is a shared single-store application without sign-in.
- Existing customer policies continue to govern the new customer columns.

5. Important Notes
- Existing customers remain valid with no zone until they choose one.
- No existing customer, order, zone, or delegate rows are deleted.
*/

CREATE TABLE IF NOT EXISTS geographic_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delegates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  zone_id uuid REFERENCES geographic_zones(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES geographic_zones(id) ON DELETE SET NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS delegate_id uuid REFERENCES delegates(id) ON DELETE SET NULL;

ALTER TABLE geographic_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_geographic_zones" ON geographic_zones;
CREATE POLICY "anon_select_geographic_zones" ON geographic_zones FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_geographic_zones" ON geographic_zones;
CREATE POLICY "anon_insert_geographic_zones" ON geographic_zones FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_geographic_zones" ON geographic_zones;
CREATE POLICY "anon_update_geographic_zones" ON geographic_zones FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_geographic_zones" ON geographic_zones;
CREATE POLICY "anon_delete_geographic_zones" ON geographic_zones FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_delegates" ON delegates;
CREATE POLICY "anon_select_delegates" ON delegates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_delegates" ON delegates;
CREATE POLICY "anon_insert_delegates" ON delegates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_delegates" ON delegates;
CREATE POLICY "anon_update_delegates" ON delegates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_delegates" ON delegates;
CREATE POLICY "anon_delete_delegates" ON delegates FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION assign_customer_delegate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.zone_id IS NULL THEN
    NEW.delegate_id := NULL;
  ELSE
    SELECT d.id INTO NEW.delegate_id
    FROM delegates d
    WHERE d.zone_id = NEW.zone_id
    ORDER BY d.created_at ASC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customers_assign_delegate ON customers;
CREATE TRIGGER customers_assign_delegate
BEFORE INSERT OR UPDATE OF zone_id ON customers
FOR EACH ROW EXECUTE FUNCTION assign_customer_delegate();

CREATE OR REPLACE FUNCTION refresh_customer_delegates_for_zone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE customers c
  SET delegate_id = (
    SELECT d.id FROM delegates d
    WHERE d.zone_id = c.zone_id
    ORDER BY d.created_at ASC
    LIMIT 1
  )
  WHERE c.zone_id = COALESCE(NEW.zone_id, OLD.zone_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS delegates_refresh_customers ON delegates;
CREATE TRIGGER delegates_refresh_customers
AFTER INSERT OR UPDATE OF zone_id OR DELETE ON delegates
FOR EACH ROW EXECUTE FUNCTION refresh_customer_delegates_for_zone();

REVOKE EXECUTE ON FUNCTION assign_customer_delegate() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION refresh_customer_delegates_for_zone() FROM PUBLIC, anon, authenticated;
