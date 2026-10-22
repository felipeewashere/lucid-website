import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import {
  Activity, Aperture, ArrowUpFromLine, BadgeInfo, Binoculars, BookOpen, Boxes, CalendarDays, ChartNoAxesCombined,
  Check, ChevronDown, ChevronUp, Coins, Compass, Egg, Feather, Filter, FlaskConical, Flower, Focus,
  Footprints, Gauge, Gift, Globe, Hand, Heart, Layers, LayoutDashboard, LifeBuoy, Link2, ListChecks,
  ListOrdered, Navigation, Network, NotebookPen, NotebookTabs, Palette, PawPrint, PersonStanding, Pin, Radar,
  Route, ScanEye, ScanFace, Search, Settings, Shield, ShieldCheck, ShoppingCart, SlidersHorizontal,
  Sparkles, Star, SunMoon, TrendingUp, Truck, VenetianMask,
} from "lucide-react";
import lucidLogo from "@/assets/lucid-logo-new.png";
import { AREAS, CHANGELOG, MUTATIONS, PINNABLE, RARITY, SPECIES } from "./saeData";

/* ------------------------------------------------------------------ */
/* Theme: Template/Core/Configs.lua + Library.lua (read from the live  */
/* client: Balthazar font, black / #0e0e0e / #2e2e2e / #f0f0f0)        */
/* ------------------------------------------------------------------ */

export const T = {
  background: "#000000",
  container: "#020202",
  footer: "#080808",
  main: "#0e0e0e",
  outline: "#2e2e2e",
  font: "#ffffff",
  accent: "#f0f0f0",
  accentGradient: "linear-gradient(135deg, #ffffff, #969696)",
};
export const FONT = "Balthazar, 'Times New Roman', serif";

/* ------------------------------------------------------------------ */
/* Schema (dumped from the running Steal An Egg script)                 */
/* ------------------------------------------------------------------ */

export type Value = boolean | number | string | string[];

export type Item =
  | { t: "toggle"; id: string; label: string; def?: boolean; key?: string; color?: string; items?: Item[] }
  | { t: "slider"; id: string; label: string; min: number; max: number; def: number; dec?: number; suffix?: string }
  | { t: "dropdown"; id: string; label: string; values: string[]; def: string | string[]; multi?: boolean }
  | { t: "input"; id: string; label: string; def: string; ph?: string }
  | { t: "color"; id: string; label: string; def: string }
  | { t: "button"; label: string }
  | { t: "label"; text: string }
  | { t: "divider" }
  | { t: "eggs" }
  | { t: "viewport" }
  | { t: "dep"; on: string; equals?: Value; items: Item[] };

export type Group =
  | { title: string; icon: LucideIcon; items: Item[] }
  | { title: string; icon?: undefined; tabs: { name: string; items: Item[] }[] };

export type Page = { name: string; left: Group[]; right: Group[] };
export type Tab = { name: string; icon: LucideIcon; pinned?: boolean; pages: Page[] };

const filters = (p: string, minimum = "Any", mutations = false): Item[] => [
  { t: "dropdown", id: `${p}MinRarity`, label: "Minimum rarity", values: RARITY, def: minimum },
  { t: "input", id: `${p}MinValue`, label: "Minimum income / second (0 = all)", def: "0" },
  { t: "dropdown", id: `${p}Species`, label: "Specific species (empty = all)", values: SPECIES, def: [], multi: true },
  ...(mutations
    ? [{ t: "dropdown", id: `${p}Mutations`, label: "Required mutations (empty = all)", values: MUTATIONS, def: [], multi: true } as Item]
    : []),
];

const sellTab = (p: string, title: string, maxRarity: string): Item[] => [
  { t: "toggle", id: p, label: `Auto Sell ${title}` },
  { t: "dropdown", id: `${p}Rule`, label: "Sell rule", values: ["Rarity", "Value", "Rarity AND Value", "Rarity OR Value"], def: "Rarity AND Value" },
  { t: "dropdown", id: `${p}MaxRarity`, label: "Maximum rarity", values: RARITY, def: maxRarity },
  { t: "input", id: `${p}MaxValue`, label: "Sell income below (0 = off)", def: "0" },
  { t: "label", text: "Matches: 0" },
  { t: "button", label: `Sell ${title} Now` },
];

const protectTab = (p: string, noun: string): Item[] => [
  { t: "toggle", id: `${p}KeepMutated`, label: `Keep mutated ${noun}`, def: true },
  { t: "dropdown", id: `${p}Blacklist`, label: "Never sell these species", values: SPECIES, def: [], multi: true },
];

