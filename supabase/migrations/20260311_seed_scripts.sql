-- ========================================================
-- LUCID.GG SEED + ADMIN SETUP
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ========================================================

-- 1. Grant admin role to anaslhras@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'anaslhras@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Seed the 6 scripts
INSERT INTO public.scripts (name, slug, game, description, status, features, supported_executors)
VALUES
  (
    'Bizarre Lineage',
    'bizarre-lineage',
    'Bizarre Lineage',
    'The most feature-rich Bizarre Lineage script. Full automation, build management, raid farming, and advanced combat tools.',
    'online',
    ARRAY[
      'Auto Farm Mobs','Auto Farm Items','Auto Training (Gym)','Auto Storyline',
      'Auto PvE Mission','Auto World Event','Auto Raid','Stand Sniper (trait filter)',
      'Auto Roll Stand','Void Mob V1 & V2','Mob Despawn Abuser','Best PvE Build Equip',
      'Build Config System (save/load)','Chest Farmer','Auto Stats Allocator','Server Hop',
      'Server Hop (min players)','Teleporters (NPCs, Raids, Training, Locations)',
      'Auto Parry','Auto Roll','Anti Stun / Anti Slowdown / Anti Ragdoll',
      'Aimbot (Camera & Silent)','FOV Circle','Aim Part Selector','Visibility Check',
      'Team Check','Fly (Camera / MoveDirection modes)','Speed Hack','Infinite Jump',
      'Hitbox Expander','No Clip','No Animations','Freecam','FOV Changer',
      'Fullbright','No Fog','Nearby Notifications','Chat Logger','Anti AFK',
      'FPS Unlocker','Companion GUI','Theme Manager','Config Save/Load'
    ],
    ARRAY['Synapse X','Script-Ware','Fluxus']
  ),
  (
    'Anime Battle Arena',
    'anime-battle-arena',
    'Anime Battle Arena',
    'Dominate every match in ABA with automated timing systems, character macros, and combat tools.',
    'online',
    ARRAY[
      'Auto Nanami Cut (timing)','Auto Black Flash (all JJK chars)','Auto Law Gamma Knife',
      'Auto Kokushibo','Auto Toji Slasher','Auto Tengen','Auto Block M1 (Prediction)',
      'Auto Parry Counter M1',
      'Character Macros (Todo, Gojo, Vegeta, Kars, Dio, Aizen, Starrk, Kiritsugu, Rikka, Asuna)',
      'Custom Key Bindings (7 slots)','Attach to Head (Tech)','Exit Combo (teleport back)',
      'Camera Lock','Auto Prestige','Rollback Anti-Death','Player ESP',
      'Hitbox Expander','Infinite Mode','FPS Unlocker','Theme Manager','Config Save/Load'
    ],
    ARRAY['Synapse X','Script-Ware','Fluxus','Delta']
  ),
  (
    'Grand Piece Online',
    'grand-piece-online',
    'Grand Piece Online',
    'Comprehensive GPO automation for farming, looting, and sea combat. Stay ahead with powerful ESP and teleport tools.',
    'online',
    ARRAY[
      'Auto Farm Mobs','Auto Farm Sea Beasts','Auto Chest Looting','Island Teleporters',
      'NPC Teleporters','Player ESP (Boxes, Names, Health)','Item ESP','Fruit ESP',
      'Chest ESP','Hitbox Expander','Fly','Speed Hack','Infinite Jump','No Clip',
      'Anti AFK','Server Hop','Auto Stats Allocator','Theme Manager','Config Save/Load'
    ],
    ARRAY['Synapse X','Script-Ware','Fluxus']
  ),
  (
    'Kaizen',
    'kaizen',
    'Kaizen',
    'Advanced combat and farming tools for Kaizen. Precision aimbot, ESP, and auto-farm systems optimized for ranked play.',
    'online',
    ARRAY[
      'Aimbot (Silent & Camera)','FOV Circle','Aim Part Selector (Head / HRP)',
      'Visibility Check','Team Check','Player ESP','Hitbox Expander','Auto Farm Mobs',
      'Auto Quest','Teleporters','Fly','Speed Hack','Infinite Jump','No Clip',
      'Fullbright','Anti AFK','Server Hop','Theme Manager','Config Save/Load'
    ],
    ARRAY['Synapse X','Script-Ware','Fluxus']
  ),
  (
    'Project Delta',
    'project-delta',
    'Project Delta',
    'Streamlined Project Delta script with farming automation, combat utilities, and quality-of-life features.',
    'online',
    ARRAY[
      'Auto Farm','Auto Quest','Auto Collect Items','Player ESP','Hitbox Expander',
      'Fly','Speed Hack','Infinite Jump','No Clip','Anti AFK','Server Hop',
      'Teleporters','Theme Manager','Config Save/Load'
    ],
    ARRAY['Synapse X','Script-Ware','Fluxus','Delta']
  ),
  (
    'Universal',
    'universal',
    'All Games',
    'Powerful universal script that works across any Roblox game. Essential tools available everywhere.',
    'online',
    ARRAY[
      'Fly (Camera / MoveDirection modes)','Speed Hack','Infinite Jump','No Clip',
      'Aimbot (Camera & Silent)','FOV Circle','Hitbox Expander',
      'Player ESP (Boxes, Names, Health)','No Animations','Freecam','FOV Changer',
      'Fullbright','No Fog','Anti AFK','Server Hop','Chat Logger',
      'Nearby Player Notifications','FPS Unlocker','Companion GUI',
      'Theme Manager','Config Save/Load'
    ],
    ARRAY['Synapse X','Script-Ware','Fluxus','Delta','Solara']
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  game = EXCLUDED.game,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  features = EXCLUDED.features,
  supported_executors = EXCLUDED.supported_executors,
  updated_at = now();

-- Confirm
SELECT 'Admin role granted + ' || COUNT(*) || ' scripts seeded' AS result FROM public.scripts;
