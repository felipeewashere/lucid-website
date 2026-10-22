import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LOADER_LINE } from "@/lib/loader";
import { toast } from "sonner";
import {
  Key, Copy, RefreshCw, User, LogOut, LifeBuoy,
  Send, CheckCircle, Code2, Terminal, Briefcase, ExternalLink,
  ShieldCheck, Smartphone, Disc, Settings2, ChevronRight, Check, Zap, Sparkles, Plus, Trash2
} from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";
import { GAMES_DATA, Game, Script, ConfigItem } from "@/lib/scriptsData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

/**
 * Helper to determine if a license is truly active based on boolean flag and expiry
 */
function isLicenseActive(lic: any): boolean {
  if (!lic) return false;
  if (!lic.is_active) return false;
  if (lic.expires_at) {
    if (new Date(lic.expires_at).getTime() <= Date.now()) return false;
  }
  return true;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupaUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Only shows the admin button to users who really hold the admin role in the database.
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user?.id]);
  const [activeTab, setActiveTab] = useState("overview");
  const [licenses, setLicenses] = useState<Tables<"licenses">[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(true);
  const welcomeName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || "";
  const [copiedScript, setCopiedScript] = useState(false);

  // Support ticket state
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [tickets, setTickets] = useState<Tables<"tickets">[]>([]);
  const [replies, setReplies] = useState<Tables<"ticket_replies">[]>([]);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  // Configurator state
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [currentConfig, setCurrentConfig] = useState<Record<string, any>>({});
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/login");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Real-time generation of the script when config changes
  useEffect(() => {
    if (!selectedScript) return;
    if (!user) return;

    let lines: string[] = ["-- Lucid Configurator Generated"];
    const nestedConfigs: Record<string, Record<string, any>> = {};

    for (const item of selectedScript.config) {
      const value = currentConfig[item.id] ?? item.default;
      
      const formatValue = (v: any, id: string) => {
        if (typeof v === "boolean") return v.toString();
        if (typeof v === "string") return `"${v}"`;
        if (Array.isArray(v)) {
          // Special handling for KeyCodes
          if (id === "keys") {
            return "{\n" + v.map(k => `    Enum.KeyCode.${k}`).join(",\n") + "\n}";
          }
          return "{" + v.map(it => `"${it}"`).join(", ") + "}";
        }
        return v;
      };

      // Handle nesting (e.g. SKINSINFO_CHARACTER -> SKINSINFO = { CHARACTER = ... })
      if (item.id.includes("_")) {
        const [parent, child] = item.id.split("_");
        if (!nestedConfigs[parent]) nestedConfigs[parent] = {};
        nestedConfigs[parent][child] = formatValue(value, item.id);
      } else {
        lines.push(`getgenv().${item.id} = ${formatValue(value, item.id)}`);
      }
    }

    // Add nested configs
    for (const [parent, children] of Object.entries(nestedConfigs)) {
      const childLines = Object.entries(children).map(([k, v]) => `    ${k} = ${v}`).join(",\n");
      lines.push(`getgenv().${parent} = {\n${childLines}\n}`);
    }

    const finalScript = `${lines.join("\n")}\n\nif not game:IsLoaded() then\n    game.Loaded:Wait()\nend\n\n${selectedScript.loader ? `loadstring(game:HttpGet("${selectedScript.loader}"))()` : LOADER_LINE}`;
    setGeneratedScript(finalScript);
  }, [currentConfig, selectedScript, user]);

  useEffect(() => {
    if (!user) return;
    fetchLicenses(user.id);
    fetchTickets();
  }, [user]);

  const fetchLicenses = async (userId: string) => {
    setLoadingLicenses(true);
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) console.error("Failed to load licenses:", error);
    setLicenses(data || []);
    setLoadingLicenses(false);
  };

  const fetchTickets = async () => {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTickets(data);
    const { data: reps } = await supabase
      .from("ticket_replies")
      .select("*")
      .order("created_at", { ascending: true });
    if (reps) setReplies(reps);
  };

  const handleReplySubmit = async (ticketId: string) => {
    const message = replyText.trim();
    if (!message || !user) return;
    setReplySending(true);
    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: ticketId,
      author_id: user.id,
      is_admin: false,
      message,
    });
    setReplySending(false);
    if (error) {
      toast.error(error.message);
    } else {
      setReplyText("");
      fetchTickets();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/");
  };

  const copyToClipboard = (text: string, label = "Copied to clipboard") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(LOADER_LINE);
    setCopiedScript(true);
    toast.success("Script copied!");
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setTicketLoading(true);
    const { error } = await supabase.from("tickets").insert({
      user_id: user!.id,
      subject: ticketSubject.trim(),
      message: ticketMessage.trim(),
      status: "open",
    });
    setTicketLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Support ticket submitted!");
      setTicketSubject("");
      setTicketMessage("");
      fetchTickets();
    }
  };

  const handleLinkDiscord = () => {
    supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
  };

  const handleGetRole = () => {
    toast.info("Role sync request sent! Check our Discord server (#paid-panel).");
  };

  if (!user) return null;

  const tabs = [
    { id: "overview", label: "OVERVIEW" },
    { id: "info", label: "INFO" },
    { id: "scripts", label: "SCRIPTS" },
    { id: "support", label: "SUPPORT" },
  ];

  const activeLicense = licenses.find(isLicenseActive);
  // Check if any license exists but all are expired
  const hasExpiredLicense = !activeLicense && licenses.some(l => l.expires_at && new Date(l.expires_at).getTime() <= Date.now());
  const isDiscordLinked = user.app_metadata?.provider === "discord" || user.identities?.some(id => id.provider === "discord");
  const discordProfile = user.user_metadata;

  const handleApplyChanges = () => {
    if (!selectedScript) return;
    
    let configLines = [];
    for (const [key, value] of Object.entries(currentConfig)) {
      let valueStr = "";
      if (typeof value === "boolean") {
        valueStr = value.toString();
      } else if (typeof value === "string") {
        valueStr = `"${value}"`;
      } else if (Array.isArray(value)) {
        valueStr = "{" + value.map(v => `"${v}"`).join(", ") + "}";
      }
      configLines.push(`    ${key} = ${valueStr}`);
    }

    const configTable = `-- Lucid Configurator Generated\ngetgenv().Config = {\n${configLines.join(",\n")}\n}`;

    const finalScript = `${configTable}

if not game:IsLoaded() then
    game.Loaded:Wait()
end

loadstring(game:HttpGet("${selectedScript.loader}"))()`;

    setGeneratedScript(finalScript);
  };

  const handleConfigChange = (id: string, value: any) => {
    setCurrentConfig(prev => ({ ...prev, [id]: value }));
  };

  const handleOpenGame = (game: Game) => {
    setSelectedGame(game);
    setIsGameModalOpen(true);
  };

  const handleSelectScript = (script: Script) => {
    setSelectedScript(script);
    // Initialize config with defaults
    const defaultConfig: Record<string, any> = {};
    script.config.forEach(item => {
      defaultConfig[item.id] = item.default;
    });
    setCurrentConfig(defaultConfig);
    setIsConfigModalOpen(true);
  };

  // (real-time generation useEffect moved above the if(!user) early return)

  return (
    <Layout>
      <section className="py-24">
        <motion.div {...fadeUp}>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="mb-1 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase">DASHBOARD</p>
              <h1 className="font-mono text-2xl font-bold text-foreground tracking-tighter">
                WELCOME BACK{welcomeName ? `, ${welcomeName.toUpperCase()}` : ""}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="font-mono text-xs tracking-widest border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300 transition-all"
                >
                  <ShieldCheck size={14} className="mr-2" strokeWidth={1.5} />
                  ADMIN PANEL
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="font-mono text-xs tracking-widest border border-border/50 hover:bg-red-500/10 hover:text-red-500 transition-all">
                <LogOut size={14} className="mr-2" strokeWidth={1.5} />
                LOGOUT
              </Button>
            </div>
          </div>

          {/* Expired License Banner */}
          {!loadingLicenses && hasExpiredLicense && (
            <div className="mb-6 flex items-center justify-between gap-4 border border-red-500/30 bg-red-500/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-red-500 shrink-0" />
                <p className="font-mono text-xs text-red-400 tracking-wide">
                  YOUR LICENSE HAS EXPIRED — scripts and features are unavailable.
                </p>
              </div>
              <a
                href="/key"
                className="shrink-0 inline-flex items-center gap-1.5 border border-red-500 bg-red-500 px-4 py-1.5 font-mono text-[10px] tracking-widest text-white hover:bg-red-600 transition-colors"
              >
                GET NEW KEY
              </a>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-8 flex gap-px overflow-x-auto border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-6 py-4 font-mono text-[10px] tracking-[0.2em] transition-all uppercase ${
                  activeTab === tab.id
                    ? "border-b border-foreground text-foreground bg-secondary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Overview */}
              {activeTab === "overview" && (
                <div className="grid gap-px bg-border md:grid-cols-3">
                  <div className="bg-background p-8 hover-glow border border-border/50">
                    <Key size={18} strokeWidth={1.5} className="mb-4 text-muted-foreground" />
                    <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">ACTIVE LICENSES</p>
                    <p className="mt-2 font-mono text-3xl font-bold text-foreground">
                      {licenses.filter(isLicenseActive).length}
                    </p>
                  </div>
                  <div className="bg-background p-8 hover-glow border border-border/50">
                    <ShieldCheck size={18} strokeWidth={1.5} className="mb-4 text-muted-foreground" />
                    <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">ACCOUNT STATUS</p>
                    <div className="mt-2 flex items-center gap-2">
                       {activeLicense ? (
                         <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                           <CheckCircle size={14} /> PREMIUM
                         </span>
                       ) : hasExpiredLicense ? (
                         <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse">
                           <ShieldCheck size={14} /> EXPIRED
                         </span>
                       ) : (
                         <span className="font-mono text-sm font-bold text-muted-foreground uppercase">STANDARD</span>
                       )}
                    </div>
                  </div>
                  <div className="bg-background p-8 hover-glow border border-border/50">
                    <Code2 size={18} strokeWidth={1.5} className="mb-4 text-muted-foreground" />
                    <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">LOADER VERSION</p>
                    <p className="mt-2 font-mono text-sm font-bold text-foreground">v2.4.2 [LATEST]</p>
                  </div>
                </div>
              )}

              {/* Info (Includes Discord & Licenses) */}
              {activeTab === "info" && (
                <div className="space-y-4">
                  {/* Discord Card */}
                  <div className="bg-background border border-border p-8 hover-glow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          {discordProfile?.avatar_url ? (
                            <img src={discordProfile.avatar_url} alt="Discord Avatar" className="h-16 w-16 grayscale hover:grayscale-0 transition-all border border-border rounded-none p-1" />
                          ) : (
                            <div className="h-16 w-16 bg-secondary/20 flex items-center justify-center border border-dashed border-border">
                              <User size={24} className="text-muted-foreground/30" />
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 h-3 w-3 border-2 border-background rounded-full ${isDiscordLinked ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                        <div>
                          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">DISCORD PROFILE</p>
                          <h3 className="font-mono text-lg font-bold text-foreground">
                            {discordProfile?.full_name || discordProfile?.custom_claims?.preferred_username || "NOT LINKED"}
                          </h3>
                          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                            ID: {discordProfile?.provider_id || "Unknown"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                         {!isDiscordLinked && (
                           <Button onClick={handleLinkDiscord} variant="hero" size="sm" className="font-mono text-[10px] tracking-widest px-6 h-10">
                             <Disc size={14} className="mr-2" /> LINK DISCORD
                           </Button>
                         )}
                      </div>
                    </div>
                  </div>

                  {/* License List */}
                  <div className="space-y-px bg-border">
                    <div className="bg-background/50 p-3 px-6 border-x border-t border-border">
                       <p className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground uppercase">MY LICENSES</p>
                    </div>
                    {loadingLicenses ? (
                      <div className="bg-background p-12 text-center border border-border border-t-0">
                        <RefreshCw className="mx-auto animate-spin text-muted-foreground" size={24} />
                        <p className="mt-4 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">FETCHING DATA...</p>
                      </div>
                    ) : licenses.length === 0 ? (
                      <div className="bg-background p-12 text-center border border-border border-t-0">
                        <p className="font-mono text-[10px] text-muted-foreground uppercase">NO LICENSES FOUND</p>
                      </div>
                    ) : (
                      licenses.map((lic) => {
                        return (
                          <div key={lic.id} className="flex flex-col gap-6 bg-background p-8 border border-border border-t-0 md:flex-row md:items-center md:justify-between hover-glow group transition-all">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <Key size={14} className="text-muted-foreground" />
                                <p className="font-mono text-sm font-bold text-foreground tracking-tight select-all">{lic.license_key}</p>
                              </div>
                              <div className="flex flex-wrap gap-x-10 gap-y-4">
                                <div className="space-y-1">
                                  <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">EXPIRES AT</p>
                                  <p className="font-mono text-[10px] font-bold text-foreground">
                                    {(lic.expires_at 
                                      ? new Date(lic.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                      : "LIFETIME").toUpperCase()}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">STATUS</p>
                                  <div className="flex items-center gap-2">
                                    <div className={`h-1.5 w-1.5 rounded-full ${isLicenseActive(lic) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
                                    <p className={`font-mono text-[10px] font-bold ${isLicenseActive(lic) ? 'text-green-500' : 'text-red-500'}`}>
                                      {isLicenseActive(lic) ? "ACTIVE" : "EXPIRED"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 md:self-end">
                              <Button variant="outline" size="sm" className="h-9 font-mono text-[10px] tracking-widest px-4 border-border hover:border-foreground" onClick={() => copyToClipboard(lic.license_key, "Key copied!")}>
                                <Copy size={12} className="mr-2" /> COPY
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Scripts tab */}
              {activeTab === "scripts" && (
                <div className="space-y-8">
                  <div className="bg-background border border-border p-8 hover-glow relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    
                    <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6 relative">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-foreground">
                          <Terminal size={18} className="text-foreground/80" />
                          <h3 className="font-mono text-sm font-bold tracking-[0.25em] uppercase">ROBLOX SCRIPTS</h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground max-w-sm leading-relaxed font-mono uppercase tracking-widest">
                          SELECT A GAME TO VIEW AND CONFIGURE AVAILABLE SCRIPTS.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {GAMES_DATA.map((game) => (
                        <motion.div
                          key={game.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenGame(game)}
                          className="group cursor-pointer flex flex-col items-center gap-4 p-4 border border-border bg-secondary/5 hover:bg-secondary/10 transition-all hover:border-foreground/20"
                        >
                          <div className="relative h-24 w-24 overflow-hidden border border-border p-1 group-hover:border-foreground/30 transition-all">
                            <img 
                              src={game.icon} 
                              alt={game.name} 
                              className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-foreground/5 opacity-60 group-hover:opacity-0 transition-all" />
                          </div>
                          <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-center uppercase group-hover:text-foreground transition-colors">
                            {game.name}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Universal Loader as fallback/extra */}
                  <div className="bg-background border border-border p-8 hover-glow relative overflow-hidden opacity-80">
                    <div className="mb-4 flex items-center gap-2 text-foreground/60">
                      <Terminal size={16} />
                      <h4 className="font-mono text-[10px] font-bold tracking-widest uppercase">LEGACY UNIVERSAL LOADER</h4>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <pre className="flex-1 p-4 bg-secondary/5 border border-border font-mono text-[10px] text-muted-foreground truncate">
                        {LOADER_LINE}
                      </pre>
                      <Button variant="outline" size="sm" onClick={handleCopyScript} className="font-mono text-[9px] h-8 px-4">
                        COPY
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Support */}
              {activeTab === "support" && (
                <div className="grid gap-px bg-border md:grid-cols-2">
                  <div className="bg-background p-10 border border-border">
                    <p className="mb-8 font-mono text-[10px] tracking-[0.4em] text-muted-foreground uppercase border-l-2 border-foreground pl-4">SUBMIT CASE</p>
                    <form onSubmit={handleTicketSubmit} className="space-y-6">
                      <div>
                        <label className="mb-2 block font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">SUBJECT</label>
                        <input
                          type="text"
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          required
                          placeholder="DEPARTMENT / ISSUE TYPE"
                          className="h-11 w-full border border-border bg-background px-4 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/20 transition-all focus:border-foreground"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">TRANSMISSION</label>
                        <textarea
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          required
                          rows={6}
                          placeholder="ENTER DETAILED LOG / DESCRIPTION..."
                          className="w-full border border-border bg-background px-4 py-4 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/20 transition-all focus:border-foreground resize-none"
                        />
                      </div>
                      <Button variant="hero" className="w-full font-mono text-[10px] tracking-[0.3em] h-12" disabled={ticketLoading}>
                        {ticketLoading ? (
                          <><RefreshCw size={16} className="animate-spin mr-2" /> PROCESSING</>
                        ) : (
                          <><Send size={16} className="mr-2" /> DISPATCH</>
                        )}
                      </Button>
                    </form>
                  </div>

                  <div className="bg-background p-10 border border-border border-l-0">
                    <p className="mb-8 font-mono text-[10px] tracking-[0.4em] text-muted-foreground uppercase">ARCHIVES</p>
                    {tickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[300px] border border-dashed border-border/50 text-center p-8 grayscale">
                        <LifeBuoy size={32} className="mb-4 text-muted-foreground/20" strokeWidth={1} />
                        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">NO RECENT TRANSMISSIONS</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {tickets.map((ticket) => {
                          const thread = replies.filter((r) => r.ticket_id === ticket.id);
                          const isOpen = openTicketId === ticket.id;
                          return (
                          <div key={ticket.id} className="border border-border p-5 hover:bg-secondary/10 transition-all group">
                            <button
                              type="button"
                              className="w-full text-left"
                              onClick={() => { setOpenTicketId(isOpen ? null : ticket.id); setReplyText(""); }}
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="font-mono text-xs font-bold text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{ticket.subject}</h4>
                                <div className={`h-2 w-2 rounded-full ${ticket.status === 'open' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-muted-foreground'}`} />
                              </div>
                              <p className={`text-[11px] text-muted-foreground/80 leading-relaxed mb-4 ${isOpen ? "whitespace-pre-wrap" : "line-clamp-2"}`}>{ticket.message}</p>
                            </button>
                            {isOpen && (
                              <div className="space-y-3 mb-4">
                                {thread.map((r) => (
                                  <div key={r.id} className={`border p-3 ${r.is_admin ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                                    <p className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground mb-1">
                                      {r.is_admin ? "STAFF" : "YOU"} · {new Date(r.created_at).toLocaleString()}
                                    </p>
                                    <p className="text-[11px] whitespace-pre-wrap leading-relaxed">{r.message}</p>
                                  </div>
                                ))}
                                <Textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  maxLength={4000}
                                  placeholder="Write a reply..."
                                  className="min-h-[70px] text-xs"
                                />
                                <Button size="sm" variant="hero" className="font-mono text-[10px] tracking-[0.2em]" disabled={replySending || !replyText.trim()} onClick={() => handleReplySubmit(ticket.id)}>
                                  SEND REPLY
                                </Button>
                              </div>
                            )}
                            <div className="flex items-center justify-between border-t border-border pt-3">
                               <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-tighter">
                                 {new Date(ticket.created_at).toLocaleDateString()} · {thread.length} {thread.length === 1 ? "REPLY" : "REPLIES"}
                               </p>
                               <span className="font-mono text-[9px] text-foreground/50 uppercase">{ticket.status}</span>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Game Scripts Modal */}
      <Dialog open={isGameModalOpen} onOpenChange={setIsGameModalOpen}>
        <DialogContent className="bg-background border-border max-w-md p-0 overflow-hidden">
          <div className="bg-secondary/10 p-6 border-b border-border">
            <DialogHeader>
              <DialogTitle className="font-mono text-sm font-bold tracking-[0.2em] uppercase">
                {selectedGame?.name} Scripts
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-4 space-y-2">
            {selectedGame?.scripts.length === 0 ? (
              <div className="p-8 text-center space-y-4">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                  NO CUSTOM SCRIPTS ADDED FOR THIS GAME. USE THE DEFAULT LOADER INSTEAD.
                </p>
                <Button 
                  onClick={handleCopyScript} 
                  variant="hero" 
                  size="sm" 
                  className="w-full font-mono text-[10px] tracking-widest uppercase h-10"
                >
                  <Copy size={14} className="mr-2" /> COPY DEFAULT LOADER
                </Button>
              </div>
            ) : (
              selectedGame?.scripts.map((script) => (
                <div 
                  key={script.name}
                  onClick={() => {
                    handleSelectScript(script);
                    setIsGameModalOpen(false);
                  }}
                  className="group flex items-center justify-between p-4 border border-border bg-secondary/5 hover:bg-secondary/10 cursor-pointer transition-all hover:border-foreground/20"
                >
                  <div className="flex items-center gap-3">
                    <Terminal size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    <div>
                      <p className="font-mono text-[11px] font-bold text-foreground/80 group-hover:text-foreground uppercase transition-colors">
                        {script.name}
                      </p>
                      <p className="font-mono text-[9px] text-muted-foreground uppercase">
                        {script.config.length} UI SETTINGS
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>      {/* Script Config Modal Implementation */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] max-w-4xl p-0 overflow-hidden shadow-2xl rounded-none border-t-2 border-t-foreground/20">
          {/* Header */}
          <div className="px-7 pt-7 pb-5 border-b border-[#1a1a1a] bg-gradient-to-b from-white/[0.02] to-transparent">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-foreground/10 flex items-center justify-center border border-border/50">
                      <Settings2 size={18} className="text-foreground" strokeWidth={1.5} />
                    </div>
                    <div>
                      <DialogTitle className="font-mono text-base font-bold tracking-[0.2em] uppercase text-white">
                        CONFIG
                      </DialogTitle>
                      <p className="font-mono text-[9px] text-white/30 uppercase tracking-[0.25em]">
                        Project: <span className="text-white/60">{selectedGame?.name}</span> • Script: <span className="text-white/60">{selectedScript?.name}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsConfigModalOpen(false)}
                  className="h-8 px-4 border border-border/50 bg-secondary/5 hover:bg-red-500/10 hover:text-red-500 transition-all font-mono text-[10px] tracking-widest uppercase flex items-center gap-2"
                >
                  <span className="text-xs">×</span> CLOSE
                </button>
              </div>
            </DialogHeader>
          </div>

          <div className="flex flex-col" style={{ maxHeight: "82vh" }}>
            {/* Main Config Area */}
            <div className="overflow-y-auto px-7 py-6 space-y-8 custom-scrollbar bg-background/50">
              
              {/* Status Bar */}
              <div className="flex items-center gap-2 px-4 py-2 border border-border/30 bg-secondary/5">
                <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                <p className="font-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">No pending changes</p>
              </div>

              {(() => {
                if (!selectedScript) return null;
                const groups = [...new Set(selectedScript.config.map(i => i.group || "General"))];
                return groups.map(group => {
                  const items = selectedScript.config.filter(i => (i.group || "General") === group);
                  return (
                    <div key={group} className="space-y-4">
                      {/* Group Header */}
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border/30" />
                        <h4 className="font-mono text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase whitespace-nowrap">
                          {group}
                        </h4>
                        <div className="h-px flex-1 bg-border/30" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map(item => {
                          if (item.showWhen && !currentConfig[item.id]) {
                            // Logic check: if parent is false, hide this
                            // The current implementation uses showWhen as the key of another config item
                            if (!currentConfig[item.showWhen]) return null;
                          }

                          const isModified = currentConfig[item.id] !== item.default;

                          return (
                            <div key={item.id} className="group relative border border-border/50 bg-secondary/5 p-5 hover:border-foreground/20 hover:bg-secondary/10 transition-all">
                              <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-mono text-[11px] font-bold text-foreground group-hover:text-white transition-colors uppercase tracking-tight">
                                    {item.name}
                                  </h5>
                                  <span className="px-1.5 py-0.5 bg-foreground/10 border border-border/30 font-mono text-[8px] text-muted-foreground uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                                    {item.type}
                                  </span>
                                </div>
                                <span className="font-mono text-[8px] text-muted-foreground/40 uppercase tracking-tighter">
                                  {isModified ? "MODIFIED" : "Using default"}
                                </span>
                              </div>

                              {/* BOOLEAN CONTROL */}
                              {item.type === "boolean" && (
                                <div className="flex items-center justify-between">
                                  <Label className="flex items-center gap-2 cursor-pointer select-none">
                                    <div className={`h-4 w-4 border flex items-center justify-center transition-all ${currentConfig[item.id] ? "bg-white border-white" : "bg-transparent border-white/20"}`}>
                                      {currentConfig[item.id] && <Check size={12} className="text-black" strokeWidth={3} />}
                                    </div>
                                    <Checkbox
                                      checked={currentConfig[item.id]}
                                      onCheckedChange={(val) => handleConfigChange(item.id, val)}
                                      className="hidden"
                                    />
                                    <span className="font-mono text-[10px] text-foreground/70 group-hover:text-foreground transition-colors uppercase tracking-wide">ENABLED</span>
                                  </Label>
                                </div>
                              )}

                              {/* STRING CONTROL */}
                              {item.type === "string" && (
                                <Input
                                  value={currentConfig[item.id]}
                                  onChange={(e) => handleConfigChange(item.id, e.target.value)}
                                  className="h-10 border-border/50 bg-background/50 font-mono text-[11px] text-white/80 focus:border-foreground/30 transition-all rounded-none placeholder:text-white/10"
                                  placeholder={`Enter ${item.name.toLowerCase()}...`}
                                />
                              )}

                              {/* DROPDOWN CONTROL */}
                              {item.type === "dropdown" && (
                                <Select
                                  value={currentConfig[item.id]}
                                  onValueChange={(val) => handleConfigChange(item.id, val)}
                                >
                                  <SelectTrigger className="h-10 border-border/50 bg-background/50 font-mono text-[11px] text-white/80 focus:border-foreground/30 rounded-none">
                                    <SelectValue placeholder="Select option..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border-border shadow-2xl rounded-none">
                                    {item.options?.map(opt => (
                                      <SelectItem key={opt} value={opt} className="font-mono text-[11px] text-foreground/70 focus:text-foreground focus:bg-secondary/20 py-2">
                                        {opt}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}

                                {/* MULTISELECT CONTROL */}
                                {item.type === "multiselect" && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.options?.map(opt => {
                                      const selected = (currentConfig[item.id] as string[] || []).includes(opt);
                                      return (
                                        <button
                                          key={opt}
                                          onClick={() => {
                                            const cur = (currentConfig[item.id] as string[]) || [];
                                            handleConfigChange(item.id, selected ? cur.filter(v => v !== opt) : [...cur, opt]);
                                          }}
                                          className={`px-3 py-1.5 font-mono text-[9px] tracking-wider uppercase border transition-all ${selected
                                            ? "border-foreground/50 bg-foreground/10 text-foreground"
                                            : "border-border/30 bg-transparent text-muted-foreground/40 hover:border-foreground/20 hover:text-muted-foreground"
                                            }`}
                                        >
                                          {opt}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* STRINGLIST CONTROL */}
                                {item.type === "stringlist" && (
                                  <div className="space-y-3">
                                    <div className="space-y-2">
                                      {(currentConfig[item.id] as string[] || []).map((val, idx) => (
                                        <div key={idx} className="flex gap-2">
                                          <Input
                                            value={val}
                                            onChange={(e) => {
                                              const newList = [...(currentConfig[item.id] as string[])];
                                              newList[idx] = e.target.value;
                                              handleConfigChange(item.id, newList);
                                            }}
                                            className="h-10 border-border/50 bg-background/50 font-mono text-[11px] text-white/80 focus:border-foreground/30 transition-all rounded-none placeholder:text-white/10"
                                            placeholder="Enter value..."
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                              const newList = (currentConfig[item.id] as string[]).filter((_, i) => i !== idx);
                                              handleConfigChange(item.id, newList);
                                            }}
                                            className="h-10 w-10 shrink-0 border border-border/50 bg-secondary/5 hover:bg-red-500/10 hover:text-red-500 rounded-none transition-all"
                                          >
                                            <Trash2 size={14} />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newList = [...(currentConfig[item.id] as string[] || []), ""];
                                        handleConfigChange(item.id, newList);
                                      }}
                                      className="w-full h-10 border border-dashed border-border/50 bg-secondary/5 hover:bg-secondary/10 font-mono text-[10px] tracking-widest uppercase rounded-none transition-all"
                                    >
                                      <Plus size={14} className="mr-2" /> ADD FIELD
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Bottom Actions + Output */}
            <div className="border-t border-border/50 bg-black">
              {/* Output Preview (Optional Toggle or subtle) */}
              <div className="px-7 py-4 border-b border-border/30 bg-white/[0.01]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-1 bg-green-500 animate-pulse rounded-full" />
                  <p className="font-mono text-[8px] tracking-[0.25em] text-white/20 uppercase">SYSTEM_GENERATED_PREVIEW</p>
                </div>
                <div className="font-mono text-[10px] text-white/40 line-clamp-1 opacity-50 select-all cursor-pointer hover:opacity-100 transition-opacity">
                  {generatedScript.substring(0, 100)}...
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-7 py-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest hidden sm:block">No pending changes</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      if (selectedScript) {
                        const defaultConfig: Record<string, any> = {};
                        selectedScript.config.forEach(item => {
                          defaultConfig[item.id] = item.default;
                        });
                        setCurrentConfig(defaultConfig);
                        toast.success("Settings reset to defaults");
                      }
                    }}
                    variant="ghost"
                    className="font-mono text-[10px] tracking-[0.2em] uppercase h-11 px-6 text-white/30 hover:text-white hover:bg-white/5 transition-all rounded-none"
                  >
                    <RefreshCw size={12} className="mr-2 opacity-50" /> RESET TO DEFAULTS
                  </Button>
                  <Button
                    onClick={() => {
                      if (generatedScript) {
                        copyToClipboard(generatedScript, "Configuration applied and copied!");
                        setIsConfigModalOpen(false);
                      }
                    }}
                    className="font-mono text-[10px] tracking-[0.2em] uppercase h-11 px-8 rounded-none bg-white text-black hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    SAVE CHANGES
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}


