-- Run this SQL in the Supabase SQL editor or via your Postgres client
-- Adds an `owner` column to the `items` table to store the Supabase user id
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS owner text;

-- Optionally add an index for faster lookups by owner:
CREATE INDEX IF NOT EXISTS idx_items_owner ON public.items(owner);
