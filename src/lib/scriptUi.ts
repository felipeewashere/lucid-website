import type { Item, Value } from "@/components/InteractiveMenu";

/**
 * JSON structure for a script's menu, pasted in Admin > Scripts. Full reference: website/SCRIPT-UI-JSON.md.
 * It mirrors the in-game library (and the homepage demo): tabs -> pages (top sub tabs) -> groups (left/right) -> items.
 * Icons stay as lucide names (strings) here; ScriptUiWindow resolves them.
 */

export type ParsedGroup =
  | { title: string; icon: string; items: Item[] }
  | { title: string; tabs: { name: string; items: Item[] }[] };
export type ParsedPage = { name: string; left: ParsedGroup[]; right: ParsedGroup[] };
export type ParsedTab = { name: string; icon: string; pinned?: boolean; pages: ParsedPage[] };
export type ParsedUi = { game?: string; tabs: ParsedTab[] };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => typeof v === "string" && v.trim() !== "";
const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);

type Ctx = { errors: string[]; ids: Set<string> };

function fail(ctx: Ctx, path: string, msg: string) {
  if (ctx.errors.length < 12) ctx.errors.push(`${path}: ${msg}`);
}

function parseItems(raw: unknown, path: string, ctx: Ctx): Item[] {
  if (!Array.isArray(raw)) { fail(ctx, path, "must be an array"); return []; }
  const out: Item[] = [];
  raw.forEach((r, i) => {
    const p = `${path}[${i}]`;
    if (!isObj(r)) return fail(ctx, p, "must be an object");
    const t = r.t;
    const needId = () => {
      if (!str(r.id)) { fail(ctx, p, `"${String(t)}" needs a string "id"`); return false; }
      if (ctx.ids.has(r.id as string)) { fail(ctx, p, `duplicate id "${r.id}"`); return false; }
      ctx.ids.add(r.id as string);
      return true;
    };
    switch (t) {
      case "toggle":
        if (!needId() || !str(r.label)) return fail(ctx, p, `toggle needs "id" and "label"`);
        out.push({
          t, id: r.id as string, label: r.label as string, def: r.def === true,
          key: str(r.key) ? (r.key as string) : undefined, color: str(r.color) ? (r.color as string) : undefined,
          items: Array.isArray(r.items) ? parseItems(r.items, `${p}.items`, ctx) : undefined,
        });
        break;
      case "slider":
        if (!needId() || !str(r.label) || !num(r.min) || !num(r.max) || (r.max as number) <= (r.min as number)) return fail(ctx, p, `slider needs "id", "label", "min" < "max"`);
        out.push({
          t, id: r.id as string, label: r.label as string, min: r.min as number, max: r.max as number,
          def: num(r.def) ? Math.min(r.max as number, Math.max(r.min as number, r.def as number)) : (r.min as number),
          dec: num(r.dec) ? (r.dec as number) : undefined, suffix: typeof r.suffix === "string" ? r.suffix : undefined,
        });
        break;
      case "dropdown": {
        if (!needId() || !str(r.label) || !Array.isArray(r.values)) return fail(ctx, p, `dropdown needs "id", "label", "values" (array)`);
        const values = r.values.map(String);
        const multi = r.multi === true;
        const def = multi
          ? (Array.isArray(r.def) ? r.def.map(String) : [])
          : typeof r.def === "string" ? r.def : values[0] ?? "";
        out.push({ t, id: r.id as string, label: r.label as string, values, def, multi });
        break;
      }
      case "input":
        if (!needId() || !str(r.label)) return fail(ctx, p, `input needs "id" and "label"`);
        out.push({ t, id: r.id as string, label: r.label as string, def: typeof r.def === "string" ? r.def : "", ph: typeof r.ph === "string" ? r.ph : undefined });
        break;
      case "color":
        if (!needId() || !str(r.label)) return fail(ctx, p, `color needs "id" and "label"`);
        out.push({ t, id: r.id as string, label: r.label as string, def: /^#[0-9a-f]{6}$/i.test(String(r.def)) ? (r.def as string) : "#ffffff" });
        break;
      case "button":
        if (!str(r.label)) return fail(ctx, p, `button needs "label"`);
        out.push({ t, label: r.label as string });
        break;
      case "label":
        if (typeof r.text !== "string") return fail(ctx, p, `label needs "text"`);
        out.push({ t, text: r.text });
        break;
      case "divider":
        out.push({ t });
        break;
      case "viewport":
        out.push({ t });
        break;
      case "dep":
        if (!str(r.on)) return fail(ctx, p, `dep needs "on" (the id it depends on)`);
        out.push({ t, on: r.on as string, equals: (r.equals ?? true) as Value, items: parseItems(r.items, `${p}.items`, ctx) });
        break;
      default:
        fail(ctx, p, `unknown "t": ${JSON.stringify(t)} (use toggle, slider, dropdown, input, color, button, label, divider, viewport, dep)`);
    }
  });
  return out;
}

function parseGroups(raw: unknown, path: string, ctx: Ctx): ParsedGroup[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) { fail(ctx, path, "must be an array of groups"); return []; }
  const out: ParsedGroup[] = [];
  raw.forEach((r, i) => {
    const p = `${path}[${i}]`;
    if (!isObj(r) || !str(r.title)) return fail(ctx, p, `group needs a "title"`);
    if (Array.isArray(r.tabs)) {
      const tabs = r.tabs.map((t, ti) => {
        const tp = `${p}.tabs[${ti}]`;
        if (!isObj(t) || !str(t.name)) { fail(ctx, tp, `needs a "name"`); return { name: "?", items: [] as Item[] }; }
        return { name: t.name as string, items: parseItems(t.items, `${tp}.items`, ctx) };
      });
      if (tabs.length === 0) return fail(ctx, p, `"tabs" must not be empty`);
      out.push({ title: r.title as string, tabs });
    } else {
      out.push({ title: r.title as string, icon: str(r.icon) ? (r.icon as string) : "Layers", items: parseItems(r.items, `${p}.items`, ctx) });
    }
  });
  return out;
}

/** Validates and fills defaults. Group icons are kept as lucide names (strings) until the window resolves them. */
export function parseScriptUi(input: unknown): { ui: ParsedUi | null; errors: string[] } {
  const ctx: Ctx = { errors: [], ids: new Set() };
  if (!isObj(input) || !Array.isArray(input.tabs) || input.tabs.length === 0) {
    return { ui: null, errors: [`root: must be an object with a non-empty "tabs" array`] };
  }
  const tabs: ParsedTab[] = [];
  input.tabs.forEach((t, i) => {
    const p = `tabs[${i}]`;
    if (!isObj(t) || !str(t.name)) return fail(ctx, p, `tab needs a "name"`);
    let pages: ParsedPage[];
    if (Array.isArray(t.pages)) {
      pages = t.pages.map((pg, pi) => {
        const pp = `${p}.pages[${pi}]`;
        if (!isObj(pg) || !str(pg.name)) { fail(ctx, pp, `page needs a "name"`); return { name: "?", left: [], right: [] }; }
        return { name: pg.name as string, left: parseGroups(pg.left, `${pp}.left`, ctx), right: parseGroups(pg.right, `${pp}.right`, ctx) };
      });
      if (pages.length === 0) return fail(ctx, p, `"pages" must not be empty`);
    } else {
      // Shorthand: a tab with no sub tabs can put left/right straight on the tab.
      pages = [{ name: t.name as string, left: parseGroups(t.left, `${p}.left`, ctx), right: parseGroups(t.right, `${p}.right`, ctx) }];
    }
    tabs.push({ name: t.name as string, icon: str(t.icon) ? (t.icon as string) : "Layers", pinned: t.pinned === true, pages });
  });
  if (ctx.errors.length) return { ui: null, errors: ctx.errors };
  return { errors: [], ui: { game: str(input.game) ? (input.game as string) : undefined, tabs } };
}

/** Labels of every control, used for the script's feature count. */
export function featureLabels(ui: ParsedUi): string[] {
  const out: string[] = [];
  const walk = (items: Item[]) => {
    for (const it of items) {
      if ("label" in it) out.push(it.label);
      if ("items" in it && it.items) walk(it.items);
    }
  };
  for (const tab of ui.tabs)
    for (const page of tab.pages)
      for (const g of [...page.left, ...page.right]) {
        if ("tabs" in g) g.tabs.forEach((t) => walk(t.items));
        else walk(g.items);
      }
  return out;
}
