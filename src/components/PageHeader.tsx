import { motion } from "framer-motion";

/** Shared page header: eyebrow, glowing title, blurb and a candle-flame divider. */
export function PageHeader({
  eyebrow,
  title,
  accent,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
      <p className="eyebrow mb-3 flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 animate-pulse bg-primary shadow-[0_0_10px_hsl(var(--pumpkin))]" />
        {eyebrow}
      </p>
      <h1 className="font-mono text-4xl font-bold tracking-tight text-foreground md:text-6xl">
        {title}
        {accent && <span className="gradient-fire"> {accent}</span>}
      </h1>
      {children && <div className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">{children}</div>}
      <div className="mt-8 h-px w-full bg-gradient-to-r from-primary/70 via-[hsl(var(--witch))]/40 to-transparent" />
    </motion.div>
  );
}
