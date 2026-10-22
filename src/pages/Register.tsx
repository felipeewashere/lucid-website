import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mail, Lock, ShieldCheck, ArrowRight,
  RefreshCw, CheckCircle2, Disc
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Registration, 2: Success

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const verifyLicenseAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { display_name: formData.email.split("@")[0] },
        },
      });
      if (authError) throw authError;

      setStep(2);
      toast.success("Registration successful!");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordRegister = () => {
    supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/dashboard/`,
      },
    });
  };

  if (step === 2) {
    return (
      <Layout>
        <section className="flex min-h-[80vh] items-center justify-center py-20 px-4">
          <motion.div
            {...fadeUp}
            className="w-full max-w-md"
          >
            <div className="bg-background border border-border p-12 text-center hover-glow transition-all">
              <CheckCircle2 size={48} className="mx-auto mb-6 text-green-500" strokeWidth={1} />
              <h2 className="mb-2 font-mono text-xl font-bold tracking-tight text-foreground uppercase">
                REGISTRATION COMPLETE!
              </h2>
              <p className="mb-8 text-sm text-muted-foreground max-w-[280px] mx-auto">
                Your account has been created.
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="hero"
                className="w-full font-mono text-[10px] tracking-[0.2em]"
              >
                GO TO DASHBOARD <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="flex min-h-[80vh] items-center justify-center py-20 px-4">
        <motion.div
           {...fadeUp}
          className="w-full max-w-md"
        >
          <div className="bg-background border border-border p-8 hover-glow transition-all">
            <div className="mb-8">
              <ShieldCheck size={32} className="mb-4 text-foreground" strokeWidth={1.5} />
              <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground uppercase">
                CREATE ACCOUNT
              </h1>
            </div>

            <form onSubmit={verifyLicenseAndRegister} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="name@example.com"
                      className="h-11 w-full border border-border bg-background pl-10 pr-4 font-mono text-xs text-foreground outline-none transition-colors focus:border-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                      PASSWORD
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="h-11 w-full border border-border bg-background pl-10 pr-4 font-mono text-xs text-foreground outline-none transition-colors focus:border-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                      CONFIRM
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="h-11 w-full border border-border bg-background pl-10 pr-4 font-mono text-xs text-foreground outline-none transition-colors focus:border-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  variant="hero"
                  className="w-full font-mono text-[10px] tracking-[0.2em]"
                  disabled={loading}
                >
                  {loading ? (
                    <><RefreshCw size={14} className="mr-2 animate-spin" /> VERIFYING...</>
                  ) : (
                    <><ShieldCheck size={14} className="mr-2" /> CREATE ACCOUNT</>
                  )}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-background px-2 text-muted-foreground font-mono tracking-widest">OR</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDiscordRegister}
                  className="w-full font-mono text-[10px] tracking-[0.2em] border-foreground/20 hover:bg-foreground hover:text-background transition-all"
                >
                  <Disc size={14} className="mr-2" /> REGISTER WITH DISCORD
                </Button>
              </div>

              <p className="text-center font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                ALREADY HAVE AN ACCOUNT?{" "}
                <Link to="/login" className="text-foreground underline underline-offset-4 hover:text-muted-foreground">
                  LOG IN
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
