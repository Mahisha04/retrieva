-- Add missing columns to `items` table used by the app
-- REMOVED: migration SQL
-- The schema migration SQL was removed per user request. If you need to add these columns,
-- run an ALTER TABLE statement directly in the Supabase SQL editor.

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS security_question text;

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS security_answer text;

-- Optional: you may want to set a default for `type` or add constraints.
-- Run these statements in the Supabase SQL editor (https://app.supabase.com) for your project.
