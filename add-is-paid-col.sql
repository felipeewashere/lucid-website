-- Run this in your Supabase SQL Editor to add the is_paid column for scripts
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT true;