const TABS: Tab[] = [
  {
    name: "Credits", icon: Sparkles,
    pages: [{
      name: "Credits",
      left: [
        {
          title: "About Lucid", icon: BadgeInfo,
          items: [
            { t: "label", text: "Game: Steal An Egg" },
            { t: "label", text: "Build ID 92088214" },
            { t: "label", text: "Executor: Potassium" },
          ],
        },
        {
          title: "Community", icon: Link2,
          items: [{ t: "button", label: "Discord" }, { t: "button", label: "Script Page" }, { t: "button", label: "Youtube" }],
        },
      ],
      right: [{ title: "Release Notes", icon: NotebookTabs, items: CHANGELOG.map((text): Item => ({ t: "label", text })) }],
    }],
  },
  {
    name: "Dashboard", icon: LayoutDashboard,
    pages: [
      {
        name: "Status",
        left: [{
          title: "Session", icon: Activity,
          items: [
            { t: "label", text: "Ready" },
            { t: "label", text: "Delivered: 0\nSession: 0 minutes" },
            { t: "label", text: "Target: none" },
            { t: "button", label: "Stop All" },
          ],
        }],
        right: [{ title: "Automation", icon: ListChecks, items: [{ t: "label", text: "No active tasks" }] }],
      },
      {
        name: "Task Priority",
        left: [{
          title: "Movement tasks", icon: ListOrdered,
          items: ["Stealing", "Placement", "Wisp", "Butterflies", "Shooting Stars", "Racing", "Training"].map(
            (n, i): Item => ({ t: "slider", id: `Priority${n}`, label: `${n} priority (lower goes first)`, min: 1, max: 20, def: i + 1 }),
          ),
        }],
        right: [],
      },
    ],
  },
  {
    name: "Stealing", icon: Hand,
    pages: [
      {
        name: "Auto Steal",
        left: [
          {
            title: "Stealing",
            tabs: [
              { name: "Manual", items: [{ t: "eggs" }] },
              {
                name: "Auto",
                items: [
                  {
                    t: "toggle", id: "AutoSteal", label: "Auto Steal", key: "None",
                    items: [{ t: "dropdown", id: "StealPriority", label: "Target priority", values: ["Highest Value", "Highest Rarity", "Nearest", "Largest"], def: "Highest Value" }],
                  },
                ],
              },
            ],
          },
          {
            title: "Delivery", icon: Truck,
            items: [
              { t: "dropdown", id: "Movement", label: "Movement", values: ["Run", "Tween"], def: "Run" },
              { t: "dep", on: "Movement", equals: "Tween", items: [{ t: "slider", id: "TweenSpeed", label: "Tween speed (studs/s)", min: 50, max: 600, def: 150 }] },
              { t: "dropdown", id: "DeliveryMode", label: "Delivery", values: ["Normal", "Teleport"], def: "Normal" },
              { t: "dep", on: "DeliveryMode", equals: "Teleport", items: [{ t: "slider", id: "StealSteps", label: "Drops and regrabs", min: 1, max: 6, def: 3 }] },
            ],
          },
        ],
        right: [{
          title: "Egg filters", icon: Filter,
          items: [...filters("Steal", "Any", true), { t: "dropdown", id: "StealAreas", label: "Areas (empty = all)", values: AREAS, def: [], multi: true }],
        }],
      },
      {
        name: "Collection",
        left: [{
          title: "Missing eggs", icon: BookOpen,
          items: [
            { t: "toggle", id: "StealIndex", label: "Steal Missing Index Eggs" },
            { t: "toggle", id: "SkipOwnedLab", label: "Skip Owned Lab Eggs" },
          ],
        }],
        right: [{
          title: "Lab stock", icon: Boxes,
          items: [
            { t: "dropdown", id: "StockLabSpecies", label: "Stock Lab Eggs For", values: SPECIES, def: [], multi: true },
            {
              t: "toggle", id: "StockLab", label: "Auto Stock Selected Lab Eggs",
              items: [{ t: "slider", id: "LabStockCount", label: "Stock per egg", min: 1, max: 20, def: 1 }],
            },
            { t: "toggle", id: "MinigameEgg", label: "Auto Steal Minigame Egg", key: "None" },
          ],
        }],
      },
    ],
  },
  {
    name: "Eggs", icon: Egg,
    pages: [
      {
        name: "Placement",
        left: [{
          title: "Placement", icon: Settings,
          items: [
            { t: "toggle", id: "AutoPlace", label: "Auto Place Egg", key: "None" },
            { t: "toggle", id: "PlaceLab", label: "Auto Place Lab Reward Eggs" },
          ],
        }],
        right: [{
          title: "Placement filters", icon: Filter,
          items: [
            ...filters("Place"),
            { t: "dropdown", id: "PlaceRarities", label: "Place rarity ranks (empty = all)", values: Array.from({ length: 12 }, (_, i) => String(i + 1)), def: [], multi: true },
          ],
        }],
      },
      {
        name: "Hatching",
        left: [{ title: "Hatching", icon: Settings, items: [{ t: "toggle", id: "AutoHatch", label: "Auto Hatch", key: "None" }] }],
        right: [{ title: "Hatch filters", icon: Filter, items: filters("Hatch") }],
      },
      {
        name: "Mutations",
        left: [{
          title: "Mutation consumables", icon: FlaskConical,
          items: [
            {
              t: "toggle", id: "AutoMutate", label: "Auto Mutate", key: "None",
              items: [
                { t: "dropdown", id: "MutationsToUse", label: "Mutations To Use", values: MUTATIONS, def: [], multi: true },
                { t: "dropdown", id: "MutatePriority", label: "Mutate priority", values: ["Highest Value", "Highest Rarity", "Largest"], def: "Highest Value" },
              ],
            },
            { t: "toggle", id: "BuyNitro", label: "Auto Buy Nitro" },
          ],
        }],
        right: [{ title: "Mutation targets", icon: Filter, items: filters("Mutate") }],
      },
    ],
  },
  {
    name: "Pets", icon: PawPrint,
    pages: [
      {
        name: "Equipment",
        left: [{ title: "Equipment", icon: Settings, items: [{ t: "toggle", id: "EquipBest", label: "Auto Equip Best" }] }],
        right: [],
      },
      {
        name: "Favorites",
        left: [{
          title: "Favorite rules", icon: Heart,
          items: [
            { t: "toggle", id: "AutoFavorite", label: "Auto Favorite Pet" },
            ...filters("Favorite", "Rare", true),
            { t: "dropdown", id: "FavoriteAlways", label: "Always Favorite Species", values: SPECIES, def: [], multi: true },
            { t: "button", label: "Favorite Pets Now" },
          ],
        }],
        right: [{
          title: "Equipped pets", icon: Settings,
          items: [
            { t: "toggle", id: "FavoriteEquipped", label: "Auto Favorite Equipped" },
            { t: "toggle", id: "UnfavoriteEquipped", label: "Auto Unfavorite Equipped" },
            { t: "button", label: "Favorite Equipped Now" },
            { t: "button", label: "Unfavorite Equipped Now" },
          ],
        }],
      },
      {
        name: "Sell Eggs",
        left: [{ title: "Sell eggs", tabs: [{ name: "Eggs", items: sellTab("SellEgg", "Eggs", "Rare") }, { name: "Lab", items: sellTab("SellLab", "Lab Eggs", "Any") }] }],
        right: [{ title: "Protection", tabs: [{ name: "Eggs", items: protectTab("SellEgg", "eggs") }, { name: "Lab", items: protectTab("SellLab", "eggs") }] }],
      },
      {
        name: "Sell Pets",
        left: [{ title: "Sell pets", icon: Coins, items: sellTab("SellPet", "Pets", "Rare") }],
        right: [{ title: "Protection", icon: ShieldCheck, items: protectTab("SellPet", "pets") }],
      },
    ],
  },
  {
    name: "Progression", icon: TrendingUp,
    pages: [
      {
        name: "Training",
        left: [{
          title: "Treadmill", icon: Settings,
          items: [
            { t: "toggle", id: "AutoTreadmill", label: "Auto Treadmill", key: "None" },
            { t: "toggle", id: "StayTreadmill", label: "Stay On Treadmill" },
            { t: "toggle", id: "AdminTreadmill", label: "Auto Use Admin Treadmill" },
            { t: "toggle", id: "UpgradeTreadmill", label: "Auto Upgrade Treadmill" },
          ],
        }],
        right: [],
      },
      {
        name: "Base & Rewards",
        left: [{
          title: "Base and trails", icon: Settings,
          items: [{ t: "toggle", id: "UpgradeBase", label: "Auto Upgrade Base" }, { t: "toggle", id: "BuyTrail", label: "Auto Buy Trail" }],
        }],
        right: [{
          title: "Rewards", icon: Gift,
          items: [{ t: "toggle", id: "ClaimOffline", label: "Auto Claim Offline Money" }, { t: "toggle", id: "ClaimIndex", label: "Auto Claim Index" }],
        }],
      },
    ],
  },
  {
    name: "Lab", icon: FlaskConical,
    pages: [
      {
        name: "Fuse",
        left: [{
          title: "Fuse machine", icon: Settings,
          items: [
            {
              t: "toggle", id: "AutoFuse", label: "Auto Fuse Machine", key: "None",
              items: [
                { t: "dropdown", id: "FuseOrder", label: "Fuse priority", values: ["Lowest Value", "Highest Value", "Highest Rarity"], def: "Lowest Value" },
                { t: "dropdown", id: "FusePetOrder", label: "Pets to use", values: ["Lowest Value", "Highest Value", "Largest"], def: "Lowest Value" },
              ],
            },
          ],
        }],
        right: [{
          title: "Fuse filters", icon: Filter,
          items: [
            { t: "dep", on: "AutoFuse", equals: true, items: [
              { t: "dropdown", id: "FuseMaxRarity", label: "Maximum rarity to fuse", values: RARITY, def: "Legendary" },
              { t: "dropdown", id: "FuseSpecies", label: "Specific species (empty = all)", values: SPECIES, def: [], multi: true },
            ] },
            { t: "toggle", id: "FuseSkipMutated", label: "Skip Mutated Pets", def: true },
            { t: "toggle", id: "FuseEject", label: "Eject Incomplete Slots" },
          ],
        }],
      },
      {
        name: "Predictor",
        left: [{
          title: "Fuse preview", icon: ChartNoAxesCombined,
          items: [{ t: "label", text: "Select three pets or enable Auto Fuse to preview" }, { t: "button", label: "Refresh fuse predictor" }],
        }],
        right: [],
      },
    ],
  },
  {
    name: "Events", icon: CalendarDays,
    pages: [
      {
        name: "Race Events",
        left: [
          {
            title: "Race Rally", icon: Activity,
            items: [
              { t: "label", text: "LIVE - Joining  |  ready" },
              { t: "toggle", id: "AutoRace", label: "Auto Race", key: "None", def: true },
              { t: "slider", id: "RaceSpeed", label: "Race Speed (studs/s)", min: 60, max: 200, def: 170 },
              { t: "toggle", id: "RacePowerups", label: "Auto Use Power-Ups", def: true },
            ],
          },
          {
            title: "Shooting Star", icon: Star,
            items: [
              { t: "label", text: "No star  |  caught 0" },
              { t: "toggle", id: "AutoStar", label: "Auto Catch Star", key: "None" },
              { t: "toggle", id: "StarReturnHome", label: "Return Home After Catch", def: true },
              { t: "toggle", id: "StarAlert", label: "Star Alert", def: true },
            ],
          },
        ],
        right: [{
          title: "Rewards & Shop", icon: Gift,
          items: [
            { t: "label", text: "Trophies 4050  |  Wins 2" },
            { t: "toggle", id: "RaceClaim", label: "Auto Claim Goals" },
            { t: "toggle", id: "RaceEquip", label: "Auto Equip Best Racer" },
            { t: "dropdown", id: "RaceItems", label: "Shop Items To Buy", values: ["MutationToken  (475)", "CashBooster  (275)", "SpeedBoost  (375)", "TreadmillBoost  (375)", "RacingBat  (10000)"], def: [], multi: true },
            { t: "toggle", id: "RaceBuy", label: "Auto Buy Racing Event" },
          ],
        }],
      },
      {
        name: "Wisp Event",
        left: [
          {
            title: "Wisp Quest", icon: ListChecks,
            items: [
              { t: "label", text: "NOT ELIGIBLE\n> 1. Steal 20 Enchanted Forest eggs  0/20\n2. Fuse an Enchanted Forest animal  -\n3. Steal any Eternal  -" },
              { t: "toggle", id: "AutoWisp", label: "Auto Quest", key: "None" },
              { t: "button", label: "Fuse 3 Enchanted Pets" },
            ],
          },
          {
            title: "Trade & Craft", icon: Coins,
            items: [
              { t: "button", label: "Trade Up Green -> Blue" },
              { t: "button", label: "Trade Up Blue -> Purple" },
              { t: "button", label: "Trade Up Purple -> Golden" },
              { t: "button", label: "Trade every recipe (clear selection)" },
              { t: "label", text: "Trade 0/10 0/10 0/50  |  Essence 0/240 0/115 0/40 0/1" },
              { t: "toggle", id: "ButterflyTrade", label: "Auto Trade Up (after bloom)" },
              { t: "toggle", id: "CraftEssence", label: "Auto Craft Essence (after bloom)" },
              { t: "button", label: "Trade Up Now" },
              { t: "button", label: "Craft Essence" },
              { t: "button", label: "Claim Butterfly Net" },
            ],
          },
        ],
        right: [{
          title: "Butterfly Bloom", icon: Flower,
          items: [
            { t: "label", text: "Bloom in 10m 59s  |  locked" },
            { t: "label", text: "Emerald 0  Sapphire 0  Amethyst 0  Radiant 0\nEssence 0  |  Caught 0" },
            { t: "toggle", id: "ButterflyNet", label: "Auto Claim Net" },
            { t: "toggle", id: "ButterflyEsp", label: "Butterfly ESP" },
            { t: "toggle", id: "AutoButterfly", label: "Auto Catch", key: "None" },
            { t: "toggle", id: "ButterflyChase", label: "Auto Chase Butterflies" },
            { t: "dropdown", id: "ButterflyStyle", label: "Catch Style", values: ["Default", "Zigzag", "Orbit", "Stay", "Spiral"], def: "Default" },
            { t: "dropdown", id: "ButterflyTiers", label: "Catch Tiers (empty = all)", values: ["Green", "Blue", "Purple", "Golden"], def: [], multi: true },
            { t: "button", label: "Go to Enchanted Tree" },
            { t: "button", label: "Go Back to Safe Zone" },
          ],
        }],
      },
      {
        name: "Dr. Scramble",
        left: [
          {
            title: "Predict Laboratory", icon: ChartNoAxesCombined,
            items: [
              { t: "label", text: "Unstable DNA  |  rotates in 25m 59s" },
              { t: "label", text: "1. Biohazard Pets  25m  (Nuclear Mantis)\n2. Unstable DNA  1h 25m  (Octophant)\n3. Experimental Pets  2h 25m  (Dreadstinger)\n4. Biohazard Pets  3h 25m  (Nuclear Mantis)\n5. Unstable DNA  4h 25m  (Octophant)" },
            ],
          },
          {
            title: "Experiment Shop", icon: ShoppingCart,
            items: [
              { t: "dropdown", id: "ScrambleItems", label: "Items to Auto Buy", values: [], def: [], multi: true },
              { t: "toggle", id: "ScrambleBuy", label: "Auto Buy Experiment Shop Items" },
              { t: "input", id: "ScrambleReserve", label: "Samples to keep", def: "0" },
              { t: "button", label: "Refresh shop" },
              { t: "button", label: "Open Experiment Vault" },
            ],
          },
        ],
        right: [{
          title: "Dr. Scramble Laboratory", icon: FlaskConical,
          items: [
            { t: "label", text: "Unstable DNA  |  0/0 eggs ready" },
            { t: "toggle", id: "StealLab", label: "Auto Steal Lab Eggs" },
            { t: "toggle", id: "LabTrade", label: "Auto Trade-In Laboratory", key: "None" },
            { t: "toggle", id: "LabReroll", label: "Auto Free Reroll" },
            { t: "dropdown", id: "LabBanners", label: "Target Banner (none = any)", values: ["1", "2", "3"], def: [], multi: true },
          ],
        }],
      },
    ],
  },
  {
    name: "Player", icon: PersonStanding,
    pages: [{
      name: "Player",
      left: [
        {
          title: "Player Tools", icon: ShieldCheck,
          items: [
            { t: "toggle", id: "NoClip", label: "NoClip", key: "None" },
            { t: "toggle", id: "Zoom", label: "Zoom", key: "None", items: [{ t: "slider", id: "ZoomStrength", label: "Zoom Strength", min: 1, max: 10, def: 2, dec: 1 }] },
            { t: "toggle", id: "AntiAfkU", label: "Anti-AFK" },
            { t: "input", id: "FpsCapIn", label: "FPS Cap", def: "60", ph: "Enter target FPS" },
            { t: "toggle", id: "PerfMode", label: "Performance Mode" },
            { t: "button", label: "Quick Reset" },
          ],
        },
        {
          title: "Safety & Recovery", icon: LifeBuoy,
          items: [
            { t: "toggle", id: "AntiVoid", label: "Anti Void", items: [{ t: "toggle", id: "LowerVoid", label: "Lower The Void", def: true }] },
            { t: "toggle", id: "AntiFling", label: "Anti Fling" },
            { t: "toggle", id: "KillBricks", label: "Remove KillBricks" },
            { t: "toggle", id: "TpOnDeath", label: "TP Back On Death" },
            { t: "toggle", id: "AutoRejoinU", label: "Auto Rejoin" },
            { t: "toggle", id: "ModNotifier", label: "Mod Notifier" },
            { t: "toggle", id: "LeaveMod", label: "Leave If Mod Joins" },
            { t: "dropdown", id: "StaffCount", label: "Also Count As Staff", values: ["Content Creators", "Partners", "Early Access"], def: ["Partners"], multi: true },
          ],
        },
        {
          title: "Protection", icon: ShieldCheck,
          items: [
            { t: "toggle", id: "AntiTrap", label: "Anti Trap" },
            { t: "toggle", id: "AntiRagdoll", label: "Anti Ragdoll" },
            { t: "toggle", id: "StayOffTreadmill", label: "Stay Off Treadmill" },
            { t: "toggle", id: "AntiAfk", label: "Game Anti AFK" },
            { t: "toggle", id: "InstantPrompts", label: "Instant Prompts", def: true },
          ],
        },
      ],
      right: [
        {
          title: "Fly", icon: Feather,
          items: [{ t: "toggle", id: "Fly", label: "Fly", key: "Y", items: [{ t: "slider", id: "FlySpeed", label: "Fly Speed", min: 30, max: 400, def: 100 }] }],
        },
        {
          title: "Jump Settings", icon: ArrowUpFromLine,
          items: [
            { t: "toggle", id: "Jump", label: "Jump Power", items: [{ t: "slider", id: "JumpHeight", label: "Jump Height", min: 5, max: 200, def: 7.2, dec: 1 }] },
            { t: "toggle", id: "IgnoreJumpLock", label: "Ignore Jump Lock" },
            { t: "toggle", id: "InfJump", label: "Infinite Jump" },
            { t: "toggle", id: "Bhop", label: "Bunny Hop" },
          ],
        },
        {
          title: "Run Speed", icon: Gauge,
          items: [{ t: "toggle", id: "Speed", label: "Speed", key: "None", items: [{ t: "slider", id: "SpeedValue", label: "Speed Value", min: 16, max: 300, def: 30 }] }],
        },
        { title: "Click Teleport", icon: Navigation, items: [{ t: "toggle", id: "ClickTp", label: "Click To Teleport", key: "None" }] },
      ],
    }],
  },
  {
    name: "Visuals", icon: ScanEye,
    pages: [
      {
        name: "ESP",
        left: [
          {
            title: "Players", icon: ScanFace,
            items: [{
              t: "toggle", id: "PlayerEsp", label: "Enable Player ESP",
              items: [
                { t: "toggle", id: "EspWeapon", label: "Held Item" },
                { t: "toggle", id: "EspNearest", label: "Closest Player Only" },
                { t: "toggle", id: "EspShowMe", label: "Include My Character" },
                { t: "dropdown", id: "EspOnly", label: "Only Show This Player", values: ["Everyone", "6767AH56", "FromOkata04", "Minhnguok29", "Vasilije28099"], def: "Everyone" },
                {
                  t: "toggle", id: "EspBox", label: "Box", color: "#ffffff",
                  items: [
                    { t: "toggle", id: "EspBoxOutline", label: "Outline" },
                    { t: "toggle", id: "EspBox3d", label: "3D Box" },
                    { t: "toggle", id: "EspBoxFill", label: "Fill" },
                    { t: "slider", id: "EspFillAlpha", label: "Fill Opacity", min: 0, max: 100, def: 35, suffix: "%" },
                  ],
                },
                { t: "toggle", id: "EspName", label: "Name", color: "#ffffff" },
                { t: "toggle", id: "EspInfo", label: "Player Details", color: "#ffffff" },
                { t: "toggle", id: "EspDistance", label: "Distance", color: "#ffffff" },
                { t: "toggle", id: "EspHealthBar", label: "Health Bar" },
                { t: "toggle", id: "EspHealthText", label: "Health Text" },
                { t: "toggle", id: "EspTracer", label: "Tracer", color: "#ffffff" },
                { t: "toggle", id: "EspSkeleton", label: "Skeleton", color: "#ffffff" },
                { t: "toggle", id: "EspArrow", label: "Off-Screen Arrow", color: "#ffffff" },
                { t: "toggle", id: "EspChams", label: "Chams", color: "#ffffff", items: [{ t: "toggle", id: "EspChamsVisible", label: "Visible-Only" }] },
              ],
            }],
          },
          {
            title: "Eggs", icon: Egg,
            items: [{
              t: "toggle", id: "EggEsp", label: "Egg ESP",
              items: [
                ...filters("Esp", "Any", true),
                { t: "dropdown", id: "EspDetails", label: "Details", values: ["Icon", "Name", "Rarity", "Mutation", "Value", "Weight", "Size", "Sell Price", "Distance", "Area", "State"], def: ["Icon", "Name", "Value", "Distance"], multi: true },
                { t: "slider", id: "EspSize", label: "Text size (%)", min: 50, max: 200, def: 100 },
                { t: "slider", id: "EspRender", label: "Render distance", min: 100, max: 20000, def: 10000 },
                { t: "toggle", id: "EspOwnBase", label: "Own base eggs", def: true },
                { t: "toggle", id: "EspOtherBases", label: "Other base eggs" },
                { t: "toggle", id: "EspCustomColor", label: "Custom color", color: "#ffdc64" },
                { t: "toggle", id: "EspHighlight", label: "Highlight eggs" },
              ],
            }],
          },
        ],
        right: [
          {
            title: "Radar", icon: Radar,
            items: [{
              t: "toggle", id: "RadarOn", label: "Enable Radar",
              items: [
                { t: "slider", id: "RadarRange", label: "Range", min: 100, max: 2000, def: 500, suffix: " studs" },
                { t: "slider", id: "RadarScale", label: "HUD Scale", min: 50, max: 200, def: 100, suffix: "%" },
                { t: "dropdown", id: "RadarMode", label: "Rotation Mode", values: ["Camera", "North"], def: "Camera" },
              ],
            }],
          },
          {
            title: "Guards", icon: Shield,
            items: [{
              t: "toggle", id: "GuardEsp", label: "Guard ESP", color: "#ff5a5a",
              items: [
                { t: "dropdown", id: "GuardInfo", label: "Details", values: ["Name", "Distance", "Speed"], def: ["Name", "Distance"], multi: true },
                { t: "slider", id: "GuardSize", label: "Text size (%)", min: 50, max: 200, def: 100 },
                { t: "slider", id: "GuardDistance", label: "Render distance", min: 100, max: 20000, def: 10000 },
                { t: "toggle", id: "GuardHighlight", label: "Highlight guards" },
              ],
            }],
          },
        ],
      },
      {
        name: "Misc",
        left: [
          {
            title: "World Effects", icon: SunMoon,
            items: [
              { t: "toggle", id: "NoFog", label: "No Fog" },
              {
                t: "toggle", id: "Fullbright", label: "Fullbright",
                items: [
                  { t: "dropdown", id: "FbMode", label: "Lighting Mode", values: ["Passive", "Aggressive"], def: "Passive" },
                  { t: "slider", id: "FbBrightness", label: "Brightness", min: 0.01, max: 5, def: 1, dec: 3 },
                ],
              },
              { t: "toggle", id: "XRay", label: "X-Ray", key: "None" },
            ],
          },
          {
            title: "Scene Visibility", icon: Layers,
            items: [
              { t: "toggle", id: "HideMap", label: "Hide Map" },
              { t: "toggle", id: "HideSelf", label: "Hide My Character" },
              { t: "toggle", id: "HideOthers", label: "Hide Other Players" },
              { t: "toggle", id: "No3D", label: "Disable 3D Rendering" },
            ],
          },
        ],
        right: [
          {
            title: "View Settings", icon: Focus,
            items: [
              { t: "toggle", id: "InfCam", label: "Infinite Zoom" },
              {
                t: "toggle", id: "ThirdPerson", label: "Force Third Person",
                items: [{ t: "slider", id: "TpDist", label: "Closest Zoom", min: 2, max: 40, def: 10, suffix: " studs" }],
              },
              { t: "slider", id: "Fov", label: "Camera FOV", min: 40, max: 120, def: 70 },
            ],
          },
          {
            title: "Free Camera", icon: Aperture,
            items: [{
              t: "toggle", id: "Freecam", label: "Freecam", key: "None",
              items: [
                { t: "dropdown", id: "FcMode", label: "Freecam Type", values: ["Cinematic", "Functional"], def: "Cinematic" },
                { t: "slider", id: "FcSens", label: "Freecam Sensitivity", min: 0.1, max: 3, def: 1, dec: 2 },
                { t: "slider", id: "FcSpeed", label: "Freecam Move Speed", min: 0.1, max: 20, def: 1, dec: 1, suffix: "x" },
              ],
            }],
          },
        ],
      },
    ],
  },
  {
    name: "Misc", icon: Compass,
    pages: [
      {
        name: "Misc",
        left: [
          {
            title: "Scene Lighting", icon: Palette,
            items: [
              { t: "toggle", id: "EnvAmbient", label: "Custom Ambient", items: [{ t: "color", id: "EnvAmbientColor", label: "Ambient Color", def: "#7f7f7f" }] },
              { t: "toggle", id: "EnvTimeLock", label: "Custom Time of Day", items: [{ t: "slider", id: "EnvTime", label: "Time of Day", min: 0, max: 24, def: 11.6, dec: 1, suffix: "h" }] },
            ],
          },
          {
            title: "Player View", icon: Binoculars,
            items: [
              { t: "dropdown", id: "SpecTarget", label: "Select Player", values: ["6767AH56", "Minhnguok29", "FromOkata04", "Vasilije28099"], def: "6767AH56" },
              { t: "button", label: "Refresh Players" },
              { t: "toggle", id: "Spectate", label: "Spectate Player" },
            ],
          },
          { title: "Chat History", icon: NotebookPen, items: [{ t: "toggle", id: "ChatLogger", label: "Chat Logger" }] },
          {
            title: "Server connection", icon: Network,
            items: [
              { t: "input", id: "JobId", label: "Job ID", def: "" },
              { t: "button", label: "Join Job ID" },
              { t: "button", label: "Copy current Job ID" },
              { t: "button", label: "Rejoin server" },
              { t: "button", label: "Server Hop" },
              { t: "toggle", id: "AutoRejoin", label: "Auto Rejoin When Disconnect" },
            ],
          },
          {
            title: "Performance", icon: Gauge,
            items: [
              { t: "toggle", id: "Optimizer", label: "Optimizer" },
              { t: "toggle", id: "HidePets", label: "Hide player pets" },
              { t: "toggle", id: "HideEggs", label: "Hide eggs" },
              { t: "toggle", id: "Disable3d", label: "Disable 3D Render" },
              { t: "toggle", id: "FpsCapEnabled", label: "Apply FPS cap" },
              { t: "dep", on: "FpsCapEnabled", equals: true, items: [{ t: "slider", id: "FpsCap", label: "FPS cap (0 = unlimited)", min: 0, max: 360, def: 144 }] },
              { t: "dep", on: "Disable3d", equals: true, items: [{ t: "dropdown", id: "RenderBackground", label: "Background color", values: ["Black", "Dark Grey", "Blue"], def: "Black" }] },
            ],
          },
        ],
        right: [
          {
            title: "Server Travel", icon: Route,
            items: [
              { t: "dropdown", id: "SrvFilter", label: "Filter", values: ["Lowest Players", "Lowest Ping", "Random"], def: "Lowest Ping" },
              { t: "dropdown", id: "SrvRegion", label: "Region", values: ["Any Region", "NA-WEST", "NA-CENTRAL", "NA-EAST", "SA", "EU", "AF", "AS", "OCE"], def: "Any Region" },
              { t: "slider", id: "SrvMaxPlayers", label: "Max Player Count", min: 1, max: 50, def: 20 },
              { t: "slider", id: "SrvMaxPing", label: "Max Ping (ms)", min: 1, max: 1000, def: 200 },
              { t: "button", label: "Server Hop Once" },
              { t: "toggle", id: "SrvAutoHop", label: "Enable Auto Hop", items: [{ t: "slider", id: "SrvInterval", label: "Auto Hop Interval (s)", min: 1, max: 600, def: 60, suffix: "s" }] },
              { t: "button", label: "Forget Servers I've Been To" },
            ],
          },
          {
            title: "Privacy", icon: VenetianMask,
            items: [{
              t: "toggle", id: "Streamer", label: "Enable Streamer Mode",
              items: [{ t: "dropdown", id: "StreamerOptions", label: "Affects", values: ["Hide Own Name", "Hide Others Names", "Hide Own Skin", "Hide Others Skins"], def: [], multi: true }],
            }],
          },
        ],
      },
      {
        name: "Egg Finder",
        left: [{
          title: "Auto Hop", icon: Search,
          items: [
            {
              t: "toggle", id: "AutoHop", label: "Auto Hop", key: "None",
              items: [
                { t: "dropdown", id: "HopMode", label: "Hop mode", values: ["Until An Egg Matches", "Steal Then Hop", "After A Rare Spawns"], def: "Steal Then Hop" },
                { t: "dropdown", id: "HopRare", label: "Rarity to wait for", values: RARITY, def: "Cosmic" },
                { t: "slider", id: "HopDelay", label: "First hop delay (seconds)", min: 0, max: 60, def: 5 },
                { t: "dropdown", id: "ServerSort", label: "Server hop mode", values: ["Smallest", "Largest"], def: "Smallest" },
              ],
            },
            { t: "toggle", id: "HopSync", label: "Sync with Auto Steal filters", def: true },
          ],
        }],
        right: [{
          title: "Finder filters", icon: Filter,
          items: [...filters("Hop"), { t: "dropdown", id: "HopAreas", label: "Areas (empty = all)", values: AREAS, def: [], multi: true }],
        }],
      },
      {
        name: "Visuals",
        left: [{
          title: "Egg and pet previews", icon: Egg,
          items: [
            { t: "dropdown", id: "VisualKind", label: "Type", values: ["Egg", "Pet"], def: "Egg" },
            { t: "dropdown", id: "VisualSpecies", label: "Egg or pet", values: SPECIES, def: "67" },
            { t: "slider", id: "VisualScale", label: "Size / weight", min: 1, max: 100, def: 50 },
            { t: "button", label: "Hold in hand" },
            { t: "button", label: "Add inventory preview" },
            { t: "button", label: "Remove visual items" },
          ],
        }],
        right: [{
          title: "Ride Guard", icon: Footprints,
          items: [
            { t: "dropdown", id: "RideModel", label: "Guard", values: AREAS, def: "Abyss Ocean" },
            { t: "toggle", id: "RideGuard", label: "Ride Guard" },
            { t: "viewport" },
            { t: "label", text: "Abyss Ocean" },
          ],
        }],
      },
    ],
  },
  {
    name: "UI Settings", icon: SlidersHorizontal, pinned: true,
    pages: [{
      name: "Settings",
      left: [
        {
          title: "Hub Preferences", icon: SlidersHorizontal,
          items: [
            { t: "toggle", id: "MenuAutoShow", label: "Auto Show UI On Load", def: true },
            { t: "toggle", id: "MenuAutoExecute", label: "Auto Execute", def: true },
            { t: "toggle", id: "MenuLogoButton", label: "Show Logo Button", def: true },
            { t: "toggle", id: "KeybindMenu", label: "Open Keybind Menu" },
            { t: "dropdown", id: "NotifySide", label: "Notification Side", values: ["Left", "Right"], def: "Right" },
            { t: "dropdown", id: "Dpi", label: "DPI Scale", values: ["50%", "75%", "100%", "125%", "150%", "175%", "200%"], def: "100%" },
            { t: "divider" },
            { t: "button", label: "Replay Start Guide" },
            { t: "label", text: "Menu bind" },
            { t: "button", label: "Unload" },
            { t: "button", label: "Hard Reset Lucid: REWRITE" },
          ],
        },
        {
          title: "Language & Text", icon: Globe,
          items: [{ t: "label", text: "Showing English. Click below to pick another language." }, { t: "button", label: "Change Language" }],
        },
        {
          title: "Themes", icon: Palette,
          items: [
            { t: "color", id: "ThBg", label: "Background color", def: "#000000" },
            { t: "color", id: "ThMain", label: "Main color", def: "#0e0e0e" },
            { t: "color", id: "ThAccent", label: "Accent color", def: "#f0f0f0" },
            { t: "color", id: "ThOutline", label: "Outline color", def: "#2e2e2e" },
            { t: "color", id: "ThFont", label: "Font color", def: "#ffffff" },
            { t: "label", text: "Contrast check: good (19.3:1)" },
            { t: "dropdown", id: "FontFace", label: "Font Face", values: ["BuilderSans", "Code", "Fantasy", "Gotham", "Jura", "Roboto", "RobotoMono", "SourceSans"], def: "Fantasy" },
            { t: "input", id: "BgImage", label: "Background Image", def: "" },
            { t: "divider" },
            { t: "dropdown", id: "ThemeList", label: "Theme list", values: ["Default", "BBot", "Fatality", "Jester", "Mint", "Tokyo Night", "Ubuntu", "Quartz", "Nord", "Dracula", "Monokai", "Gruvbox", "Solarized", "Catppuccin"], def: "Default" },
            { t: "button", label: "Set as default" },
            { t: "divider" },
            { t: "input", id: "ThemeName", label: "Custom theme name", def: "" },
            { t: "button", label: "Create theme" },
            { t: "divider" },
            { t: "dropdown", id: "CustomThemes", label: "Custom themes", values: [], def: "" },
            { t: "button", label: "Load theme" },
            { t: "button", label: "Overwrite theme" },
            { t: "button", label: "Delete theme" },
            { t: "button", label: "Refresh list" },
            { t: "button", label: "Set as default" },
            { t: "button", label: "Reset default" },
            { t: "label", text: "Current default theme: none" },
            { t: "divider" },
            { t: "input", id: "ThemeJson", label: "Theme JSON", def: "" },
            { t: "button", label: "Import theme" },
            { t: "button", label: "Export current theme" },
          ],
        },
        {
          title: "Pinned features", icon: Pin,
          items: [
            { t: "dropdown", id: "PinnedFeatures", label: "Pinned features", values: PINNABLE, def: ["Auto Treadmill", "Auto Place Egg", "Auto Steal", "Auto Hatch"], multi: true },
            { t: "toggle", id: "QuickBars", label: "Show Quick Bars", items: [{ t: "slider", id: "QuickSize", label: "Quick bar size (%)", min: 50, max: 150, def: 100 }] },
            { t: "button", label: "Reset pins" },
          ],
        },
      ],
      right: [{
        title: "Configuration", icon: Settings,
        items: [
          { t: "input", id: "CfgName", label: "Config name", def: "" },
          { t: "button", label: "Create config" },
          { t: "divider" },
          { t: "dropdown", id: "CfgList", label: "Config list", values: [], def: "" },
          { t: "button", label: "Load config" },
          { t: "button", label: "Overwrite config" },
          { t: "button", label: "Delete config" },
          { t: "button", label: "Refresh list" },
          { t: "button", label: "Set as autoload" },
          { t: "button", label: "Reset autoload" },
          { t: "label", text: "Current autoload config: none" },
          { t: "divider" },
          { t: "input", id: "CfgJson", label: "Config JSON", def: "" },
          { t: "button", label: "Import config" },
          { t: "button", label: "Export current config" },
        ],
      }],
    }],
  },
];

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

