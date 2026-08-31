/*
# Add area, payment_method columns + cancelled status to orders

## Overview
Extends the orders table with:
- area (text): delivery area/shop name for order card header
- payment_method (text): 'cash' or 'wallet'
- cancelled is added as a valid status value (text column, no enum constraint)

## Modified Tables
1. orders — added area, payment_method columns (nullable, no data loss)

## Security
No policy changes needed — existing RLS covers all columns.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'area'
  ) THEN
    ALTER TABLE orders ADD COLUMN area text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text NOT NULL DEFAULT 'cash';
  END IF;
END $$;
