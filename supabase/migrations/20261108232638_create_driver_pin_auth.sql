/*
# Driver PIN login: hashed PIN storage, create and login functions

1. Modified Tables
- `delegates` gains `pin_hash` (text). It stores a bcrypt hash of the driver's secret PIN, never the PIN itself.

2. New Functions
- `create_delegate(p_name, p_phone, p_zone_id, p_pin)`: validates the name, phone and PIN (4 to 6 digits), then inserts the delegate with a hashed PIN.
- `driver_login(p_phone, p_pin)`: returns the matching delegate's id, name and zone only when the phone and PIN both match. Returns no rows otherwise.

3. Security
- Anonymous and signed-in roles can no longer read `pin_hash`, insert rows directly, or update `pin_hash`. Table reads are restricted to the non-secret columns.
- Delegate creation goes only through `create_delegate`, so every PIN is hashed before it is stored.
- Both functions are callable by the app's `anon` and `authenticated` roles; no other role can execute them.

4. Important Notes
- Delegates created before this migration have no PIN and cannot sign in until one is set.
- No existing delegate, customer, or order rows are changed or deleted.
*/

ALTER TABLE delegates ADD COLUMN IF NOT EXISTS pin_hash text;

CREATE OR REPLACE FUNCTION create_delegate(p_name text, p_phone text, p_zone_id uuid, p_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF length(btrim(coalesce(p_name, ''))) = 0 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE = '22023';
  END IF;
  IF length(btrim(coalesce(p_phone, ''))) = 0 THEN
    RAISE EXCEPTION 'invalid_phone' USING ERRCODE = '22023';
  END IF;
  IF coalesce(p_pin, '') !~ '^[0-9]{4,6}$' THEN
    RAISE EXCEPTION 'invalid_pin' USING ERRCODE = '22023';
  END IF;

  INSERT INTO delegates (name, phone, zone_id, pin_hash)
  VALUES (btrim(p_name), btrim(p_phone), p_zone_id, crypt(p_pin, gen_salt('bf')));
END;
$$;

CREATE OR REPLACE FUNCTION driver_login(p_phone text, p_pin text)
RETURNS TABLE (delegate_id uuid, delegate_name text, delegate_zone_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT d.id, d.name, d.zone_id
  FROM delegates d
  WHERE d.phone = btrim(p_phone)
    AND d.pin_hash IS NOT NULL
    AND d.pin_hash = crypt(p_pin, d.pin_hash)
  LIMIT 1;
$$;

REVOKE SELECT, INSERT, UPDATE ON delegates FROM anon, authenticated;
GRANT SELECT (id, name, phone, zone_id, created_at) ON delegates TO anon, authenticated;
GRANT UPDATE (name, phone, zone_id) ON delegates TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION create_delegate(text, text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_delegate(text, text, uuid, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION driver_login(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION driver_login(text, text) TO anon, authenticated;
