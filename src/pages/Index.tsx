import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Zap,
  RefreshCw,
  ChevronRight,
  Eye,
  Key,
  Ghost,
  Skull,
  ListChecks,
  ClipboardPaste,
} from "lucide-react";
import { InteractiveMenu } from "@/components/InteractiveMenu";
import { DitherBackground } from "@/components/DitherBackground";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const features = [
  { icon: Zap, title: "FAST UPDATES", desc: "Patched within hours of a game update. No sitting around waiting." },
  { icon: RefreshCw, title: "DAILY UPDATES", desc: "Fresh features and new games land every single day." },
  { icon: Ghost, title: "UNDETECTED", desc: "Built to stay under the radar so you can play without worry." },
  { icon: Eye, title: "CLEAN UI", desc: "Minimal, quick and easy to find your way around. Nothing extra." },
  { icon: Skull, title: "FULLY FREE", desc: "Every script costs $0. Pass the key system and you're in, no payments ever." },
];

const stats = [
  { value: "$0", label: "Price of everything" },
  { value: "DAILY", label: "Update schedule" },
  { value: "3", label: "Steps to your key" },
];

const steps = [
  { step: "01", icon: Key, title: "OPEN THE KEY PAGE", desc: "Hit GET KEY, join the Discord and verify, then complete the LootLabs task." },
  { step: "02", icon: ListChecks, title: "PASS THE CHECKPOINTS", desc: "Finish the short tasks. When you're done you're sent back with your key. It's how we keep Lucid free." },
  { step: "03", icon: ClipboardPaste, title: "PASTE & PLAY", desc: "Run the loader in your executor, paste the key when prompted and the hub opens. Nothing to buy." },
];

const faqItems = [
  { q: "Is Lucid really free?", a: "Yes, completely. Every script is free to use. The only thing between you and the script is a short key system, which is how we keep the project running." },
  { q: "How do I get started?", a: "Head to the Key page, pick a provider, finish the quick checkpoints and copy your key. Then run the loader in your executor and paste the key when it asks." },
  { q: "How does the key system work?", a: "You complete a short LootLabs task and get sent back with a key. Paste that key into the script's key prompt and the hub unlocks. No account or payment needed." },
  { q: "How long does a key last?", a: "Keys are temporary, so when yours expires just grab a new one from the Key page. It takes about a minute." },
  { q: "How often is Lucid updated?", a: "Daily. We push fixes, new features and new game support all the time, and patch quickly after Roblox or game updates." },
  { q: "Does Lucid work on mobile?", a: "Yes. Scripts are built and tested for PC and mobile, as long as your executor supports the game. Check the Executors page to see what's working right now." },
  { q: "How do I contact support?", a: "Join the Discord, open a ticket and describe the problem. Include your executor name and any error you see." },
];


function HeroSection() {
  return (
    <section className="pb-24 pt-6 md:pt-10">
      {/* Living dithered backdrop with the headline centred on it */}
      {/* Full-bleed: breaks out of the 1120px column to span the whole page beside the sidebar */}
      <div className="relative left-1/2 mb-10 w-screen -translate-x-1/2 md:w-[calc(100vw-4rem)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative flex min-h-[460px] items-center justify-center overflow-hidden border-y border-border bg-black md:min-h-[600px]"
      >
        <div className="absolute inset-0">
          <DitherBackground cell={4} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(0,0,0,0.78),transparent_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.65)]" />

        <div className="relative z-10 flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 border border-primary/50 bg-black/70 px-3.5 py-1.5 font-mono text-[11px] tracking-widest text-primary backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse bg-primary shadow-[0_0_10px_hsl(var(--pumpkin))]" />
            V 2.0.0&nbsp;&bull;&nbsp;FREE&nbsp;&bull;&nbsp;UNDETECTED
          </div>
          <h1
            className="font-mono text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-7xl"
            style={{ textShadow: "0 2px 30px rgba(0,0,0,0.9)" }}
          >
            LUCID<span className="gradient-fire">: REWRITE</span>
          </h1>
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary/60 md:w-16" />
              <p
                className="flicker gradient-fire font-mono text-lg font-bold tracking-[0.22em] md:text-2xl"
                style={{ filter: "drop-shadow(0 0 14px rgba(255,106,0,0.55))" }}
              >
                MAKE LUCID GREAT AGAIN
              </p>
              <span className="h-px w-8 bg-primary/60 md:w-16" />
            </div>
            <p
              className="max-w-md text-sm leading-relaxed text-foreground/75 md:text-base"
              style={{ textShadow: "0 1px 18px rgba(0,0,0,0.95)" }}
            >
              100% free scripts. Pass a quick key and you're in.
            </p>
          </div>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button variant="hero" size="lg" asChild>
              <Link to="/scripts">
                EXPLORE SCRIPTS
                <ChevronRight size={16} strokeWidth={1.5} />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="border-primary/40 bg-black/60 backdrop-blur-sm">
              <Link to="/key">GET KEY</Link>
            </Button>
          </div>
        </div>
      </motion.div>
      </div>

      {/* Interactive menu: same layout as the in-game UI, nothing here runs */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="flex flex-col items-center"
      >
        <InteractiveMenu />
        <p className="mt-3 font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
          LIVE PREVIEW &bull; CLICK AROUND
        </p>
      </motion.div>
    </section>
  );
}

