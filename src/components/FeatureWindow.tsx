import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Eye, Layers, Search, Sprout, Swords, Wind, Wrench, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import lucidLogo from "@/assets/lucid-logo-new.png";
import { FONT, T } from "./InteractiveMenu";

/**
 * Script feature browser drawn with the same window as the in-game UI library (black / #0e0e0e / #2e2e2e,
 * icon sidebar, group boxes with checkbox rows). Switching tabs plays the library's animation: the page
 * swipes up from the bottom, the boxes rise in one after another and the tab icon pops.
 */

export type Category = "Combat" | "Farming" | "Movement" | "Visuals" | "Utility";

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Combat: Swords,
  Farming: Sprout,
  Movement: Wind,
  Visuals: Eye,
  Utility: Wrench,
};

const CATEGORIES = Object.keys(CATEGORY_ICONS) as Category[];

/** Sort a feature name into a category by keyword. */
function categorize(name: string): Category {
  const n = name.toLowerCase();
  if (/\besp\b|fullbright|fog|fov changer|freecam|no animations|theme/.test(n)) return "Visuals";
  if (/fly|speed|jump|clip|teleport|server hop/.test(n)) return "Movement";
  if (/aim|fov circle|hitbox|parry|stun|ragdoll|slowdown|silent|flash|nanami|gamma|kokushibo|toji|tengen|macro|block|counter|attach|combo|camera lock|visibility check|team check|death|infinite mode/.test(n)) return "Combat";
  if (/auto|farm|quest|loot|chest|collect|stat|sniper|build|despawn|void|prestige/.test(n)) return "Farming";
  return "Utility";
}

type TabId = "All" | Category;
type Group = { title: string; icon: LucideIcon; features: string[] };

const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
const CHUNK = 9;

function buildGroups(tab: TabId, byCat: Record<Category, string[]>): Group[] {
  if (tab === "All") {
    return CATEGORIES.filter((c) => byCat[c].length).map((c) => ({ title: c, icon: CATEGORY_ICONS[c], features: byCat[c] }));
  }
  const list = byCat[tab];
  const out: Group[] = [];
  for (let i = 0; i < list.length; i += CHUNK) {
    out.push({ title: i === 0 ? tab : `${tab} ${i / CHUNK + 1}`, icon: CATEGORY_ICONS[tab], features: list.slice(i, i + CHUNK) });
  }
  return out;
}

/** Deal groups into two columns, always giving the next one to the shorter column. */
function toColumns(groups: Group[]): Group[][] {
  const cols: Group[][] = [[], []];
  const h = [0, 0];
  groups.forEach((g) => {
    const c = h[0] <= h[1] ? 0 : 1;
    cols[c].push(g);
    h[c] += g.features.length + 2;
  });
  return cols;
}

function CheckRow({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className="group relative flex h-5 w-full items-center text-left">
      <span className="flex-1 truncate pr-2 text-[14px] transition-opacity" style={{ opacity: on ? 1 : 0.6, color: T.font }}>
        {label}
      </span>
      <span
        className="absolute right-0 top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-[3px] border transition-transform duration-150 group-hover:translate-x-[3px] group-hover:scale-[1.1667]"
        style={{ background: T.main, borderColor: T.outline }}
      >
        <span
          className="absolute inset-0 flex items-center justify-center rounded-[3px] transition-all duration-150"
          style={{ background: T.accentGradient, opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(0)" }}
        >
          <Check size={11} strokeWidth={3} style={{ color: "#ffffff", opacity: 0.9 }} />
        </span>
      </span>
    </button>
  );
}

function GroupBox({ group, enabled, flip, index }: { group: Group; enabled: Set<string>; flip: (f: string) => void; index: number }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <motion.div
      className="py-1"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT_QUINT, delay: Math.min(index, 8) * 0.07 }}
    >
      <section className="overflow-hidden rounded-[10px] border" style={{ background: T.background, borderColor: T.outline, boxShadow: "0 0 0 1.5px #000" }}>
        <button type="button" onClick={() => setCollapsed((c) => !c)} className="flex w-full items-center p-1.5 text-left">
          <group.icon size={22} style={{ color: T.accent }} className="shrink-0" />
          <span className="flex-1 truncate py-[3px] pl-[12px] pr-1.5 text-[15px]" style={{ color: T.font }}>{group.title}</span>
          {collapsed ? <ChevronDown size={22} style={{ color: T.font }} /> : <ChevronUp size={22} style={{ color: T.font }} />}
        </button>
        {!collapsed && (
          <>
            <div className="h-px" style={{ background: T.outline }} />
            <div className="flex flex-col gap-2 p-[7px]">
              {group.features.map((f) => (
                <CheckRow key={f} label={f} on={enabled.has(f)} onClick={() => flip(f)} />
              ))}
            </div>
          </>
        )}
      </section>
    </motion.div>
  );
}

function TabButton({ icon: Icon, label, count, active, onClick }: { icon: LucideIcon; label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={`${label} (${count})`}
      aria-label={label}
      onClick={onClick}
      className="relative flex h-12 w-full shrink-0 items-center justify-center rounded-[10px] transition-colors"
      style={{ background: active ? T.main : "transparent" }}
    >
      <span
        className="absolute left-0.5 top-1/2 h-[30px] w-[3px] -translate-y-1/2 rounded-full transition-opacity"
        style={{ background: T.accentGradient, opacity: active ? 1 : 0 }}
      />
      {/* icon pop: scale .55 / rotate -24 -> 1 / 0 (Library:PlayIconPop) */}
      <motion.span
        key={active ? "on" : "off"}
        initial={active ? { scale: 0.55, rotate: -24 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 16 }}
        className="flex"
      >
        <Icon size={22} style={{ color: T.accent, opacity: active ? 1 : 0.5 }} className="transition-opacity" />
      </motion.span>
    </button>
  );
}

