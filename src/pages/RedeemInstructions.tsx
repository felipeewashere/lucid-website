import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertCircle, MessageSquare, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function RedeemInstructionsPage() {
  const [copied, setCopied] = useState(false);

  const copyInvite = () => {
    navigator.clipboard.writeText("https://discord.gg/YVZTPWHBNz");
    setCopied(true);
    toast.success("Discord invite copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <section className="flex min-h-[80vh] items-center justify-center py-24">
        <motion.div {...fadeUp} className="w-full max-w-lg">
          <div className="border border-border bg-background p-8 md:p-12 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center border border-border bg-secondary/20">
              <AlertCircle size={32} strokeWidth={1} className="text-foreground" />
            </div>
            
            <h1 className="mb-4 font-mono text-3xl font-bold text-foreground tracking-tighter uppercase">LICENSE REDEMPTION REQUIRED</h1>
            
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              To access the dashboard, your license key must be redeemed in our Discord server. 
              This links your purchase to your Discord account for support and security.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-border p-6 text-left hover-glow transition-colors">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">STEP 01</span>
                <h3 className="mt-2 font-mono text-sm font-bold text-foreground">JOIN DISCORD</h3>
                <p className="mt-2 text-xs text-muted-foreground">Join our official community server to access the bot.</p>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={copyInvite}>
                  {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                  {copied ? "COPIED" : "COPY INVITE"}
                </Button>
              </div>

              <div className="border border-border p-6 text-left hover-glow transition-colors">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">STEP 02</span>
                <h3 className="mt-2 font-mono text-sm font-bold text-foreground">REDEEM KEY</h3>
                <p className="mt-2 text-xs text-muted-foreground">Go to <strong>#paid-panel</strong> and follow the instructions to link your key.</p>
                <Button variant="hero" size="sm" className="mt-4 w-full" asChild>
                  <a href="https://discord.gg/YVZTPWHBNz" target="_blank" rel="noopener noreferrer">
                    OPEN DISCORD <ExternalLink size={14} className="ml-1" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-border">
              <p className="text-xs text-muted-foreground mb-4">Done redeeming your key? Try logging in again.</p>
              <div className="flex justify-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">BACK TO LOGIN</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/">HOME</Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