const REVIEWS = [
  { name: "rollcancel.", stars: 5, text: "w script fast and easy purchase and alot of things on it" },
  { name: "im him", stars: 5, text: "W script works pretty well + lot of features and the devs reply so quickly, really good service and super nice people overall." },
  { name: "PABLO", stars: 5, text: "W script using for 3 days and didnt turn off my laptop for 3 days" },
  { name: "carlosss28_", stars: 5, text: "w script, listens to the community, actually adds the suggestions, should buy for 15$ its so worth it" },
  { name: "geo", stars: 5, text: "+rep works great, got mih rq" },
  { name: "NotKami", stars: 5, text: "W script works pretty well + lot of features" },
  { name: "Panda", stars: 5, text: "this script changed my life 🤤" },
  { name: "Complexity", stars: 5, text: "I am just chilling, this script worth every penny" },
  { name: "ÊrrørRBLX", stars: 5, text: "Works as intended amazing overall" },
  { name: "PanhIaChay", stars: 5, text: "W voiding mechanic, kira raid in under 2 minutes" },
  { name: "Xvelvette", stars: 5, text: "Works as advertised, tested with delta" },
  { name: "Phantom", stars: 5, text: "tuff! easy buying and great product" },
  { name: "maxling_", stars: 5, text: "sss rank in 2 min best script" },
  { name: "bmwseries7", stars: 5, text: "the devs talk to u anytime u want and answer questions — things you suggest actually get implemented" },
  { name: "Glitched", stars: 5, text: "One of the best scripts around, can comfortably say it's legit and clean" },
  { name: "TheSinFather", stars: 5, text: "Starting lvl 0 - 20mins later Grade 2 and 50k quantity per item." },
  { name: "Bjornito", stars: 5, text: "Crazy work" },
  { name: "Jordy3322", stars: 5, text: "The new update works perfectly and kills the boss as indicated. Worth the purchase!" },
  { name: "Haunt", stars: 5, text: "tuff dude he even gave me da discount yo" },
  { name: "✨bleyu✨", stars: 5, text: "VOUCH goated ahh script ong" },
  { name: ".bjornito", stars: 5, text: "+rep W script" },
  { name: ".hyperdelta", stars: 5, text: "aimbot is crazy for project delta" },
  { name: ".jamezgamez", stars: 5, text: "vouch :heart: best maki farm oat" },
  { name: "0mlg", stars: 5, text: "autoroll got me 10 mythical in 1 hour" },
  { name: "ck033084", stars: 5, text: "secure and clean, worth every dollar" },
  { name: "divinecubee", stars: 5, text: "constant updates, love the devs" },
  { name: "fearslim", stars: 5, text: "W script fast and easy purchase" },
  { name: "flowdawg77", stars: 5, text: "works for mobile as well, super smooth" },
  { name: "ggnex", stars: 5, text: "best script for anime battle arena" },
  { name: "kojizen", stars: 5, text: "everwind script is literally broken lol" },
  { name: "moneyruletheworld", stars: 5, text: "money farm on gpo is too good" },
  { name: "nemnaran", stars: 5, text: "vouch legit seller" },
  { name: "opzenko", stars: 5, text: "finally an undetected script hub" },
  { name: "qxdb", stars: 5, text: "lucid on top" },
  { name: "shaddyselina", stars: 5, text: "10/10 features are insane" },
  { name: "trxcted", stars: 5, text: "best scripts in roblox history" },
  { name: "z3ob", stars: 5, text: "W vouch :fire:" },
  { name: "biscouta", stars: 5, text: "really easy to use" },
  { name: "babyyoda6569", stars: 5, text: "unbelievable performance" },
  { name: "sawul", stars: 5, text: "highly recommended" },
];

