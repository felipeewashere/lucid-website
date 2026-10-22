import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Search, ChevronDown, RefreshCw, Check, Minus, Globe, MessageCircle, ExternalLink, AlertTriangle, ShieldAlert, ShieldCheck, Cpu } from "lucide-react";

/**
 * Live data from the WEAO exploit tracker (whatexpsare.online). Grouping, ordering, price badge and
 * status badge below follow the logic of their own site so both lists always agree:
 *  - sections: platform x (executor | external), in WEAO's order, each sorted by `index` (missing = 999)
 *  - status: hasIssues -> "Issues", updateStatus -> "Updated", otherwise "Not Updated"
 *  - detection is only a warning inside the card, it never changes the status
 * Purchase links are deliberately not used anywhere.
 */
const API = "https://whatexpsare.online/api";

interface RawExecutor {
  _id: string;
  title: string;
  version: string;
  updatedDate: string;
  free?: boolean;
  keysystem?: boolean;
  detected?: boolean;
  updateStatus?: boolean;
  hasIssues?: boolean;
  unlinked?: boolean;
  hidden?: boolean;
  beta?: boolean;
  websitelink?: string;
  discordlink?: string;
  platform: string;
  extype?: string;
  cost?: string;
  decompiler?: boolean;
  multiInject?: boolean;
  raknet?: boolean;
  clientmods?: boolean;
  hypemu?: boolean;
  unknownDetection?: boolean;
  possibleBanwave?: boolean;
  suncPercentage?: number;
  uncPercentage?: number;
  sunc?: { suncScrap?: string; suncKey?: string };
  index?: number;
  rbxversion?: string;
  warning?: string;
  detectionReason?: string;
  slug?: { fullDescription?: string; logo?: string; owner?: string; screenshots?: string[] };
}

interface Executor extends RawExecutor {
  plat: "windows" | "mac" | "android" | "ios";
  kind: "executor" | "external";
  suncPct: number;
  order: number;
}

interface RbxVersions {
  Windows?: string; WindowsResponse?: { version?: string };
  Mac?: string; MacResponse?: { version?: string };
  Android?: string;
  iOS?: string;
}

const PLATFORMS = ["windows", "mac", "android", "ios"] as const;
const PLATFORM_LABEL: Record<string, string> = { windows: "Windows", mac: "Mac", android: "Android", ios: "iOS" };

const SECTION_ORDER: { plat: (typeof PLATFORMS)[number]; kind: "executor" | "external" }[] = [
  ...PLATFORMS.map((plat) => ({ plat, kind: "executor" as const })),
  ...PLATFORMS.map((plat) => ({ plat, kind: "external" as const })),
];

const EXTERNAL_TYPES = ["wexternal", "aexternal", "iexternal", "mexternal"];

function normalize(raw: RawExecutor): Executor {
  return {
    ...raw,
    plat: raw.platform.toLowerCase() as Executor["plat"],
    kind: EXTERNAL_TYPES.includes(raw.extype ?? "") ? "external" : "executor",
    suncPct: raw.sunc?.suncScrap && raw.sunc?.suncKey ? raw.suncPercentage || 0 : 0,
    order: raw.index || 999,
  };
}

type StatusFilter = "all" | "updated" | "notupdated" | "free" | "paid";
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "updated", label: "UPDATED" },
  { id: "notupdated", label: "NOT UPDATED" },
  { id: "free", label: "FREE" },
  { id: "paid", label: "PAID" },
];

function statusOf(ex: Executor) {
  if (ex.hasIssues) return { label: "Issues", cls: "border-primary/50 bg-primary/10 text-primary", bar: "bg-primary" };
  if (ex.updateStatus) return { label: "Updated", cls: "border-slime/40 bg-[hsl(var(--slime))]/10 text-slime", bar: "bg-[hsl(var(--slime))]" };
  return { label: "Not Updated", cls: "border-red-500/40 bg-red-500/10 text-red-400", bar: "bg-red-500" };
}

