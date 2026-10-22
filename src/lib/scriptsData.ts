import { LOADER_URL } from "@/lib/loader";

export type ConfigType = "boolean" | "string" | "multiselect" | "dropdown" | "stringlist";

export interface ConfigItem {
  id: string;
  name: string;
  type: ConfigType;
  default: any;
  options?: string[];
  tooltip?: string;
  group?: string;
  /** If set, this item is only shown when the config key named here is truthy */
  showWhen?: string;
}

export interface Script {
  name: string;
  loader: string;
  config: ConfigItem[];
}

export interface Game {
  id: string;
  name: string;
  icon: string;
  scripts: Script[];
}

export const GAMES_DATA: Game[] = [
  {
    id: "bizarre-lineage",
    name: "Bizarre Lineage",
    icon: "https://tr.rbxcdn.com/180DAY-9f127cd188aabcd29d3213b7167aeaca/150/150/Image/Webp/noFilter",
    scripts: [
      {
        name: "Auto Raid",
        loader:
          LOADER_URL,
        config: [
          {
            id: "AutoEquipStand",
            name: "Auto Equip Stand",
            type: "boolean",
            default: true,
            group: "Auto Equip",
            tooltip:
              "Automatically equips your Stand at the start of each raid.",
          },
          {
            id: "AutoAbilities",
            name: "Auto Abilities",
            type: "multiselect",
            options: ["E", "R", "Z", "C", "X", "V"],
            default: ["R"],
            group: "Auto Abilities",
            tooltip:
              "Select which ability keys to use automatically during raids (multiple allowed).",
          },
          {
            id: "AutoReplayRaid",
            name: "Auto Replay Raid",
            type: "boolean",
            default: true,
            group: "Automation",
            tooltip: "Automatically rejoins the raid lobby after each run.",
          },
          {
            id: "WebhookURL",
            name: "Webhook URL",
            type: "string",
            default: "",
            group: "Automation",
            tooltip:
              "Discord webhook URL for raid notifications (optional). Leave empty to disable.",
          },
          {
            id: "AutoDeleteEnabled",
            name: "Auto Delete Enabled",
            type: "boolean",
            default: true,
            group: "Auto Delete",
            tooltip:
              "Enable automatic deletion of unwanted chest drops after each raid.",
          },
          {
            id: "AutoDelete",
            name: "Chest Types to Delete",
            type: "multiselect",
            options: ["Common Chest", "Uncommon Chest", "Rare Chest"],
            default: ["Common Chest"],
            group: "Auto Delete",
            showWhen: "AutoDeleteEnabled",
            tooltip:
              "Select which chest rarities to automatically delete. Only active when Auto Delete is enabled.",
          },
          {
            id: "RaidType",
            name: "Raid Type",
            type: "dropdown",
            options: ["Chumbo", "???", "Yoshikage Kira", "Muhammad Avdol"],
            default: ["Chumbo"],
            group: "Raid Config",
            tooltip: "The type(s) of raid boss to target during auto-farming (multiple allowed).",
          },
          {
            id: "AutoOpenChests",
            name: "Auto Open Chests",
            type: "multiselect",
            options: ["Uncommon", "Rare", "Legendary"],
            default: ["Uncommon", "Rare", "Legendary"],
            group: "Raid Config",
            tooltip:
              "Automatically opens chests of the selected rarities after raids.",
          },

          {
            id: "GrabMove",
            name: "Void Ability",
            type: "dropdown",
            options: ["E", "R", "Z", "C", "X", "V"],
            default: [],
            group: "Auto Abilities",
            tooltip:
              "Choose Void Ability",
          },
        ],
      },
    ],
  },

  {
    id: "aba",
    name: "ABA",
    icon: "https://tr.rbxcdn.com/180DAY-521891218211d94c5279f61af26242d4/150/150/Image/Webp/noFilter",
        scripts: [
      {
        name: "Auto Gold Skin",
        loader:
          LOADER_URL,
        config: [
          {
            id: "AltTable",
            name: "Alt Table",
            type: "stringlist",
            default: ["main", "alt"],
            group: "Main Config",
            tooltip: "Add your main and alt account usernames (not display names).",
          },
          {
            id: "lockon",
            name: "Lock on",
            type: "boolean",
            default: true,
            group: "Main Config",
            tooltip: "Automatically lockon to your alt.",
          },
          {
            id: "noclip",
            name: "NoClip",
            type: "boolean",
            default: true,
            group: "Main Config",
            tooltip: "Enable noclip to prevent bugging.",
          },
          {
            id: "spam1234",
            name: "Spam Moves",
            type: "boolean",
            default: true,
            group: "Combat Settings",
            tooltip: "Spam your moves automatically.",
          },
          {
            id: "keys",
            name: "Moves to Use",
            type: "multiselect",
            options: ["One", "Two", "Three", "Four"],
            default: ["One", "Two", "Three", "Four"],
            group: "Combat Settings",
            tooltip: "Select which move keys to use automatically.",
          },
          {
            id: "Webhook",
            name: "Webhook URL",
            type: "string",
            default: "",
            group: "Automation",
            tooltip: "Discord webhook URL for notifications.",
          },
          {
            id: "CHARACTERS",
            name: "Next Characters",
            type: "stringlist",
            default: ["Ichigo", "Nanami"],
            group: "Automation",
            tooltip: "Choose your next characters (Case Sensitive).",
          },
        ],
      },
      {
        name: "Auto Get Any Skin",
        loader: LOADER_URL,
        config: [
          {
            id: "WEBHOOK",
            name: "Webhook URL",
            type: "string",
            default: "",
            group: "Automation",
            tooltip: "Discord webhook for skin roll notifications.",
          },
          {
            id: "SKINSINFO_CHARACTER",
            name: "Target Character",
            type: "string",
            default: "Satoru Gojo",
            group: "Skin Config",
            tooltip: "The character to roll skins for (Case Sensitive).",
          },
          {
            id: "SKINSINFO_TYPE",
            name: "Skin Quality",
            type: "dropdown",
            options: ["1", "2", "3", "Legendary1", "Legendary1xRainbow"],
            default: "Legendary1",
            group: "Skin Config",
            tooltip: "The target skin rarity/type.",
          },
          {
            id: "ROLLTYPE",
            name: "Roll Method",
            type: "dropdown",
            options: [
              "10rands",
              "1uniq",
              "10unique",
              "legendary_unique",
              "10legendary",
              "legendary"
            ],
            default: "10rands",
            group: "Roll Config",
            tooltip: "Method used to roll for skins.",
          },
        ],
      },
    ],
  },
];