export function FeatureWindow({ name, features, onClose }: { name: string; features: string[]; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("All");
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState(false);
  const [enabled, setEnabled] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const byCat = useMemo(() => {
    const out: Record<Category, string[]> = { Combat: [], Farming: [], Movement: [], Visuals: [], Utility: [] };
    features.forEach((f) => out[categorize(f)].push(f));
    return out;
  }, [features]);

  // Searching works across everything, like Library:UpdateSearch.
  const filtered = useMemo(() => {
    if (!q) return byCat;
    const out = { ...byCat };
    CATEGORIES.forEach((c) => (out[c] = byCat[c].filter((f) => f.toLowerCase().includes(q))));
    return out;
  }, [byCat, q]);

  const activeTab: TabId = q ? "All" : tab;
  const groups = useMemo(() => buildGroups(activeTab, filtered), [activeTab, filtered]);
  const cols = useMemo(() => toColumns(groups), [groups]);

  const flip = (f: string) =>
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });

  const tabs: { id: TabId; icon: LucideIcon; count: number }[] = [
    { id: "All", icon: Layers, count: features.length },
    ...CATEGORIES.filter((c) => byCat[c].length).map((c) => ({ id: c as TabId, icon: CATEGORY_ICONS[c], count: byCat[c].length })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 30 }}
        transition={{ duration: 0.3, ease: EASE_OUT_QUINT }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[600px] max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[10px] border text-[14px]"
        style={{ background: T.background, borderColor: T.outline, color: T.font, fontFamily: FONT, boxShadow: "0 0 0 1.5px #000, 0 25px 60px rgba(0,0,0,.7)" }}
      >
        <div className="relative flex min-h-0 flex-1">
          {/* Sidebar */}
          <aside className="flex w-[76px] shrink-0 flex-col border-r" style={{ background: T.background, borderColor: T.outline }}>
            <div className="flex h-[62px] shrink-0 items-center justify-center">
              <img src={lucidLogo} alt="Lucid" className="h-[54px] w-[54px] object-contain" style={{ filter: "invert(1)" }} draggable={false} />
            </div>
            <div className="mx-2 h-px shrink-0" style={{ background: T.outline }} />
            <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tabs.map((t) => (
                <TabButton
                  key={t.id}
                  icon={t.icon}
                  label={t.id}
                  count={t.count}
                  active={t.id === activeTab}
                  onClick={() => { setQuery(""); setTab(t.id); }}
                />
              ))}
            </nav>
          </aside>

          {/* Right side */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-12 shrink-0 items-center gap-2 px-2">
              <div className="flex h-full min-w-0 flex-1 items-center py-2">
                <span className="relative h-full shrink-0 truncate rounded-[5px] px-3 text-[14px] leading-8" style={{ background: "rgba(14,14,14,0.2)", color: T.accent }}>
                  {activeTab === "All" ? name : `${name} · ${activeTab}`}
                  <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: T.accent }} />
                </span>
              </div>
              <label
                className="relative flex h-8 shrink-0 items-center rounded-[10px] border pl-8 pr-2 transition-colors"
                style={{ background: T.main, borderColor: focus ? T.accent : T.outline, width: "40%", minWidth: 110 }}
              >
                <Search size={16} className="absolute left-2" style={{ opacity: 0.5 }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocus(true)}
                  onBlur={() => setFocus(false)}
                  placeholder="Search"
                  className="w-full bg-transparent text-[14px] outline-none placeholder:text-white/40"
                  style={{ color: T.font, fontFamily: "inherit" }}
                />
              </label>
              <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border opacity-60 transition-opacity hover:opacity-100" style={{ background: T.main, borderColor: T.outline }}>
                <X size={16} />
              </button>
            </div>
            <div className="h-px shrink-0" style={{ background: T.outline }} />

            {/* Page: swipes up from the bottom whenever the tab changes (Library TabSwipeFrom = bottom) */}
            <div className="min-h-0 flex-1 overflow-y-auto px-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ background: T.container }}>
              <motion.div
                key={q ? "search" : activeTab}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE_OUT_QUINT }}
                className="grid grid-cols-1 gap-x-1.5 p-0.5 min-[600px]:grid-cols-2"
              >
                {groups.length === 0 ? (
                  <p className="col-span-full py-16 text-center opacity-50">Nothing matches your search.</p>
                ) : (
                  cols.map((col, ci) => (
                    <div key={ci} className="flex min-w-0 flex-col">
                      {col.map((g) => (
                        <GroupBox key={g.title} group={g} enabled={enabled} flip={flip} index={groups.indexOf(g)} />
                      ))}
                    </div>
                  ))
                )}
              </motion.div>
            </div>
          </div>
        </div>

        <footer className="relative flex h-5 shrink-0 items-center justify-center border-t text-[14px]" style={{ background: T.footer, borderColor: T.outline }}>
          <span className="truncate px-6" style={{ opacity: 0.5 }}>
            Lucid: REWRITE | {name} | {features.length} features | {enabled.size} on
          </span>
        </footer>
      </motion.div>
    </motion.div>
  );
}
