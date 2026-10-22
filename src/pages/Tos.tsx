import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Skull } from "lucide-react";

const sections = [
  {
    title: "ACCEPTANCE OF TERMS",
    content: `By accessing or using Lucid Rewrite, its scripts, or any associated software (collectively, "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Services. We may change these Terms at any time. Continuing to use the Services after a change means you accept it.`,
  },
  {
    title: "ELIGIBILITY",
    content: `You must be at least 13 years old to use the Services. By using them, you confirm that you meet this requirement. If you are under 18, you must have the permission of a parent or guardian.`,
  },
  {
    title: "FREE USE & LICENSE",
    content: `Lucid Rewrite is free. We grant you a limited, non-exclusive, non-transferable, revocable license to use our scripts for personal, non-commercial entertainment. You may not: (a) sell, redistribute or sublicense any part of the Services; (b) reverse-engineer, decompile or extract source code from our scripts; (c) bypass or abuse the key system; (d) use the Services to harm, harass or exploit other users.`,
  },
  {
    title: "THE KEY SYSTEM",
    content: `Access to the scripts is unlocked with a temporary key obtained by completing tasks through a third-party provider (LootLabs). That is how the project is funded. Keys expire and may be reset or revoked at any time. Attempting to bypass, automate or manipulate the key system may result in your access being blocked.`,
  },
  {
    title: "NO PAYMENT, NO REFUNDS",
    content: `The Services are provided free of charge, so there is nothing to refund. Any third-party provider you visit to obtain a key has its own terms and policies, and we are not responsible for them. Never pay anyone for a Lucid key. If someone is selling one, it is a scam.`,
  },
  {
    title: "THIRD-PARTY PLATFORMS",
    content: `Our scripts interact with third-party platforms, including the Roblox Corporation game engine. Using scripts may violate the terms of those platforms. Lucid Rewrite is not responsible for any bans, suspensions or other penalties applied to your account as a result. You use the Services at your own risk.`,
  },
  {
    title: "INTELLECTUAL PROPERTY",
    content: `All scripts, code, branding and materials provided by Lucid Rewrite belong to Lucid Rewrite and its developers. You may not copy, distribute or create derivative works without written permission.`,
  },
  {
    title: "PROHIBITED CONDUCT",
    content: `You agree not to use the Services to: (a) break any applicable law or regulation; (b) transmit malicious code or harmful data; (c) gain unauthorized access to any system; (d) harass, threaten or impersonate anyone; (e) take part in any fraudulent activity.`,
  },
  {
    title: "TERMINATION",
    content: `We may suspend or end your access to the Services at any time, for any reason, including a breach of these Terms, without notice and without liability to you. Your key will be invalidated on termination.`,
  },
  {
    title: "DISCLAIMER OF WARRANTIES",
    content: `THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. LUCID REWRITE DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE OR FREE OF VIRUSES. YOUR USE OF THE SERVICES IS AT YOUR SOLE RISK.`,
  },
  {
    title: "LIMITATION OF LIABILITY",
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, LUCID REWRITE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, ACCOUNTS OR GOODWILL, ARISING OUT OF OR RELATED TO THESE TERMS OR THE USE OF THE SERVICES.`,
  },
  {
    title: "GOVERNING LAW",
    content: `These Terms are governed by applicable law, without regard to conflict-of-law principles. Disputes arising from these Terms will be resolved through binding arbitration.`,
  },
  {
    title: "CONTACT",
    content: `Questions about these Terms? Reach us through our Discord server. We usually reply within 24–48 hours.`,
  },
];

const slug = (i: number) => `terms-${i + 1}`;

export default function TosPage() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number(e.target.getAttribute("data-idx")));
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((_, i) => {
      const el = document.getElementById(slug(i));
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <PageHeader eyebrow="LEGAL" title="TERMS OF" accent="SERVICE">
          Last updated October 2026. Read before you use Lucid Rewrite. The short version: it's free, use it responsibly.
        </PageHeader>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-start gap-3 border border-primary/30 bg-primary/5 p-4"
        >
          <Skull size={18} className="mt-0.5 shrink-0 text-primary" />
          <p className="font-mono text-xs leading-relaxed tracking-wide text-foreground/80">
            BY USING LUCID REWRITE YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD AND AGREE TO BE BOUND BY THESE TERMS.
          </p>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          {/* Table of contents */}
          <nav className="hidden lg:block">
            <div className="sticky top-8 border-l border-border">
              {sections.map((s, i) => (
                <a
                  key={s.title}
                  href={`#${slug(i)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(slug(i))?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className={`-ml-px flex gap-2 border-l py-1.5 pl-4 font-mono text-[10px] tracking-wider transition-colors ${
                    active === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="opacity-60">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </a>
              ))}
            </div>
          </nav>

          <div className="space-y-3">
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                id={slug(i)}
                data-idx={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35 }}
                className="spooky-card scroll-mt-24 p-7"
              >
                <h2 className="mb-3 flex items-center gap-3 font-mono text-sm font-bold tracking-wider text-foreground">
                  <span className="gradient-fire text-2xl">{String(i + 1).padStart(2, "0")}</span>
                  {section.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{section.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
