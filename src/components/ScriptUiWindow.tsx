import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { icons } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { MenuWindow } from "./InteractiveMenu";
import type { Group, Tab } from "./InteractiveMenu";
import { parseScriptUi } from "@/lib/scriptUi";
import type { ParsedGroup } from "@/lib/scriptUi";

/** Renders a script's pasted JSON in the same window as the homepage menu. Lazy loaded: it pulls in the full lucide icon set. */

const icon = (name: string): LucideIcon => (icons as Record<string, LucideIcon>)[name] ?? icons.Layers;

const toGroup = (g: ParsedGroup): Group => ("tabs" in g ? g : { title: g.title, icon: icon(g.icon), items: g.items, collapsed: g.collapsed });

export default function ScriptUiWindow({ name, ui, onClose }: { name: string; ui: unknown; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const parsed = useMemo(() => parseScriptUi(ui), [ui]);
  const tabs = useMemo<Tab[]>(() => {
    if (!parsed.ui) return [];
    return parsed.ui.tabs.map((t) => ({
      name: t.name,
      icon: icon(t.icon),
      pinned: t.pinned,
      pages: t.pages.map((p) => ({ name: p.name, left: p.left.map(toGroup), right: p.right.map(toGroup) })),
    }));
  }, [parsed]);

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
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[720px]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
        {tabs.length > 0 ? (
          <MenuWindow key={name} tabs={tabs} footerText={`Lucid: REWRITE | ${name}`} />
        ) : (
          <p className="border border-border bg-card p-6 font-mono text-xs text-muted-foreground">This script has no valid UI JSON.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
