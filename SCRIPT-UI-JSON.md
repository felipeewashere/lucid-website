# Script UI JSON

Paste this JSON in **Admin > Scripts > UI JSON**. The website draws it in the same window as the in-game library
(sidebar icon tabs, sub tabs on top, left/right group boxes). Players see it under "VIEW FEATURES".
The script's feature count is the number of controls (toggles, sliders, dropdowns, inputs, colors, buttons).

**When asked for a script's UI JSON, output exactly this structure, nothing else (one JSON object, no comments).**
Mirror the real Lua UI: same tabs, sub tabs, group boxes, element order and labels.

## Structure

```
{ "game": "Game name",
  "tabs": [ Tab ] }

Tab    { "name": "Combat", "icon": "Swords", "pinned": false,
         "pages": [ Page ] }            // pages = the sub tabs shown along the top
       or the shorthand without sub tabs: "left": [Group], "right": [Group]
Page   { "name": "Main", "left": [Group], "right": [Group] }
Group  { "title": "Aimbot", "icon": "Crosshair", "items": [Item] }
       or a group with its own inner tabs:
       { "title": "Settings", "tabs": [ { "name": "General", "items": [Item] } ] }
```

- `icon` is any [lucide](https://lucide.dev/icons) icon name in PascalCase (`Swords`, `Crosshair`, `Eye`, `Settings`). Unknown names fall back to `Layers`.
- `pinned: true` puts the tab at the bottom of the sidebar (use for Settings / Config).
- Every control with an `id` needs a **unique** `id`.

## Items (`"t"`)

| t | fields |
|---|--------|
| `toggle` | `id`, `label`, `def` (bool), optional `key` (keybind text, e.g. `"E"`), optional `color` (hex swatch), optional `items` (shown only while on) |
| `slider` | `id`, `label`, `min`, `max`, `def`, optional `dec` (decimals), optional `suffix` (e.g. `"ms"`) |
| `dropdown` | `id`, `label`, `values` (string array), `def` (string, or array if `multi`), optional `multi` (bool) |
| `input` | `id`, `label`, `def` (string), optional `ph` (placeholder) |
| `color` | `id`, `label`, `def` (`"#rrggbb"`) |
| `button` | `label` |
| `label` | `text` |
| `divider` | none |
| `viewport` | none (empty preview box) |
| `dep` | `on` (an `id`), `equals` (value, default `true`), `items` (shown only while that control equals the value) |

## Example

```json
{
  "game": "Example Game",
  "tabs": [
    {
      "name": "Combat",
      "icon": "Swords",
      "pages": [
        {
          "name": "Main",
          "left": [
            {
              "title": "Aimbot",
              "icon": "Crosshair",
              "items": [
                { "t": "toggle", "id": "aim", "label": "Enabled", "def": false, "key": "E",
                  "items": [
                    { "t": "slider", "id": "fov", "label": "FOV", "min": 0, "max": 360, "def": 90, "suffix": "°" }
                  ] },
                { "t": "dropdown", "id": "part", "label": "Target part", "values": ["Head", "Torso"], "def": "Head" },
                { "t": "button", "label": "Reset" }
              ]
            }
          ],
          "right": [
            {
              "title": "Targets",
              "icon": "Users",
              "tabs": [
                { "name": "Players", "items": [ { "t": "toggle", "id": "team", "label": "Team check", "def": true } ] },
                { "name": "NPCs", "items": [ { "t": "toggle", "id": "npc", "label": "Include NPCs" } ] }
              ]
            }
          ]
        },
        { "name": "Extra", "left": [], "right": [] }
      ]
    },
    {
      "name": "Settings",
      "icon": "Settings",
      "pinned": true,
      "left": [
        { "title": "Menu", "icon": "Palette", "items": [ { "t": "color", "id": "accent", "label": "Accent", "def": "#ff8800" } ] }
      ],
      "right": []
    }
  ]
}
```