type Store = { vals: Record<string, Value>; set: (id: string, v: Value) => void; query: string };
const StoreCtx = createContext<Store>({ vals: {}, set: () => undefined, query: "" });
const useStore = () => useContext(StoreCtx);

function collect(items: Item[], out: Record<string, Value>) {
  for (const it of items) {
    if (it.t === "toggle") out[it.id] = it.def ?? false;
    else if (it.t === "slider" || it.t === "dropdown" || it.t === "input" || it.t === "color") out[it.id] = it.def;
    if ("items" in it && it.items) collect(it.items, out);
  }
}

function defaults(tabs: Tab[]): Record<string, Value> {
  const out: Record<string, Value> = {};
  for (const tab of tabs)
    for (const page of tab.pages)
      for (const g of [...page.left, ...page.right]) {
        if ("tabs" in g) g.tabs.forEach((t) => collect(t.items, out));
        else collect(g.items, out);
      }
  return out;
}

/* Search: Library:UpdateSearch hides every element that does not match. */
const itemText = (it: Item) => ("label" in it ? it.label : "");
function itemMatches(it: Item, q: string): boolean {
  if (!q) return true;
  if (it.t === "dep") return it.items.some((i) => itemMatches(i, q));
  if (itemText(it).toLowerCase().includes(q)) return true;
  return "items" in it && !!it.items && it.items.some((i) => itemMatches(i, q));
}
function groupMatches(g: Group, q: string): boolean {
  if (!q) return true;
  if (g.title.toLowerCase().includes(q)) return true;
  return "tabs" in g ? g.tabs.some((t) => t.items.some((i) => itemMatches(i, q))) : g.items.some((i) => itemMatches(i, q));
}
const pageMatches = (p: Page, q: string) => [...p.left, ...p.right].some((g) => groupMatches(g, q));
const tabMatches = (t: Tab, q: string) => t.pages.some((p) => pageMatches(p, q));

