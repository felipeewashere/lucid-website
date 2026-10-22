import { lazy, Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { FeatureWindow } from "@/components/FeatureWindow";
import { Button } from "@/components/ui/button";
import { Terminal, Circle, X, Search, RefreshCw, Gamepad2, Check, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LOADER_LINE } from "@/lib/loader";
import type { Tables } from "@/integrations/supabase/types";

const ScriptUiWindow = lazy(() => import("@/components/ScriptUiWindow"));

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Tables<"scripts">[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<Tables<"scripts"> | null>(null);
  const [copied, setCopied] = useState(false);
  const [scriptSearch, setScriptSearch] = useState("");

  useEffect(() => {
    supabase
      .from("scripts")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (!error && data) setScripts(data);
        setLoading(false);
      });
  }, []);

  const copyScript = () => {
    navigator.clipboard.writeText(LOADER_LINE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const totalFeatures = scripts.reduce((acc, s) => acc + (s.features?.length ?? 0), 0);
  const q = scriptSearch.toLowerCase();
  const gameScripts = scripts.filter(
    (s) => !q || s.name.toLowerCase().includes(q) || s.game.toLowerCase().includes(q) || s.features?.some((f) => f.toLowerCase().includes(q)),
  );

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <PageHeader eyebrow="CATALOG" title="SCRIPTS" accent="100% FREE">
          Every script here costs nothing. Pick a game, browse what it does, grab a key and go. Updated daily.
        </PageHeader>

        {/* Search */}
        <div className="mb-6 flex items-center gap-3 border border-border bg-card/70 px-4 py-3 backdrop-blur-sm transition-colors focus-within:border-primary/60">
          <Search size={16} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search scripts, games or features..."
            value={scriptSearch}
            onChange={(e) => setScriptSearch(e.target.value)}
            className="flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          {scriptSearch && (
            <button onClick={() => setScriptSearch("")} className="text-muted-foreground hover:text-foreground">
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mb-12 grid grid-cols-3 border border-border bg-card/60 backdrop-blur-sm">
          {[
            { label: "Updates", value: "Daily", icon: RefreshCw },
            { label: "Features", value: totalFeatures.toLocaleString(), icon: Terminal },
            { label: "Games", value: scripts.length, icon: Gamepad2 },
          ].map((stat, i) => (
            <div key={stat.label} className={`flex flex-col items-center gap-2 px-4 py-6 text-center ${i > 0 ? "border-l border-border" : ""}`}>
              <stat.icon size={18} strokeWidth={1.5} className="text-primary" />
              <p className="gradient-fire font-mono text-2xl font-bold md:text-3xl">{stat.value}</p>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">{stat.label.toUpperCase()}</p>
            </div>
          ))}
        </div>

        {/* Loader */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="spooky-card relative mb-10 overflow-hidden p-8 md:p-10"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[hsl(var(--witch))]/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-primary/50 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-primary">LOADER</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Circle size={6} fill="currentColor" className="text-slime" strokeWidth={0} />
                  online
                </span>
              </div>
              <h2 className="glow-text font-mono text-3xl font-bold tracking-wider text-foreground md:text-4xl">LUCID LOADER</h2>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                One loader for every supported game. Copy it, paste it into your executor and run it.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Button variant="hero" size="lg" onClick={copyScript}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "COPIED" : "COPY"}</Button>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
          <span className="eyebrow">GAME SCRIPTS{gameScripts.length > 0 ? ` · ${gameScripts.length}` : ""}</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/40" />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse border border-border bg-secondary/30" />
            ))}
          </div>
        ) : gameScripts.length === 0 ? (
          <p className="py-16 text-center font-mono text-sm text-muted-foreground">
            {scripts.length === 0 ? "No game scripts yet." : "Nothing found. Try another word."}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gameScripts.map((script, i) => (
              <motion.div
                key={script.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="spooky-card group flex flex-col overflow-hidden"
              >
                <div className="relative aspect-video overflow-hidden border-b border-border">
                  {script.image_url ? (
                    <img src={script.image_url} alt={script.game} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-card">
                      <span className="font-mono text-[10px] text-muted-foreground">{script.game.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span className="border border-slime/50 bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-slime backdrop-blur-sm">FREE</span>
                    <span className="flex items-center gap-1.5 bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground backdrop-blur-sm">
                      <Circle size={5} fill="currentColor" className={script.status === "online" ? "text-slime" : "text-primary"} strokeWidth={0} />
                      {script.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-1 font-mono text-sm font-semibold tracking-wider text-foreground">{script.name.toUpperCase()}</h3>
                  <p className="mb-4 font-mono text-[10px] tracking-wider text-muted-foreground">
                    {script.features?.length ?? 0} FEATURES
                  </p>
                  <Button variant="outline" size="sm" className="mt-auto w-full" onClick={() => setSelectedScript(script)}>
                    VIEW FEATURES
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedScript &&
          (selectedScript.ui_schema ? (
            <Suspense fallback={null}>
              <ScriptUiWindow key={selectedScript.id} name={selectedScript.name} ui={selectedScript.ui_schema} onClose={() => setSelectedScript(null)} />
            </Suspense>
          ) : (
            <FeatureWindow key={selectedScript.id} name={selectedScript.name} features={selectedScript.features ?? []} onClose={() => setSelectedScript(null)} />
          ))}
      </AnimatePresence>
    </Layout>
  );
}