function priceOf(ex: Executor) {
  if (ex.unlinked) return { label: "Unlinked", cls: "border-border text-muted-foreground" };
  if (ex.free) return ex.keysystem ? { label: "Key System", cls: "border-witch/40 text-witch" } : { label: "Free", cls: "border-slime/40 text-slime" };
  return { label: ex.cost || "Paid", cls: "border-primary/40 text-primary" };
}

function detectionOf(ex: Executor): { text: string; bad: boolean } {
  if (ex.hypemu) return { text: "This exploit emulates Hyperion, but could be detected via other methods in the future.", bad: false };
  if (ex.possibleBanwave) return { text: "A banwave may be happening. Use at your own risk.", bad: true };
  if (ex.unknownDetection) return { text: "Detection status is unknown right now.", bad: true };
  if (ex.clientmods && ex.detected) return { text: "This exploit bypasses client modification bans but potentially could cause bans in banwaves.", bad: true };
  if (ex.detected) return { text: "This exploit might be detected by Hyperion, use at your own risk.", bad: true };
  return { text: "No known detection.", bad: false };
}

function cleanDescription(md?: string): string[] {
  if (!md) return [];
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/^!+\s*/gm, "")
    .split(/\n+/)
    .map((l) => l.replace(/^\*\s+/, "• ").trim())
    .filter(Boolean);
}

const pctColor = (p: number) => (p >= 90 ? "text-slime" : p >= 60 ? "text-primary" : "text-red-400");
const barColor = (p: number) => (p >= 90 ? "bg-[hsl(var(--slime))]" : p >= 60 ? "bg-primary" : "bg-red-500");

function Meter({ label, value }: { label: string; value?: number }) {
  const has = typeof value === "number" && value > 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-muted-foreground">
        <span>{label}</span>
        <span className={`text-sm font-bold ${has ? pctColor(value!) : "text-muted-foreground"}`}>{has ? `${value}%` : "N/A"}</span>
      </div>
      <div className="h-1.5 w-full bg-secondary">
        <motion.div initial={{ width: 0 }} animate={{ width: has ? `${value}%` : 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className={`h-full ${has ? barColor(value!) : ""}`} />
      </div>
    </div>
  );
}

function Logo({ ex, size }: { ex: Executor; size: number }) {
  const [bad, setBad] = useState(false);
  const src = ex.slug?.logo;
  if (!src || bad) {
    return (
      <div style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center border border-border bg-secondary font-mono font-bold text-primary">
        {ex.title[0]}
      </div>
    );
  }
  return <img src={src} alt="" width={size} height={size} onError={() => setBad(true)} style={{ width: size, height: size }} className="shrink-0 border border-border bg-secondary object-contain p-1" />;
}

function Chip({ on, label }: { on?: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 border px-3 py-2 font-mono text-[11px] tracking-wider ${on ? "border-primary/30 text-foreground" : "border-border text-muted-foreground/60"}`}>
      {on ? <Check size={12} className="text-slime" /> : <Minus size={12} />}
      {label}
    </div>
  );
}

function LinkBtn({ href, icon: Icon, children, primary }: { href?: string; icon: typeof Globe; children: React.ReactNode; primary?: boolean }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-semibold tracking-widest transition-all ${
        primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border text-foreground hover:border-primary/60 hover:text-primary"
      }`}
    >
      <Icon size={14} strokeWidth={1.5} />
      {children}
      <ExternalLink size={11} className="opacity-60" />
    </a>
  );
}

