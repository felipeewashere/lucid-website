import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { DitherBackground } from "@/components/DitherBackground";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Box, Check, ChevronRight, ClipboardPaste, Copy, ExternalLink, KeyRound, Lock, LockOpen, MessageSquare, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LOADER_LINE } from "@/lib/loader";

/** What the player pastes into the executor: their key, then the loader. */
const buildScript = (key: string) => `script_key = "${key.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"\n${LOADER_LINE}`;

const DISCORD_INVITE = "https://discord.gg/YVZTPWHBNz";

/** LootLabs link. Paste it here when the key system is ready; empty shows "LINK COMING SOON". */
const LOOTLABS_LINK = "https://luaprot.net/ad/74e386a2";

/** Discord can't tell us who joined, so this is a timed nudge, not a check. Runs every visit. */
type Task = "todo" | "wait" | "done";
const TASK_WAIT_MS = 5000;

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: MessageSquare, title: "JOIN THE DISCORD", desc: "Press verify, join the server and continue to unlock the key box." },
  { icon: Lock, title: "COMPLETE THE TASK", desc: "Finish the LootLabs task. You are sent back with your key." },
  { icon: ClipboardPaste, title: "PASTE YOUR KEY", desc: "Type or paste the key in the box, then use it in the loader." },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function KeyPage() {
  const [task, setTask] = useState<Task>("todo");
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [key, setKey] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [validScript, setValidScript] = useState("");
  const [notice, setNotice] = useState(false);
  const ready = LOOTLABS_LINK.trim() !== "";

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(false), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const copy = async (script: string) => {
    try {
      await navigator.clipboard.writeText(script);
      setNotice(true);
      return true;
    } catch {
      return false;
    }
  };

  const submitKey = async () => {
    const k = key.trim();
    if (!k || checking) return;
    setChecking(true);
    setError("");
    setValidScript("");
    const { data, error: fnError } = await supabase.functions.invoke("check-key", { body: { key: k } });
    setChecking(false);
    if (fnError || !data) { setError("Could not check the key. Try again."); return; }
    if (!data.valid) { setError(data.reason === "expired" ? "Key expired." : "Invalid key."); return; }
    const script = buildScript(k);
    setValidScript(script);
    if (!(await copy(script))) setError("Key is valid, but the browser blocked copying. Press COPY SCRIPT.");
  };

  useEffect(() => {
    if (task !== "wait") return;
    const t = setTimeout(() => setTask("done"), TASK_WAIT_MS);
    return () => clearTimeout(t);
  }, [task]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && task === "wait") setTask("todo");
  };

  const finish = () => {
    if (task !== "done") return;
    setOpen(false);
    setUnlocked(true);
  };

  return (
    <Layout>
      {/* Hero: dithered backdrop with the key panel centred on it */}
      <section className="pb-16 pt-6 md:pt-10">
        <div className="relative left-1/2 w-screen -translate-x-1/2 md:w-[calc(100vw-4rem)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative flex min-h-[520px] items-center justify-center overflow-hidden border-y border-border bg-black md:min-h-[600px]"
          >
            <div className="absolute inset-0">
              <DitherBackground cell={4} />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(0,0,0,0.78),transparent_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.65)]" />

            <div className="relative z-10 flex w-full flex-col items-center px-6 py-16 text-center">
              <div className="mb-6 inline-flex items-center gap-2 border border-primary/50 bg-black/70 px-3.5 py-1.5 font-mono text-[11px] tracking-widest text-primary backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse bg-primary shadow-[0_0_10px_hsl(var(--pumpkin))]" />
                FREE&nbsp;&bull;&nbsp;NO PAYMENT&nbsp;&bull;&nbsp;3 STEPS
              </div>
              <h1
                className="font-mono text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-7xl"
                style={{ textShadow: "0 2px 30px rgba(0,0,0,0.9)" }}
              >
                GET YOUR <span className="gradient-fire">KEY</span>
              </h1>
              <p
                className="mt-5 max-w-md text-sm leading-relaxed text-foreground/75 md:text-base"
                style={{ textShadow: "0 1px 18px rgba(0,0,0,0.95)" }}
              >
                Join our Discord, finish a short LootLabs task and paste your key into the loader.
              </p>

              {/* Key panel */}
              <div className="spooky-card mt-9 w-full max-w-[420px] bg-black/75 p-6 backdrop-blur-sm">
                <div className="mb-5 flex items-center justify-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
                    {unlocked ? <LockOpen size={20} strokeWidth={1.5} /> : <KeyRound size={20} strokeWidth={1.5} />}
                  </div>
                </div>

                {!unlocked ? (
                  <>
                    <div className="mb-4 border border-border bg-background/70 px-4 py-3">
                      <p className="font-mono text-sm tracking-[0.25em] text-foreground">LUCID-••••-••••-••••</p>
                    </div>
                    <p className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground">
                      <Lock size={11} /> LOCKED UNTIL VERIFIED
                    </p>
                    <Button variant="hero" size="lg" className="w-full" onClick={() => setOpen(true)}>
                      VERIFY
                      <ChevronRight size={16} strokeWidth={1.5} />
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="eyebrow mb-3">VERIFIED · ENTER YOUR KEY</p>
                    <form onSubmit={(e) => { e.preventDefault(); submitKey(); }} className="space-y-3">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => { setKey(e.target.value); setError(""); setValidScript(""); }}
                        placeholder="LUCID-XXXX-XXXX-XXXX"
                        spellCheck={false}
                        autoComplete="off"
                        autoFocus
                        className="h-12 w-full border border-border bg-background/80 px-4 text-center font-mono text-sm tracking-widest text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/70 focus:shadow-[0_0_18px_-4px_hsl(var(--pumpkin)/0.6)]"
                      />
                      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={!key.trim() || checking}>
                        {checking ? <RefreshCw size={16} className="animate-spin" /> : null}
                        {checking ? "CHECKING..." : "ENTER"}
                        {!checking && <ChevronRight size={16} strokeWidth={1.5} />}
                      </Button>
                    </form>
                    {error && <p className="mt-3 font-mono text-xs text-red-400" role="alert">{error}</p>}
                    {validScript && (
                      <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={() => copy(validScript)}>
                        <Copy size={14} strokeWidth={1.5} /> COPY SCRIPT
                      </Button>
                    )}
                    {!error && !validScript && <p className="mt-3 text-xs text-muted-foreground">No key yet? Get one with LootLabs below.</p>}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LootLabs */}
      <section className="border-t border-border py-20">
        <motion.div {...fadeUp} className="mb-10">
          <p className="eyebrow mb-3">GET A KEY</p>
          <h2 className="font-mono text-3xl font-bold text-foreground md:text-5xl">
            COMPLETE THE <span className="gradient-fire">TASK</span>
          </h2>
        </motion.div>

        <div className="spooky-card max-w-xl p-8">
          <div className="mb-5 flex h-11 w-11 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
            <Box size={20} strokeWidth={1.5} />
          </div>
          <h3 className="mb-2 font-mono text-sm font-semibold tracking-wider text-foreground">LOOTLABS</h3>
          <p className="mb-5 text-sm leading-relaxed text-muted-foreground">Finish the LootLabs tasks and your key is unlocked.</p>
          <ul className="mb-7 space-y-2">
            {["Works on PC and mobile", "Keep your ad blocker off for the tasks"].map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Check size={12} strokeWidth={2} className="shrink-0 text-primary" />
                {point}
              </li>
            ))}
          </ul>
          {ready ? (
            <Button variant="hero" size="lg" asChild>
              <a href={LOOTLABS_LINK} target="_blank" rel="noopener noreferrer">
                CONTINUE WITH LOOTLABS
                <ChevronRight size={16} strokeWidth={1.5} />
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="lg" disabled>
              LOOTLABS · LINK COMING SOON
            </Button>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border py-20">
        <motion.div {...fadeUp} className="mb-12">
          <p className="eyebrow mb-3">PROCESS</p>
          <h2 className="font-mono text-3xl font-bold text-foreground md:text-5xl">
            HOW IT <span className="gradient-fire">WORKS</span>
          </h2>
        </motion.div>
        <div className="relative grid gap-4 md:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-14 hidden h-px bg-gradient-to-r from-primary/60 via-[hsl(var(--witch))]/60 to-primary/60 md:block" />
          {STEPS.map((s, i) => (
            <div key={s.title} className="spooky-card relative p-8">
              <span className="font-mono text-5xl font-bold text-primary/20">0{i + 1}</span>
              <s.icon size={22} strokeWidth={1.5} className="my-4 text-primary" />
              <h3 className="mb-2 font-mono text-sm font-semibold tracking-wider text-foreground">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Help */}
      <section className="border-t border-border py-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">Stuck on a checkpoint or your key does not work?</p>
          <Button variant="outline" size="lg" asChild>
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
              <MessageSquare size={14} strokeWidth={1.5} />
              JOIN THE DISCORD
            </a>
          </Button>
        </div>
      </section>

      {/* Bottom-left notice */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            role="status"
            className="fixed bottom-4 left-4 z-[60] flex items-center gap-2.5 border border-primary/50 bg-black/90 px-4 py-2.5 font-mono text-xs tracking-wider text-foreground shadow-[0_0_30px_-8px_hsl(var(--pumpkin)/0.6)] backdrop-blur-sm"
          >
            <Check size={14} strokeWidth={2} className="text-primary" />
            Script copied
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discord task popup */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[460px] gap-0 rounded-none border border-primary/40 bg-card p-8 shadow-[0_0_60px_-10px_hsl(var(--pumpkin)/0.45)] sm:rounded-none">
          <p className="eyebrow mb-3">VERIFICATION</p>
          <DialogTitle className="mb-3 pr-8 font-mono text-2xl font-bold tracking-tight text-foreground">
            One quick task <span className="gradient-fire">first</span>
          </DialogTitle>
          <DialogDescription className="mb-6 text-sm leading-relaxed text-muted-foreground">
            Join the Lucid: REWRITE Discord to unlock your key box.
          </DialogDescription>

          <div className="relative mb-6 flex items-center gap-4 overflow-hidden border border-border bg-background/70 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
              {task === "done" ? <Check size={18} strokeWidth={2} /> : <MessageSquare size={18} strokeWidth={1.5} />}
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-mono text-xs font-semibold tracking-wider text-foreground">Join the Lucid: REWRITE Discord</p>
              <p className={`text-xs ${task === "done" ? "text-slime" : "text-muted-foreground"}`} aria-live="polite">
                {task === "todo" ? "Not done yet" : task === "wait" ? "Verifying, hang on…" : "Done"}
              </p>
            </div>
            {task !== "done" && (
              <Button
                variant="hero"
                size="sm"
                asChild
                className={task === "wait" ? "pointer-events-none opacity-50" : ""}
              >
                <a
                  href={DISCORD_INVITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => task === "todo" && setTask("wait")}
                >
                  JOIN <ExternalLink size={12} strokeWidth={1.5} />
                </a>
              </Button>
            )}
            <span
              aria-hidden="true"
              className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-[hsl(var(--witch))] ${
                task === "wait" ? "w-full transition-[width] ease-linear" : task === "done" ? "w-full" : "w-0"
              }`}
              style={task === "wait" ? { transitionDuration: `${TASK_WAIT_MS}ms` } : undefined}
            />
          </div>

          <Button variant="hero" size="lg" className="w-full disabled:opacity-40 disabled:shadow-none" onClick={finish} disabled={task !== "done"}>
            CONTINUE
            <ChevronRight size={16} strokeWidth={1.5} />
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            The Discord opens in a new tab. Come back here once you have joined.
          </p>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
