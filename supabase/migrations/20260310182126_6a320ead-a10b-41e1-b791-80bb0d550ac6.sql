-- Add new columns for the WEAO-style executor page
ALTER TABLE public.executors ADD COLUMN IF NOT EXISTS version text;
ALTER TABLE public.executors ADD COLUMN IF NOT EXISTS price text;
ALTER TABLE public.executors ADD COLUMN IF NOT EXISTS last_updated text;
ALTER TABLE public.executors ADD COLUMN IF NOT EXISTS platform text DEFAULT 'windows';
ALTER TABLE public.executors ADD COLUMN IF NOT EXISTS has_sunc boolean DEFAULT false;

-- Clear existing test data and insert real executors from whatexpsare.online
DELETE FROM public.executors;

INSERT INTO public.executors (name, version, price, last_updated, platform, has_sunc, supported, compatibility, description) VALUES
-- Windows Script Executors
('Volt', '1.2.5.2', '$5.99 Weekly', '03/10/2026 at 3:03 AM UTC', 'windows', true, true, 'full', 'Premium Windows script executor with sUNC support.'),
('Potassium', '2.0.4', '$22.99 Lifetime', '03/04/2026 at 7:44 PM UTC', 'windows', true, true, 'full', 'High-end lifetime executor with sUNC.'),
('Volcano', 'v3.2.5.1', '$5.97 Weekly', '03/01/2026 at 8:42 PM UTC', 'windows', true, false, 'partial', 'Weekly subscription executor.'),
('Wave', 'NEW-1.1.3', '$5.99 Weekly', '03/05/2026 at 12:40 AM UTC', 'windows', true, true, 'full', 'Newly released executor with sUNC.'),
('Isaeva', '1.2.6', '$4.99 Weekly', '03/09/2026 at 9:10 PM UTC', 'windows', true, true, 'full', 'Affordable weekly executor.'),
('Synapse Z', '1.0.1.3', '$4 Weekly', '03/09/2026 at 8:43 PM UTC', 'windows', true, true, 'full', 'Popular executor with great compatibility.'),
('Velocity', '0.8.3', 'Free', '03/05/2026 at 4:56 PM UTC', 'windows', true, true, 'full', 'Free executor with sUNC support.'),
('Seliware', '2.2.3', '$3.99 Weekly', '02/05/2026 at 6:02 PM UTC', 'windows', true, false, 'partial', 'Weekly executor, currently not updated.'),
('Bunni.fun', '2.5.9 R1', 'Key System', '02/01/2026 at 5:31 AM UTC', 'windows', true, false, 'partial', 'Key system based executor.'),
('Solara', '3.234', 'Free', '03/04/2026 at 7:53 PM UTC', 'windows', true, true, 'full', 'Popular free executor with sUNC.'),
('Xeno', '1.3.25', 'Free', '03/04/2026 at 7:13 PM UTC', 'windows', true, true, 'full', 'Free open-source executor.'),
('SirHurt', 'V5.417', '$2.80 Weekly', '03/04/2026 at 7:13 PM UTC', 'windows', true, true, 'full', 'Long-standing paid executor.'),
-- Mac Executors
('Hydrogen', '709.0870', 'Key System', '02/18/2026 at 8:15 PM UTC', 'mac', true, false, 'partial', 'Mac executor with key system.'),
('MacSploit', '1.9.9', '$9.99 Lifetime', '03/07/2026 at 1:49 AM UTC', 'mac', true, true, 'full', 'Premium Mac executor.'),
('Opiumware', 'v2.2.20', 'Free', '03/05/2026 at 5:36 AM UTC', 'mac', true, true, 'full', 'Free Mac executor.'),
-- Android Executors
('Delta', '2.710.707', 'Key System', '03/02/2026 at 11:21 PM UTC', 'android', true, true, 'full', 'Popular Android executor.'),
('Cryptic', 'Version-2.710.707', 'Key System', '03/07/2026 at 4:23 PM UTC', 'android', true, true, 'full', 'Android executor with sUNC.'),
('Vega X', '2.710.707', 'Key System', '03/06/2026 at 10:55 PM UTC', 'android', false, true, 'full', 'Android executor.'),
('Codex', '2.705.924', 'Free', '01/30/2026 at 4:10 PM UTC', 'android', true, true, 'full', 'Free Android executor.'),
-- iOS
('Delta iOS', '2.710.706', 'Key System', '03/02/2026 at 7:44 PM UTC', 'ios', true, true, 'full', 'iOS executor with sUNC.');
