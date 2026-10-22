import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogIn, Mail, Lock, Loader2, AlertCircle, MessageSquare } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  // Prevent double-fire from getSession() + onAuthStateChange both triggering
  const hasChecked = useRef(false);

  /** Sends admins to /admin and everyone else to the dashboard. */
  const checkLicenseAndRedirect = async (user: any) => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    try {
      // Admins are decided by the database (user_roles via has_role), never by anything the browser holds.
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (isAdmin) {
        toast.success("Administrator access granted.");
        navigate("/admin");
        return;
      }

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("[Login] Status check error:", err);
      toast.error("Error verifying account status.");
    }
  };

  useEffect(() => {
    // Only check session once across both getSession + onAuthStateChange
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log("[Login] Existing session found, verifying...");
        checkLicenseAndRedirect(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        console.log("[Login] SIGNED_IN event, verifying...");
        checkLicenseAndRedirect(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });
      if (error) throw error;
      if (data.user) {
        await checkLicenseAndRedirect(data.user);
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    setDiscordLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo: `${window.location.origin}/login/` },
      });
      if (error) {
        if (error.message.includes("provider is not enabled")) {
          toast.error("Discord login is not enabled. Enable it in Supabase Dashboard (Auth > Providers).", { duration: 6000 });
        } else {
          throw error;
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Discord login failed.");
      setDiscordLoading(false);
    }
  };

  return (
    <Layout>
      <section className="flex min-h-[80vh] items-center justify-center py-24">
        <motion.div {...fadeUp} className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center border border-border">
              <LogIn size={16} strokeWidth={1.5} className="text-muted-foreground" />
            </div>
            <h1 className="mb-2 font-mono text-2xl font-bold text-foreground tracking-wider uppercase">DASHBOARD</h1>
            <p className="text-sm text-muted-foreground">
              Login to manage your scripts and licenses.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-muted-foreground/50" size={14} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="h-10 w-full border border-border bg-background pl-9 pr-3 font-mono text-xs text-foreground outline-none transition-colors focus:border-foreground"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-muted-foreground/50" size={14} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-10 w-full border border-border bg-background pl-9 pr-3 font-mono text-xs text-foreground outline-none transition-colors focus:border-foreground"
                />
              </div>
            </div>

            <Button variant="hero" className="w-full" disabled={loading || discordLoading}>
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> LOGGING IN...</>
              ) : (
                <><LogIn size={14} strokeWidth={1.5} /> SIGN IN</>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-background px-2 text-muted-foreground tracking-widest">OR</span>
            </div>
          </div>

          {/* Discord OAuth */}
          <Button
            variant="outline"
            className="w-full gap-3 font-mono text-xs tracking-wider"
            onClick={handleDiscordLogin}
            disabled={loading || discordLoading}
          >
            {discordLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
              </svg>
            )}
            LOGIN WITH DISCORD
          </Button>

          {/* Footer links */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link to="/register" className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground">
              NEW USER? CREATE ACCOUNT →
            </Link>
          </div>

          {/* Help box */}
          <div className="mt-8 border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">NEED HELP?</p>
                <p className="text-xs text-muted-foreground">
                  If you lost access or can't redeem your key, contact us on Discord.
                </p>
                <a href="https://discord.gg/YVZTPWHBNz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[10px] text-foreground hover:underline">
                  <MessageSquare size={10} /> JOIN DISCORD
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
