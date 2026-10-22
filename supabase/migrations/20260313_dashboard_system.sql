-- Add Discord fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_avatar text;

-- Roblox accounts table for dashboard management
CREATE TABLE IF NOT EXISTS public.roblox_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  status text DEFAULT 'Inactive', -- Active, Inactive
  current_game text,
  license_key text,
  discord_linked text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roblox_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own roblox accounts"
  ON public.roblox_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roblox accounts"
  ON public.roblox_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roblox accounts"
  ON public.roblox_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roblox accounts"
  ON public.roblox_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Junkie keys/sessions already exist in some form, but let's ensure licenses is robust
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS service_id integer;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS redeemed_at timestamp with time zone;