/* ------------------------------------------------------------------ */
/* Controls (sizes taken from Library.lua)                             */
/* ------------------------------------------------------------------ */

function KeyPicker({ initial }: { initial: string }) {
  const [key, setKey] = useState(initial);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setKey(e.key === "Escape" ? "None" : e.key.length === 1 ? e.key.toUpperCase() : e.key);
      setListening(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [listening]);

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); setListening(true); }}
      className="flex h-[18px] min-w-[34px] cursor-pointer items-center justify-center rounded-[3px] border px-1.5 text-[13px] leading-none"
      style={{ background: T.main, borderColor: T.outline, color: listening ? T.font : "rgba(255,255,255,0.5)" }}
    >
      {listening ? "..." : key}
    </span>
  );
}

function Swatch({ initial }: { initial: string }) {
  const [c, setC] = useState(initial);
  return (
    <label className="relative block h-[18px] w-[26px] shrink-0 cursor-pointer overflow-hidden rounded-[3px] border" style={{ background: c, borderColor: T.outline }}>
      <input type="color" value={c} onChange={(e) => setC(e.target.value)} onClick={(e) => e.stopPropagation()} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
    </label>
  );
}

function ToggleRow({ item }: { item: Extract<Item, { t: "toggle" }> }) {
  const { vals, set, query } = useStore();
  const on = vals[item.id] as boolean;
  return (
    <>
      <div className="group relative flex h-5 w-full items-center">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={item.label}
          onClick={() => set(item.id, !on)}
          className="absolute inset-0 z-0 text-left"
        />
        <span className="pointer-events-none flex-1 truncate pr-2 text-[14px] transition-opacity" style={{ opacity: on ? 1 : 0.6, color: T.font }}>
          {item.label}
        </span>
        <span className="relative z-10 mr-[26px] flex items-center gap-1.5">
          {item.color && <Swatch initial={item.color} />}
          {item.key && <KeyPicker initial={item.key} />}
        </span>
        <span
          className="pointer-events-none absolute right-0 top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-[3px] border transition-transform duration-150 group-hover:translate-x-[3px] group-hover:scale-[1.1667]"
          style={{ background: T.main, borderColor: T.outline }}
        >
          <span
            className="absolute inset-0 flex items-center justify-center rounded-[3px] transition-all duration-150"
            style={{ background: T.accentGradient, opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(0)" }}
          >
            <Check size={11} strokeWidth={3} style={{ color: "#ffffff", opacity: 0.9 }} />
          </span>
        </span>
      </div>
      {item.items && on && <Items items={item.items} q={item.label.toLowerCase().includes(query) ? "" : query} />}
    </>
  );
}

function SliderRow({ item }: { item: Extract<Item, { t: "slider" }> }) {
  const { vals, set } = useStore();
  const value = vals[item.id] as number;
  const ref = useRef<HTMLDivElement>(null);
  const dec = item.dec ?? 0;
  const pct = ((value - item.min) / (item.max - item.min)) * 100;
  const fmt = (n: number) => `${dec ? String(+n.toFixed(dec)) : n}${item.suffix ?? ""}`;

  const update = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const f = 10 ** dec;
    set(item.id, Math.round((item.min + t * (item.max - item.min)) * f) / f);
  };

  return (
    <div className="relative h-[38px] select-none">
      <div className="flex h-[15px] items-center justify-between text-[14px]" style={{ color: T.font }}>
        <span className="truncate">{item.label}</span>
        <span className="shrink-0 pl-2">{fmt(value)}/{fmt(item.max)}</span>
      </div>
      <div
        ref={ref}
        role="slider"
        aria-label={item.label}
        aria-valuemin={item.min}
        aria-valuemax={item.max}
        aria-valuenow={value}
        tabIndex={0}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); update(e.clientX); }}
        onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e.clientX); }}
        onKeyDown={(e) => {
          const step = 1 / 10 ** dec;
          if (e.key === "ArrowRight") set(item.id, Math.min(item.max, +(value + step).toFixed(dec)));
          if (e.key === "ArrowLeft") set(item.id, Math.max(item.min, +(value - step).toFixed(dec)));
        }}
        className="absolute bottom-0 left-0 h-2 w-full cursor-pointer touch-none rounded-full border outline-none before:absolute before:-inset-x-1 before:-inset-y-2 before:content-['']"
        style={{ background: T.main, borderColor: T.outline }}
      >
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: T.accentGradient }} />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ left: `${pct}%`, background: T.font, borderColor: T.outline }}
        />
      </div>
    </div>
  );
}