// Double the reviews array for seamless infinite scroll
const MARQUEE_REVIEWS = [...REVIEWS, ...REVIEWS];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i < count ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className={i < count ? "text-yellow-400" : "text-white/15"}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function ReviewsMarquee() {
  return (
    <section className="border-t border-border py-12 overflow-hidden">
      <p className="eyebrow mb-6 text-center">WHAT USERS SAY</p>
      <div className="marquee-container">
        <div className="marquee-track">
          {MARQUEE_REVIEWS.map((r, i) => (
            <div
              key={i}
              className="mx-3 w-[260px] flex-shrink-0 border border-border bg-card/80 p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center bg-primary/15 font-mono text-[10px] font-bold text-primary">
                    {r.name[0].toUpperCase()}
                  </div>
                  <span className="font-mono text-[10px] font-bold text-foreground tracking-wider">{r.name}</span>
                </div>
                <StarRating count={r.stars} />
              </div>
              <p className="font-mono text-[9px] leading-relaxed text-muted-foreground line-clamp-2">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <Layout>
      {/* Reviews Marquee — very top */}
      <ReviewsMarquee />

      {/* Hero */}
      <HeroSection />



      {/* Why Lucid */}
      <section className="border-t border-border py-24">
        <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }}>
          <motion.p {...fadeUp} className="eyebrow mb-3">
            CAPABILITIES
          </motion.p>
          <motion.h2 {...fadeUp} className="mb-14 font-mono text-3xl font-bold text-foreground md:text-5xl">
            WHY <span className="gradient-fire">LUCID</span>
          </motion.h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className={`spooky-card group p-7 ${i < 3 ? "lg:col-span-2" : "lg:col-span-3"}`}
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center border border-primary/30 bg-primary/10 text-primary transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <f.icon size={20} strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 font-mono text-sm font-semibold tracking-wider text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-4 grid grid-cols-3 border border-border bg-card/60 backdrop-blur-sm">
            {stats.map((s, i) => (
              <div key={s.label} className={`px-4 py-8 text-center ${i > 0 ? "border-l border-border" : ""}`}>
                <p className="gradient-fire font-mono text-3xl font-bold md:text-5xl">{s.value}</p>
                <p className="mt-2 font-mono text-[10px] tracking-[0.25em] text-muted-foreground">{s.label.toUpperCase()}</p>
              </div>
            ))}
          </motion.div>
          <p className="mt-4 text-center font-mono text-xs tracking-widest text-muted-foreground">AND GROWING EVERY DAY.</p>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border py-24">
        <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
          <motion.p {...fadeUp} className="eyebrow mb-3">
            THE KEY SYSTEM
          </motion.p>
          <motion.h2 {...fadeUp} className="mb-4 font-mono text-3xl font-bold text-foreground md:text-5xl">
            HOW IT <span className="gradient-fire">WORKS</span>
          </motion.h2>
          <motion.p {...fadeUp} className="mb-14 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Lucid is free. No store, no checkout. You unlock it with a quick key, and it takes about a minute.
          </motion.p>
          <div className="relative grid gap-4 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-14 hidden h-px bg-gradient-to-r from-primary/60 via-[hsl(var(--witch))]/60 to-primary/60 md:block" />
            {steps.map((item) => (
              <motion.div key={item.step} variants={fadeUp} className="spooky-card relative p-8">
                <span className="font-mono text-5xl font-bold text-primary/20">{item.step}</span>
                <item.icon size={22} strokeWidth={1.5} className="my-4 text-primary" />
                <h3 className="mb-2 font-mono text-sm font-semibold tracking-wider text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeUp} className="mt-8 text-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/key">
                START WITH THE KEY
                <ChevronRight size={16} strokeWidth={1.5} />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border py-24">
        <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
          <motion.p {...fadeUp} className="eyebrow mb-3">
            QUESTIONS
          </motion.p>
          <motion.h2 {...fadeUp} className="mb-14 font-mono text-3xl font-bold text-foreground md:text-5xl">
            <span className="gradient-fire">FAQ</span>
          </motion.h2>
          <div className="space-y-2">
            {faqItems.map((item) => (
              <motion.details key={item.q} variants={fadeUp} className="spooky-card group">
                <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-4 p-6 font-mono text-sm tracking-wider text-foreground">
                  {item.q.toUpperCase()}
                  <ChevronRight size={16} className="shrink-0 text-primary transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
              </motion.details>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-24">
        <motion.div {...fadeUp} initial="initial" whileInView="animate" viewport={{ once: true }} className="text-center">
          <h2 className="glow-text mb-4 font-mono text-3xl font-bold text-foreground md:text-5xl">
            READY TO <span className="gradient-fire">BEGIN?</span>
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            It's free. Pass a quick key and the scripts are yours.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/key">
              GET KEY
              <ChevronRight size={16} strokeWidth={1.5} />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="font-mono text-xs tracking-wider text-muted-foreground">
            © 2026 LUCID REWRITE — HAPPY HALLOWEEN
          </p>
          <div className="flex gap-6">
            <Link to="/tos" className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground">
              TERMS
            </Link>
            <Link to="/key" className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground">
              KEY
            </Link>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