function ExecutorCard({ ex, open, onToggle, delay }: { ex: Executor; open: boolean; onToggle: () => void; delay: number }) {
  const status = statusOf(ex);
  const price = priceOf(ex);
  const detect = detectionOf(ex);
  const lines = cleanDescription(ex.slug?.fullDescription);
  const shots = ex.slug?.screenshots ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`spooky-card overflow-hidden ${open ? "!border-primary/50" : ""}`}
    >
      <span className={`absolute inset-y-0 left-0 w-[3px] ${ex.unlinked ? "bg-muted-foreground/40" : status.bar}`} />
      <button onClick={onToggle} className="flex w-full flex-col gap-3 py-4 pl-6 pr-4 text-left sm:flex-row sm:items-center" aria-expanded={open}>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Logo ex={ex} size={44} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-mono text-base font-bold tracking-wide text-foreground">{ex.title}</h3>
              <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{ex.version}</span>
              {ex.suncPct > 0 && <span className={`border border-border px-1.5 py-0.5 font-mono text-[10px] ${pctColor(ex.suncPct)}`}>{ex.suncPct}% sUNC</span>}
              {ex.beta && <span className="border border-witch/40 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-witch">BETA</span>}
              <span className={`border px-1.5 py-0.5 font-mono text-[9px] tracking-widest ${price.cls}`}>{price.label}</span>
              {ex.warning && <span title={ex.warning} className="border border-primary/40 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-primary">WARNING</span>}
            </div>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">Last updated: {ex.updatedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!ex.unlinked && <span className={`border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-widest ${status.cls}`}>{status.label}</span>}
          <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180 text-primary" : ""}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="space-y-5 border-t border-border p-5 pl-6">
              <div className="grid gap-5 border border-border bg-background/50 p-4 sm:grid-cols-2">
                <Meter label="sUNC" value={ex.suncPct} />
                <Meter label="UNC" value={ex.uncPercentage} />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Chip on={ex.decompiler} label="DECOMPILER" />
                <Chip on={ex.multiInject} label="MULTI-INJECT" />
                <Chip on={ex.clientmods} label="CLIENT MODS" />
                <Chip on={ex.raknet} label="RAKNET" />
              </div>

              <div className="flex items-start gap-3 border border-border bg-background/50 px-4 py-3">
                {detect.bad ? <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-400" /> : <ShieldCheck size={16} className="mt-0.5 shrink-0 text-slime" />}
                <div>
                  <p className="mb-0.5 font-mono text-[9px] tracking-widest text-muted-foreground">DETECTION</p>
                  <p className="text-sm text-foreground">{detect.text}</p>
                  {ex.detectionReason && <p className="mt-1 text-xs text-muted-foreground">{ex.detectionReason}</p>}
                </div>
              </div>

              {lines.length > 0 && (
                <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {lines.map((l, i) => (
                    <p key={i} className={l.startsWith("•") ? "pl-3" : ""}>{l}</p>
                  ))}
                </div>
              )}

              {shots.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {shots.map((s) => (
                    <a key={s} href={s} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <img src={s} alt="" loading="lazy" className="h-28 border border-border object-cover transition-colors hover:border-primary/60" />
                    </a>
                  ))}
                </div>
              )}

              {/* Only the official website and Discord. No purchase links on purpose. */}
              <div className="flex flex-wrap gap-3 border-t border-border pt-5">
                <LinkBtn href={ex.websitelink} icon={Globe} primary>WEBSITE</LinkBtn>
                <LinkBtn href={ex.discordlink} icon={MessageCircle}>DISCORD</LinkBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ExecutorsPage() {
  const [all, setAll] = useState<Executor[]>([]);
  const [versions, setVersions] = useState<RbxVersions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [platform, setPlatform] = useState<"all" | (typeof PLATFORMS)[number]>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([fetch(`${API}/status/exploits`), fetch(`${API}/versions/current`)]);
      if (!a.ok) throw new Error("bad status");
      const raw = (await a.json()) as RawExecutor[];
      setAll(raw.filter((e) => !e.hidden).map(normalize));
      if (b.ok) setVersions((await b.json()) as RbxVersions);
      setError(false);
      setFetchedAt(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const sections = useMemo(() => {
    const q = search.toLowerCase().trim();
    return SECTION_ORDER.map(({ plat, kind }) => {
      const list = all
        .filter((e) => e.plat === plat && e.kind === kind)
        .filter((e) => platform === "all" || e.plat === platform)
        .filter((e) => !q || e.title.toLowerCase().includes(q) || e.version.toLowerCase().includes(q))
        .filter((e) => {
          if (filter === "updated") return !!e.updateStatus;
          if (filter === "notupdated") return !e.updateStatus;
          if (filter === "free") return !!e.free;
          if (filter === "paid") return !e.free;
          return true;
        })
        .sort((a, b) => a.order - b.order);
      return { id: `${plat}-${kind}`, title: `${PLATFORM_LABEL[plat]} ${kind === "executor" ? "Executor" : "External"}`, list };
    }).filter((s) => s.list.length > 0);
  }, [all, search, filter, platform]);

  const rbx: [string, string | undefined][] = [
    ["Windows", versions?.WindowsResponse?.version ?? versions?.Windows],
    ["Mac", versions?.MacResponse?.version ?? versions?.Mac],
    ["Android", versions?.Android],
    ["iOS", versions?.iOS],
  ];

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <PageHeader eyebrow="COMPATIBILITY" title="EXECUTORS" accent="LIVE">
          Real-time status of Roblox executors, in the same order and with the same status as the WEAO tracker. Tap one for the details.
        </PageHeader>

        {/* Roblox versions */}
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 border border-border bg-card/60 px-4 py-3 backdrop-blur-sm">
          <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-primary">
            <Cpu size={13} /> ROBLOX
          </span>
          {rbx.map(([name, v]) => (
            <span key={name} className="font-mono text-[11px] text-muted-foreground">
              {name.toUpperCase()} <span className="text-foreground">{v ?? "…"}</span>
            </span>
          ))}
          <span className="ml-auto flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground">
            <button onClick={load} className="flex items-center gap-1.5 transition-colors hover:text-primary" aria-label="Refresh">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> REFRESH
            </button>
            {fetchedAt && <span>· {fetchedAt.toLocaleTimeString()}</span>}
          </span>
        </div>

        {/* Search + filters */}
        <div className="mb-3 flex items-center gap-3 border border-border bg-card/70 px-3 py-2.5 focus-within:border-primary/60">
          <Search size={14} className="text-muted-foreground" />
          <input
            placeholder="Search exploits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-3">
          <div className="flex flex-wrap gap-1">
            {(["all", ...PLATFORMS] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`border px-3 py-2 font-mono text-[10px] tracking-widest transition-colors ${
                  platform === p ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "all" ? "ALL PLATFORMS" : PLATFORM_LABEL[p].toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`border px-3 py-2 font-mono text-[10px] tracking-widest transition-colors ${
                  filter === f.id ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertTriangle size={16} />
            Couldn't reach the tracker right now.
            <button onClick={load} className="ml-auto font-mono text-xs tracking-widest underline">RETRY</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 animate-pulse border border-border bg-card" />)}</div>
        ) : sections.length === 0 ? (
          <p className="py-16 text-center font-mono text-sm text-muted-foreground">No exploits found. Try adjusting your search or filters.</p>
        ) : (
          <div className="space-y-12">
            {sections.map((s) => (
              <div key={s.id}>
                <h2 className="mb-4 flex items-center gap-3 font-mono text-sm font-bold tracking-wider text-foreground">
                  <span className="h-px w-6 bg-primary" />
                  {s.title.toUpperCase()}
                  <span className="text-[10px] font-normal text-muted-foreground">{s.list.length}</span>
                </h2>
                <div className="space-y-2">
                  {s.list.map((ex, i) => (
                    <ExecutorCard key={ex._id} ex={ex} open={openId === ex._id} onToggle={() => setOpenId(openId === ex._id ? null : ex._id)} delay={Math.min(i, 12) * 0.03} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-center font-mono text-[10px] tracking-widest text-muted-foreground">
          DATA FROM WEAO · WHATEXPSARE.ONLINE · REFRESHES EVERY MINUTE
        </p>
      </section>
    </Layout>
  );
}
