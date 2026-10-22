CREATE TABLE public.showcases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'video',
  url TEXT,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.showcases ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view showcases" ON public.showcases FOR SELECT USING (true);

-- Insert some sample showcases
INSERT INTO public.showcases (title, description, type, url, display_order) VALUES
('Blox Fruits Auto-Farm', 'Full auto-farm demonstration with teleport and combat.', 'video', 'https://youtube.com', 1),
('Da Hood Aimbot', 'Silent aim showcase in competitive gameplay.', 'video', 'https://youtube.com', 2),
('Pet Sim X Hatch', 'Auto-hatch system with dupe detection results.', 'image', 'https://youtube.com', 3),
('Arsenal Aimbot', 'Precision aimbot with configurable FOV and smoothing.', 'video', 'https://youtube.com', 4),
('King Legacy Farm', 'Overnight auto-farm results with level progression.', 'image', 'https://youtube.com', 5),
('Bizarre Lineage', 'Full feature showcase with auto-farm and PvP.', 'image', 'https://youtube.com', 6);