function DropdownRow({ item }: { item: Extract<Item, { t: "dropdown" }> }) {
  const { vals, set } = useStore();
  const value = vals[item.id];
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => { if (open && btn.current) setRect(btn.current.getBoundingClientRect()); }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const n = e.target as Node;
      if (btn.current?.contains(n) || menu.current?.contains(n)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const shown = Array.isArray(value) ? (value.length ? value.join(", ") : "---") : value || "---";

  const pick = (v: string) => {
    if (item.multi) {
      const cur = value as string[];
      set(item.id, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
    } else {
      set(item.id, v);
      setOpen(false);
    }
  };

  const menuH = Math.min(Math.max(item.values.length, 1), 8) * 21;
  const flip = rect ? rect.bottom + 2 + menuH > window.innerHeight && rect.top > menuH + 4 : false;

  return (
    <div>
      <p className="h-[14px] text-[14px] leading-[14px]" style={{ color: T.font }}>{item.label}</p>
      <button
        ref={btn}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative mt-1 flex h-[21px] w-full items-center rounded-[5px] border pl-2 pr-1 text-left text-[14px]"
        style={{
          background: T.main, borderColor: T.outline, color: T.font,
          borderBottomLeftRadius: open && !flip ? 0 : undefined, borderBottomRightRadius: open && !flip ? 0 : undefined,
        }}
      >
        <span className="flex-1 truncate">{shown}</span>
        <ChevronDown size={16} className="shrink-0 transition-transform" style={{ opacity: open ? 1 : 0.5, transform: open ? "rotate(180deg)" : undefined }} />
      </button>
      {open && rect && createPortal(
        <div
          ref={menu}
          className="fixed z-[9999] overflow-y-auto rounded-b-[5px] border"
          style={{
            left: rect.left, width: rect.width, maxHeight: 8 * 21, fontFamily: FONT,
            top: flip ? undefined : rect.bottom + 1.5, bottom: flip ? window.innerHeight - rect.top + 1.5 : undefined,
            background: T.background, borderColor: T.outline, color: T.font,
          }}
        >
          {item.values.length === 0 && <div className="h-[21px] px-2 text-[14px] leading-[21px] opacity-50">---</div>}
          {item.values.map((v) => {
            const active = Array.isArray(value) ? value.includes(v) : value === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => pick(v)}
                className="flex h-[21px] w-full items-center px-2 text-left text-[14px] hover:bg-white/[0.06]"
                style={{ background: active ? T.main : undefined, opacity: active ? 1 : 0.6 }}
              >
                {v}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}

function InputRow({ item }: { item: Extract<Item, { t: "input" }> }) {
  const { vals, set } = useStore();
  return (
    <div>
      <p className="h-[14px] text-[14px] leading-[14px]" style={{ color: T.font }}>{item.label}</p>
      <input
        value={vals[item.id] as string}
        onChange={(e) => set(item.id, e.target.value)}
        placeholder={item.ph ?? "---"}
        className="mt-1 h-[21px] w-full rounded-[5px] border px-2 text-[14px] outline-none transition-colors placeholder:text-white/40 focus:!border-[#f0f0f0]"
        style={{ background: T.main, borderColor: T.outline, color: T.font, fontFamily: "inherit" }}
      />
    </div>
  );
}

function ButtonRow({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="h-[21px] w-full shrink-0 rounded-[5px] border text-[14px] opacity-60 transition-opacity hover:opacity-100"
      style={{ background: T.main, borderColor: T.outline, color: T.font }}
    >
      {label}
    </button>
  );
}

/* Games/sae/Main.lua ManualEggList: 320px panel, 92px cards, 12px gap */
const EGGS = [
  { name: "Demon Hound", rarity: "Mythic", color: "#ff4d6d", value: "$497M" },
  { name: "Octophant", rarity: "Cosmic", color: "#6ce0ff", value: "$212M" },
  { name: "Nuclear Mantis", rarity: "Legendary", color: "#ffb02e", value: "$96.4M" },
  { name: "Dreadstinger", rarity: "Epic", color: "#b65cff", value: "$41.8M" },
  { name: "Crocodon", rarity: "Rare", color: "#3d8bff", value: "$12.3M" },
  { name: "Sabertooth", rarity: "Uncommon", color: "#4fd35a", value: "$3.07M" },
  { name: "Frog", rarity: "Common", color: "#b9b9b9", value: "$482k" },
];

function mix(a: string, b: string, t: number) {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `rgb(${[0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t)).join(",")})`;
}

function EggList() {
  const [queued, setQueued] = useState<string[]>([]);
  const toggle = (name: string) => setQueued((q) => (q.includes(name) ? q.filter((n) => n !== name) : [...q, name]));
  return (
    <div className="h-[320px] overflow-hidden rounded-2xl border-[3px] p-1.5" style={{ background: T.background, borderColor: T.outline }}>
      <div className="flex h-full flex-col gap-3 overflow-y-auto pr-[9px] [scrollbar-color:#f0f0f0_transparent] [scrollbar-width:thin]">
        {EGGS.map((e) => {
          const on = queued.includes(e.name);
          const green = "#4bdc69";
          return (
            <button
              key={e.name}
              type="button"
              onClick={() => toggle(e.name)}
              className="relative h-[92px] w-full shrink-0 rounded-[18px] border-[3px] text-left"
              style={{
                borderColor: on ? green : mix(e.color, T.outline, 0.35),
                background: `linear-gradient(180deg, ${mix(T.main, T.accent, 0.16)}, ${T.main})`,
              }}
            >
              <span className="absolute left-[3px] top-[12px] h-[calc(100%-24px)] w-[6px] rounded-[3px]" style={{ background: e.color }} />
              <span
                className="absolute left-[17px] top-[9px] flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] text-[22px]"
                style={{ background: mix("#000000", e.color, 0.22), borderColor: e.color }}
              >
                {e.name[0]}
              </span>
              <span className="absolute left-[95px] right-[12px] top-[5px] truncate text-[19px] leading-[26px]">{e.name}</span>
              <span className="absolute left-[95px] right-[12px] top-[31px] truncate text-[14px] leading-[18px]" style={{ color: mix(e.color, "#ffffff", 0.3) }}>{e.rarity}</span>
              <span className="absolute left-[95px] top-[55px] truncate text-[15px] leading-[22px]" style={{ color: "#5bdc6c" }}>{e.value}/s</span>
              <span
                className="absolute right-[7px] top-[54px] flex h-6 w-[86px] items-center justify-center rounded-xl border-2 text-[12px]"
                style={{ background: on ? green : T.accent, borderColor: T.background, color: T.background }}
              >
                {on ? "QUEUED" : "SELECT"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Items({ items, q }: { items: Item[]; q: string }) {
  const { vals } = useStore();
  return (
    <>
      {items.map((it, i) => {
        if (q && !itemMatches(it, q)) return null;
        switch (it.t) {
          case "toggle": return <ToggleRow key={it.id} item={it} />;
          case "slider": return <SliderRow key={it.id} item={it} />;
          case "dropdown": return <DropdownRow key={it.id} item={it} />;
          case "input": return <InputRow key={it.id} item={it} />;
          case "color":
            return (
              <div key={it.id} className="flex h-5 items-center justify-between text-[14px]">
                <span>{it.label}</span>
                <Swatch initial={it.def} />
              </div>
            );
          case "button": return <ButtonRow key={`${it.label}-${i}`} label={it.label} />;
          case "label":
            return <p key={i} className="whitespace-pre-line text-[14px] leading-[15px]" style={{ color: T.font }}>{it.text}</p>;
          case "divider": return <div key={i} className="h-px w-full" style={{ background: T.outline }} />;
          case "eggs": return <EggList key={i} />;
          case "viewport":
            return <div key={i} className="h-[190px] rounded-[5px] border" style={{ background: "#050505", borderColor: T.outline }} />;
          case "dep":
            return vals[it.on] === it.equals ? <Items key={`${it.on}-${i}`} items={it.items} q={q} /> : null;
        }
      })}
    </>
  );
}

function GroupBox({ group }: { group: Group }) {
  const { query } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState(0);
  const tabbed = "tabs" in group;

  const titleHit = !!query && group.title.toLowerCase().includes(query);
  const q = titleHit ? "" : query;
  const activeTab = tabbed
    ? (() => {
        const t = group.tabs[tab];
        return !q || t.items.some((i) => itemMatches(i, q)) ? tab : Math.max(0, group.tabs.findIndex((x) => x.items.some((i) => itemMatches(i, q))));
      })()
    : 0;

  return (
    <div className="py-1">
      <section className="overflow-hidden rounded-[10px] border" style={{ background: T.background, borderColor: T.outline, boxShadow: "0 0 0 1.5px #000" }}>
        {tabbed ? (
          <>
            <div className="flex h-[34px]">
              {group.tabs.map((t, i) => {
                const sel = i === activeTab;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setTab(i)}
                    className="relative flex-1 text-[15px] transition-colors"
                    style={{
                      background: sel ? "transparent" : T.main, color: T.font,
                      borderTopLeftRadius: i === 0 ? 10 : 0, borderTopRightRadius: i === group.tabs.length - 1 ? 10 : 0,
                    }}
                  >
                    <span style={{ opacity: sel ? 1 : 0.5 }}>{t.name}</span>
                    {!sel && <span className="absolute inset-x-0 bottom-0 h-px" style={{ background: T.outline }} />}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 p-[7px]">
              <Items items={group.tabs[activeTab].items} q={q} />
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setCollapsed((c) => !c)} className="flex w-full items-center p-1.5 text-left">
              <group.icon size={22} style={{ color: T.accent }} className="shrink-0" />
              <span className="flex-1 truncate py-[3px] pl-[12px] pr-1.5 text-[15px]" style={{ color: T.font }}>{group.title}</span>
              {collapsed ? <ChevronDown size={22} style={{ color: T.font }} /> : <ChevronUp size={22} style={{ color: T.font }} />}
            </button>
            {!collapsed && (
              <>
                <div className="h-px" style={{ background: T.outline }} />
                <div className="flex flex-col gap-2 p-[7px]">
                  <Items items={group.items} q={q} />
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Window: 720x600, icon-only sidebar (76px), 48px top bar, 20px footer */
/* ------------------------------------------------------------------ */

function TabButton({ tab, active, onClick }: { tab: Tab; active: boolean; onClick: () => void }) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      title={tab.name}
      aria-label={tab.name}
      onClick={onClick}
      className="relative flex h-12 w-full shrink-0 items-center justify-center rounded-[10px] transition-colors"
      style={{ background: active ? T.main : "transparent" }}
    >
      <span
        className="absolute left-0.5 top-1/2 h-[30px] w-[3px] -translate-y-1/2 rounded-full transition-opacity"
        style={{ background: T.accentGradient, opacity: active ? 1 : 0 }}
      />
      <Icon size={22} style={{ color: T.accent, opacity: active ? 1 : 0.5 }} className="transition-opacity" />
    </button>
  );
}

/** The in-game window. Used by the homepage demo and by the JSON-driven script previews. */
export function MenuWindow({ tabs: TABS, footerText }: { tabs: Tab[]; footerText: string }) {
  const [vals, setVals] = useState<Record<string, Value>>(() => defaults(TABS));
  const [tabName, setTabName] = useState(TABS[0].name);
  const [pageName, setPageName] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);

  const set = useCallback((id: string, v: Value) => setVals((p) => ({ ...p, [id]: v })), []);
  const q = query.trim().toLowerCase();
  const store = useMemo(() => ({ vals, set, query: q }), [vals, set, q]);

  // Global search: jump to the first tab / sub-tab that still has a match.
  let tab = TABS.find((t) => t.name === tabName) ?? TABS[0];
  if (q && !tabMatches(tab, q)) tab = TABS.find((t) => tabMatches(t, q)) ?? tab;
  const wanted = tab.pages.find((p) => p.name === pageName[tab.name]) ?? tab.pages[0];
  const page = q && !pageMatches(wanted, q) ? tab.pages.find((p) => pageMatches(p, q)) ?? wanted : wanted;
  const visiblePages = q ? tab.pages.filter((p) => pageMatches(p, q)) : tab.pages;

  const main = TABS.filter((t) => !t.pinned);
  const pinned = TABS.filter((t) => t.pinned);
  const select = (t: Tab) => { setTabName(t.name); setQuery(""); };

  return (
    <StoreCtx.Provider value={store}>
      <div
        className="relative flex h-[600px] w-full max-w-[720px] flex-col overflow-hidden rounded-[10px] border text-[14px]"
        style={{ background: T.background, borderColor: T.outline, color: T.font, fontFamily: FONT, boxShadow: "0 0 0 1.5px #000, 0 25px 60px rgba(0,0,0,.7)" }}
      >
        <div className="relative flex min-h-0 flex-1">
          {/* Sidebar */}
          <aside className="flex w-[76px] shrink-0 flex-col border-r" style={{ background: T.background, borderColor: T.outline }}>
            <div className="flex h-[62px] shrink-0 items-center justify-center">
              <img
                src={lucidLogo}
                alt="Lucid: REWRITE"
                className="h-[54px] w-[54px] object-contain"
                style={{ filter: "invert(1)" }}
                draggable={false}
              />
            </div>
            <div className="mx-2 h-px shrink-0" style={{ background: T.outline }} />
            <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {main.map((t) => <TabButton key={t.name} tab={t} active={t === tab} onClick={() => select(t)} />)}
            </nav>
            {pinned.length > 0 && (
              <>
                <div className="mx-2 h-px shrink-0" style={{ background: T.outline }} />
                <div className="flex shrink-0 flex-col gap-0.5 px-2 pb-2 pt-3">
                  {pinned.map((t) => <TabButton key={t.name} tab={t} active={t === tab} onClick={() => select(t)} />)}
                </div>
              </>
            )}
          </aside>

          {/* Right side */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-12 shrink-0 items-center gap-2 px-2">
              <div className="flex h-full min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {visiblePages.map((p) => {
                  const sel = p === page;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setPageName((s) => ({ ...s, [tab.name]: p.name }))}
                      className="relative h-full shrink-0 rounded-[5px] px-3 text-[14px] transition-colors"
                      style={{ background: sel ? "rgba(14,14,14,0.2)" : "transparent", color: sel ? T.accent : T.font }}
                    >
                      {p.name}
                      {sel && <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: T.accent }} />}
                    </button>
                  );
                })}
              </div>
              <label
                className="relative flex h-8 shrink-0 items-center rounded-[10px] border pl-8 pr-2 transition-colors"
                style={{ background: T.main, borderColor: searchFocus ? T.accent : T.outline, width: "40%", minWidth: 110 }}
              >
                <Search size={16} className="absolute left-2" style={{ opacity: 0.5 }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocus(true)}
                  onBlur={() => setSearchFocus(false)}
                  placeholder="Search"
                  className="w-full bg-transparent text-[14px] outline-none placeholder:text-white/40"
                  style={{ color: T.font, fontFamily: "inherit" }}
                />
              </label>
            </div>
            <div className="h-px shrink-0" style={{ background: T.outline }} />

            <div className="min-h-0 flex-1 overflow-y-auto px-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ background: T.container }}>
              <div className="grid grid-cols-1 gap-x-1.5 p-0.5 min-[600px]:grid-cols-2">
                <div className="flex min-w-0 flex-col">{page.left.map((g) => (!q || groupMatches(g, q)) && <GroupBox key={g.title} group={g} />)}</div>
                <div className="flex min-w-0 flex-col">{page.right.map((g) => (!q || groupMatches(g, q)) && <GroupBox key={g.title} group={g} />)}</div>
              </div>
            </div>
          </div>
        </div>

        <footer className="relative flex h-5 shrink-0 items-center justify-center border-t text-[14px]" style={{ background: T.footer, borderColor: T.outline }}>
          <span className="truncate px-6" style={{ opacity: 0.5 }}>{footerText}</span>
          <svg className="absolute bottom-[3px] right-1.5 opacity-50" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v6h-6M21 21l-7-7" />
          </svg>
        </footer>
      </div>
    </StoreCtx.Provider>
  );
}

export function InteractiveMenu() {
  return <MenuWindow tabs={TABS} footerText="Lucid: REWRITE | Steal An Egg | 42 ms | 60 FPS" />;
}

export default InteractiveMenu;
