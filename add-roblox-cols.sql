-- Add roblox_url and image_url to scripts table to support automatic thumbnail fetching
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS roblox_url TEXT;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update the types locally using Supabase CLI if you have it configured, or we will update types.ts manually.
