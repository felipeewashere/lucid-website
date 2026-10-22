import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Shield, Key, FileText, Terminal, Image,
  Trash2, Check, X, Plus, LogOut, Edit2, Save,
  MessageSquare, DollarSign, Star, RefreshCw, FileCode, Copy,
} from "lucide-react";
import type { Tables, Json } from "@/integrations/supabase/types";
import { parseScriptUi, featureLabels } from "@/lib/scriptUi";

/** Turns the pasted UI JSON into what the scripts table stores. Empty text = no UI. */
function buildUi(text: string): { ui_schema: Json | null; features: string[] } | { error: string } {
  if (!text.trim()) return { ui_schema: null, features: [] };
  let raw: unknown;
  try { raw = JSON.parse(text); } catch (e) { return { error: `Invalid JSON: ${(e as Error).message}` }; }
  const parsed = parseScriptUi(raw);
  if (!parsed.ui) return { error: parsed.errors.join("\n") };
  return { ui_schema: raw as Json, features: featureLabels(parsed.ui) };
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

type AdminTab = "overview" | "scripts" | "showcases" | "tickets" | "licenses" | "keys" | "loader";

const inputCls = "h-10 w-full border border-border bg-card px-3 font-mono text-sm text-foreground outline-none focus:border-foreground";
const textareaCls = "w-full border border-border bg-card px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-foreground resize-none";
const labelCls = "mb-1 block font-mono text-[10px] tracking-[0.2em] text-muted-foreground";

export default function AdminPage() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // Data
  const [scripts, setScripts] = useState<Tables<"scripts">[]>([]);
  const [showcases, setShowcases] = useState<Tables<"showcases">[]>([]);
  const [licenses, setLicenses] = useState<Tables<"licenses">[]>([]);
  const [tickets, setTickets] = useState<Tables<"tickets">[]>([]);
  const [replies, setReplies] = useState<Tables<"ticket_replies">[]>([]);

  // Script form
  const [scriptForm, setScriptForm] = useState({ name: "", game: "", roblox_url: "", description: "", ui: "", status: "online", is_paid: true });
  const [scriptLoading, setScriptLoading] = useState(false);
  const [editingScript, setEditingScript] = useState<string | null>(null);
  const [editScriptData, setEditScriptData] = useState({ name: "", game: "", roblox_url: "", description: "", ui: "", status: "online", is_paid: true });

  // Keys (checked by the /key page)
  const [keys, setKeys] = useState<Tables<"script_keys">[]>([]);
  const [keyForm, setKeyForm] = useState({ list: "", days: "", note: "" });
  const [keyLoading, setKeyLoading] = useState(false);

  // Showcase form
  const [showcaseForm, setShowcaseForm] = useState({ title: "", url: "", description: "", type: "video", display_order: "0" });
  const [showcaseLoading, setShowcaseLoading] = useState(false);
  const [editingShowcase, setEditingShowcase] = useState<string | null>(null);
  const [editShowcaseData, setEditShowcaseData] = useState({ title: "", url: "", description: "", type: "video", display_order: "0" });

  // Loader (/loader.lua)
  const [loader, setLoader] = useState({ content: "", enabled: false, updated_at: "" });
  const [loaderSaving, setLoaderSaving] = useState(false);
  // Served by the Supabase Edge Function in supabase/functions/loader (GitHub Pages is static-only).
  const loaderUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loader`;

  // Ticket replies
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  // Real check: a signed-in Supabase user who holds the 'admin' role. The database enforces the same
  // rule through row level security, so skipping this screen does not grant any access.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      if (!alive) return;
      if (!isAdmin) { toast.error("Admins only."); navigate("/"); return; }
      setAuthorized(true);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [navigate]);

  useEffect(() => {
    if (!authorized) return;
    fetchAll();
  }, [authorized]);

  const fetchAll = async () => {
    const [s, sc, l, t, ld, r, k] = await Promise.all([
      supabase.from("scripts").select("*").order("name"),
      supabase.from("showcases").select("*").order("display_order", { ascending: true }),
      supabase.from("licenses").select("*").order("created_at", { ascending: false }),
      supabase.from("tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("loader_scripts").select("*").eq("id", "main").maybeSingle(),
      supabase.from("ticket_replies").select("*").order("created_at", { ascending: true }),
      supabase.from("script_keys").select("*").order("created_at", { ascending: false }),
    ]);
    if (r.data) setReplies(r.data);
    if (k.data) setKeys(k.data);
    if (ld.data) setLoader({ content: ld.data.content, enabled: ld.data.enabled, updated_at: ld.data.updated_at });
    if (s.data) setScripts(s.data);
    if (sc.data) setShowcases(sc.data);
    if (l.data) setLicenses(l.data);
    if (t.data) setTickets(t.data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Helper to fetch roblox thumbnail using roproxy
  const fetchRobloxThumb = async (url: string | null): Promise<string | null> => {
    if (!url) return null;
    const match = url.match(/(?:roblox\.com\/games\/|roblox\.com\/catalog\/|roblox\.com\/library\/)(\d+)/i) || url.match(/(\d+)/);
    if (!match) return null;
    const placeId = match[1];
    try {
      // 1. Get Universe ID
      const uniRes = await fetch(`https://apis.roproxy.com/universes/v1/places/${placeId}/universe`);
      const uniJson = await uniRes.json();
      const universeId = uniJson.universeId;
      if (!universeId) return null;

      // 2. Get Game Thumbnail (16:9)
      const thumbRes = await fetch(`https://thumbnails.roproxy.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=1&size=768x432&format=Png&isCircular=false`);
      const thumbJson = await thumbRes.json();
      return thumbJson.data?.[0]?.thumbnails?.[0]?.imageUrl || null;
    } catch (e) {
      console.error("Failed to fetch roblox thumb", e);
      return null;
    }
  };

  // ─── SCRIPTS ─────────────────────────────────
  const handleAddScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setScriptLoading(true);
    const built = buildUi(scriptForm.ui);
    if ("error" in built) { setScriptLoading(false); toast.error(built.error, { duration: 10000 }); return; }
    const slug = scriptForm.name.toLowerCase().replace(/\s+/g, "-");

    // Fetch thumbnail if roblox_url exists
    const image_url = await fetchRobloxThumb(scriptForm.roblox_url);

    const { error } = await supabase.from("scripts").insert({
      name: scriptForm.name, game: scriptForm.game,
      description: scriptForm.description, features: built.features, ui_schema: built.ui_schema,
      status: scriptForm.status as "online" | "updating" | "offline", slug,
      roblox_url: scriptForm.roblox_url || null,
      image_url,
      is_paid: scriptForm.is_paid,
    });
    setScriptLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Script added!");
    setScriptForm({ name: "", game: "", roblox_url: "", description: "", ui: "", status: "online", is_paid: true });
    fetchAll();
  };

  const handleSaveScript = async (id: string) => {
    const built = buildUi(editScriptData.ui);
    if ("error" in built) { toast.error(built.error, { duration: 10000 }); return; }
    const image_url = await fetchRobloxThumb(editScriptData.roblox_url);
    const { error } = await supabase.from("scripts").update({
      name: editScriptData.name, game: editScriptData.game,
      description: editScriptData.description, features: built.features, ui_schema: built.ui_schema,
      status: editScriptData.status as "online" | "updating" | "offline",
      roblox_url: editScriptData.roblox_url || null,
      image_url: image_url || undefined,
      is_paid: editScriptData.is_paid,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    
    if (editScriptData.roblox_url) {
        await supabase.from("scripts").update({ image_url }).eq("id", id);
    } else if (editScriptData.roblox_url === "") {
        await supabase.from("scripts").update({ image_url: null, roblox_url: null }).eq("id", id);
    }

    toast.success("Script updated!");
    setEditingScript(null);
    fetchAll();
  };

  const startEditScript = (s: Tables<"scripts">) => {
    setEditingScript(s.id);
    setEditScriptData({
      name: s.name, game: s.game,
      roblox_url: s.roblox_url ?? "",
      description: s.description ?? "",
      ui: s.ui_schema ? JSON.stringify(s.ui_schema, null, 2) : "",
      status: s.status,
      is_paid: s.is_paid ?? true,
    });
  };

  const handleDeleteScript = async (id: string) => {
    if (!confirm("Delete this script?")) return;
    await supabase.from("scripts").delete().eq("id", id);
    toast.success("Script deleted");
    setScripts(prev => prev.filter(s => s.id !== id));
  };

  const handleScriptStatus = async (id: string, status: string) => {
    await supabase.from("scripts").update({ status }).eq("id", id);
    setScripts(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    toast.success("Status updated");
  };

  // ─── SHOWCASES ────────────────────────────────
  const handleAddShowcase = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowcaseLoading(true);
    const { error } = await supabase.from("showcases").insert({
      title: showcaseForm.title,
      url: showcaseForm.url || null,
      description: showcaseForm.description || null,
      type: showcaseForm.type,
      display_order: parseInt(showcaseForm.display_order) || 0,
    });
    setShowcaseLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Showcase added!");
    setShowcaseForm({ title: "", url: "", description: "", type: "video", display_order: "0" });
    fetchAll();
  };

  const startEditShowcase = (sc: Tables<"showcases">) => {
    setEditingShowcase(sc.id);
    setEditShowcaseData({
      title: sc.title, url: sc.url ?? "",
      description: sc.description ?? "", type: sc.type,
      display_order: String(sc.display_order ?? 0),
    });
  };

  const handleSaveShowcase = async (id: string) => {
    const { error } = await supabase.from("showcases").update({
      title: editShowcaseData.title, url: editShowcaseData.url || null,
      description: editShowcaseData.description || null, type: editShowcaseData.type,
      display_order: parseInt(editShowcaseData.display_order) || 0,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Showcase updated!");
    setEditingShowcase(null);
    fetchAll();
  };

  const handleDeleteShowcase = async (id: string) => {
    if (!confirm("Delete this showcase?")) return;
    await supabase.from("showcases").delete().eq("id", id);
    toast.success("Showcase deleted");
    setShowcases(prev => prev.filter(s => s.id !== id));
  };

  // ─── TICKETS ──────────────────────────────────
  const handleTicketStatus = async (id: string, status: string) => {
    await supabase.from("tickets").update({ status }).eq("id", id);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    toast.success("Status updated");
  };

  const handleSendReply = async (ticketId: string) => {
    const reply = replyTexts[ticketId]?.trim();
    if (!reply) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data, error } = await supabase
      .from("ticket_replies")
      .insert({ ticket_id: ticketId, author_id: session.user.id, is_admin: true, message: reply })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    setReplies(prev => [...prev, data]);
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket?.status === "open") handleTicketStatus(ticketId, "in_progress");
    toast.success("Reply sent");
    setReplyTexts(prev => ({ ...prev, [ticketId]: "" }));
  };

  // ─── LICENSES ─────────────────────────────────
  const handleToggleLicense = async (lic: Tables<"licenses">) => {
    const { error } = await supabase.from("licenses").update({ is_active: !lic.is_active }).eq("id", lic.id);
    if (!error) {
      setLicenses(prev => prev.map(l => l.id === lic.id ? { ...l, is_active: !l.is_active } : l));
      toast.success(`License ${lic.is_active ? "deactivated" : "activated"}`);
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!confirm("Delete this license?")) return;
    await supabase.from("licenses").delete().eq("id", id);
    setLicenses(prev => prev.filter(l => l.id !== id));
    toast.success("License deleted");
  };

  // ─── KEYS ─────────────────────────────────────
  const handleAddKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = [...new Set(keyForm.list.split("\n").map(k => k.trim()).filter(Boolean))];
    if (list.length === 0) return;
    const days = parseInt(keyForm.days);
    const expires_at = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null;
    setKeyLoading(true);
    const { error } = await supabase
      .from("script_keys")
      .upsert(list.map(key_value => ({ key_value, note: keyForm.note || null, expires_at, is_active: true })), { onConflict: "key_value" });
    setKeyLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${list.length} key${list.length > 1 ? "s" : ""} saved`);
    setKeyForm({ list: "", days: "", note: "" });
    fetchAll();
  };

  const handleToggleKey = async (k: Tables<"script_keys">) => {
    const { error } = await supabase.from("script_keys").update({ is_active: !k.is_active }).eq("id", k.id);
    if (error) { toast.error(error.message); return; }
    setKeys(prev => prev.map(x => x.id === k.id ? { ...x, is_active: !x.is_active } : x));
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Delete this key?")) return;
    const { error } = await supabase.from("script_keys").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setKeys(prev => prev.filter(x => x.id !== id));
  };

  // ─── LOADER ───────────────────────────────────
  const handleSaveLoader = async () => {
    setLoaderSaving(true);
    const updated_at = new Date().toISOString();
    const { error } = await supabase
      .from("loader_scripts")
      .upsert({ id: "main", content: loader.content, enabled: loader.enabled, updated_at });
    setLoaderSaving(false);
    if (error) { toast.error(error.message); return; }
    setLoader(prev => ({ ...prev, updated_at }));
    toast.success("Loader saved");
  };

  const copyLoadstring = async () => {
    await navigator.clipboard.writeText(`loadstring(game:HttpGet("${loaderUrl}"))()`);
    toast.success("Copied");
  };

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: "overview",   label: "OVERVIEW",   icon: Shield },
    { id: "scripts",    label: "SCRIPTS",    icon: Terminal },
    { id: "showcases",  label: "SHOWCASES",  icon: Image },
    { id: "tickets",    label: "TICKETS",    icon: MessageSquare },
    { id: "licenses",   label: "LICENSES",   icon: Key },
    { id: "keys",       label: "KEYS",       icon: Key },
    { id: "loader",     label: "LOADER",     icon: FileCode },
  ];

  if (!authorized && !loading) return null;
  if (loading) return (
    <Layout>
      <section className="flex min-h-[60vh] items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground">VERIFYING ACCESS...</p>
      </section>
    </Layout>
  );

  return (
    <Layout>
      <section className="py-24">
        <motion.div {...fadeUp}>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="mb-1 font-mono text-xs tracking-[0.3em] text-muted-foreground">LUCID: REWRITE</p>
              <h1 className="font-mono text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield size={20} strokeWidth={1.5} />
                ADMIN PANEL
              </h1>
              <p className="mt-1 font-mono text-[10px] text-green-400">● ADMIN ACCESS</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={14} strokeWidth={1.5} />
              LOGOUT
            </Button>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex gap-px overflow-x-auto border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 px-4 py-3 font-mono text-xs tracking-wider transition-colors ${
                  activeTab === tab.id
                    ? "border-b border-foreground text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon size={12} strokeWidth={1.5} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══════════ OVERVIEW ═══════════ */}
          {activeTab === "overview" && (
            <div className="grid gap-px bg-border md:grid-cols-4">
              {[
                { label: "TOTAL SCRIPTS", value: scripts.length, icon: Terminal },
                { label: "TOTAL LICENSES", value: licenses.length, icon: Key },
                { label: "ACTIVE LICENSES", value: licenses.filter(l => l.is_active).length, icon: Check },
                { label: "OPEN TICKETS", value: tickets.filter(t => t.status === "open").length, icon: FileText },
              ].map((stat) => (
                <div key={stat.label} className="bg-background p-6">
                  <stat.icon size={16} strokeWidth={1.5} className="mb-3 text-muted-foreground" />
                  <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ═══════════ SCRIPTS ═══════════ */}
          {activeTab === "scripts" && (
            <div className="space-y-8">
              {/* Add script form */}
              <div className="border border-border bg-background p-6">
                <p className="mb-4 font-mono text-xs tracking-[0.2em] text-muted-foreground">ADD SCRIPT</p>
                <form onSubmit={handleAddScript} className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>NAME</label>
                    <input required value={scriptForm.name} onChange={e => setScriptForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>GAME</label>
                    <input required value={scriptForm.game} onChange={e => setScriptForm(p => ({ ...p, game: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>ROBLOX GAME LINK (optional - fetches icon)</label>
                    <input value={scriptForm.roblox_url} onChange={e => setScriptForm(p => ({ ...p, roblox_url: e.target.value }))} className={inputCls} placeholder="https://www.roblox.com/games/12345/..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>DESCRIPTION</label>
                    <input required value={scriptForm.description} onChange={e => setScriptForm(p => ({ ...p, description: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>UI JSON (paste the script's menu structure; see SCRIPT-UI-JSON.md)</label>
                    <textarea rows={10} spellCheck={false} value={scriptForm.ui} onChange={e => setScriptForm(p => ({ ...p, ui: e.target.value }))} className={textareaCls} placeholder={'{ "tabs": [ { "name": "Main", "icon": "Swords", "pages": [ ... ] } ] }'} />
                  </div>
                  <div>
                    <label className={labelCls}>STATUS</label>
                    <select value={scriptForm.status} onChange={e => setScriptForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                      <option value="online">Online</option>
                      <option value="updating">Updating</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>TYPE</label>
                    <select value={scriptForm.is_paid ? "paid" : "free"} onChange={e => setScriptForm(p => ({ ...p, is_paid: e.target.value === "paid" }))} className={inputCls}>
                      <option value="paid">Paid</option>
                      <option value="free">Free</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="hero" className="w-full" disabled={scriptLoading}>
                      <Plus size={14} strokeWidth={1.5} />
                      {scriptLoading ? "ADDING..." : "ADD SCRIPT"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Scripts list */}
              <div className="space-y-px bg-border">
                {scripts.map(script => (
                  <div key={script.id} className="bg-background p-4 space-y-3">
                    {editingScript === script.id ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div><label className={labelCls}>NAME</label><input value={editScriptData.name} onChange={e => setEditScriptData(p => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
                        <div><label className={labelCls}>GAME</label><input value={editScriptData.game} onChange={e => setEditScriptData(p => ({ ...p, game: e.target.value }))} className={inputCls} /></div>
                        <div className="md:col-span-2"><label className={labelCls}>ROBLOX GAME LINK (optional - fetches icon)</label><input value={editScriptData.roblox_url} onChange={e => setEditScriptData(p => ({ ...p, roblox_url: e.target.value }))} className={inputCls} placeholder="https://www.roblox.com/games/12345/..." /></div>
                        <div className="md:col-span-2"><label className={labelCls}>DESCRIPTION</label><input value={editScriptData.description} onChange={e => setEditScriptData(p => ({ ...p, description: e.target.value }))} className={inputCls} /></div>
                        <div className="md:col-span-2"><label className={labelCls}>UI JSON</label><textarea rows={12} spellCheck={false} value={editScriptData.ui} onChange={e => setEditScriptData(p => ({ ...p, ui: e.target.value }))} className={textareaCls} /></div>
                        <div>
                          <label className={labelCls}>STATUS</label>
                          <select value={editScriptData.status} onChange={e => setEditScriptData(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                            <option value="online">Online</option>
                            <option value="updating">Updating</option>
                            <option value="offline">Offline</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>TYPE</label>
                          <select value={editScriptData.is_paid ? "paid" : "free"} onChange={e => setEditScriptData(p => ({ ...p, is_paid: e.target.value === "paid" }))} className={inputCls}>
                            <option value="paid">Paid</option>
                            <option value="free">Free</option>
                          </select>
                        </div>
                        <div className="flex items-end gap-2 md:col-span-2">
                          <Button variant="hero" size="sm" onClick={() => handleSaveScript(script.id)}><Save size={12} strokeWidth={1.5} />SAVE</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingScript(null)}><X size={12} strokeWidth={1.5} />CANCEL</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-mono text-sm font-semibold text-foreground">{script.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{script.game.toUpperCase()} · {(script.features?.length ?? 0)} FEATURES · {script.ui_schema ? "UI ✓" : "NO UI"} · {script.status.toUpperCase()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEditScript(script)}><Edit2 size={12} strokeWidth={1.5} />EDIT</Button>
                          {["online","updating","offline"].map(s => (
                            <button key={s} onClick={() => handleScriptStatus(script.id, s)}
                              className={`font-mono text-[10px] tracking-wider px-3 py-1.5 border transition-colors ${script.status === s ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                              {s.toUpperCase()}
                            </button>
                          ))}
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteScript(script.id)}><Trash2 size={12} strokeWidth={1.5} /></Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {scripts.length === 0 && <div className="bg-background p-6"><p className="text-sm text-muted-foreground">No scripts yet. Add one above.</p></div>}
              </div>
            </div>
          )}

          {/* ═══════════ SHOWCASES ═══════════ */}
          {activeTab === "showcases" && (
            <div className="space-y-8">
              <div className="border border-border bg-background p-6">
                <p className="mb-4 font-mono text-xs tracking-[0.2em] text-muted-foreground">ADD SHOWCASE</p>
                <form onSubmit={handleAddShowcase} className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>TITLE</label>
                    <input required value={showcaseForm.title} onChange={e => setShowcaseForm(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="My Showcase Video" />
                  </div>
                  <div>
                    <label className={labelCls}>TYPE</label>
                    <select value={showcaseForm.type} onChange={e => setShowcaseForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                      <option value="video">Video</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>YouTube / URL</label>
                    <input value={showcaseForm.url} onChange={e => setShowcaseForm(p => ({ ...p, url: e.target.value }))} className={inputCls} placeholder="https://youtube.com/watch?v=..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>DESCRIPTION</label>
                    <textarea rows={2} value={showcaseForm.description} onChange={e => setShowcaseForm(p => ({ ...p, description: e.target.value }))} className={textareaCls} />
                  </div>
                  <div>
                    <label className={labelCls}>DISPLAY ORDER (lower = first)</label>
                    <input type="number" value={showcaseForm.display_order} onChange={e => setShowcaseForm(p => ({ ...p, display_order: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="flex items-end">
                    <Button variant="hero" className="w-full" disabled={showcaseLoading}>
                      <Plus size={14} strokeWidth={1.5} />
                      {showcaseLoading ? "ADDING..." : "ADD SHOWCASE"}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="space-y-px bg-border">
                {showcases.map(sc => (
                  <div key={sc.id} className="bg-background p-4 space-y-3">
                    {editingShowcase === sc.id ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div><label className={labelCls}>TITLE</label><input value={editShowcaseData.title} onChange={e => setEditShowcaseData(p => ({ ...p, title: e.target.value }))} className={inputCls} /></div>
                        <div>
                          <label className={labelCls}>TYPE</label>
                          <select value={editShowcaseData.type} onChange={e => setEditShowcaseData(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                            <option value="video">Video</option>
                            <option value="image">Image</option>
                          </select>
                        </div>
                        <div className="md:col-span-2"><label className={labelCls}>URL</label><input value={editShowcaseData.url} onChange={e => setEditShowcaseData(p => ({ ...p, url: e.target.value }))} className={inputCls} /></div>
                        <div className="md:col-span-2"><label className={labelCls}>DESCRIPTION</label><textarea rows={2} value={editShowcaseData.description} onChange={e => setEditShowcaseData(p => ({ ...p, description: e.target.value }))} className={textareaCls} /></div>
                        <div><label className={labelCls}>ORDER</label><input type="number" value={editShowcaseData.display_order} onChange={e => setEditShowcaseData(p => ({ ...p, display_order: e.target.value }))} className={inputCls} /></div>
                        <div className="flex items-end gap-2">
                          <Button variant="hero" size="sm" onClick={() => handleSaveShowcase(sc.id)}><Save size={12} strokeWidth={1.5} />SAVE</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingShowcase(null)}><X size={12} strokeWidth={1.5} />CANCEL</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-mono text-sm font-semibold text-foreground">{sc.title}</p>
                          <p className="font-mono text-[10px] text-muted-foreground truncate max-w-lg">{sc.url || "No URL"} · ORDER {sc.display_order}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEditShowcase(sc)}><Edit2 size={12} strokeWidth={1.5} />EDIT</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteShowcase(sc.id)}><Trash2 size={12} strokeWidth={1.5} /></Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {showcases.length === 0 && <div className="bg-background p-6"><p className="text-sm text-muted-foreground">No showcases yet. Add one above.</p></div>}
              </div>
            </div>
          )}

          {/* ═══════════ TICKETS ═══════════ */}
          {activeTab === "tickets" && (
            <div className="space-y-px bg-border">
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-background p-5 space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-mono text-sm font-semibold text-foreground">{ticket.subject}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{new Date(ticket.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["open","in_progress","resolved","closed"].map(s => (
                        <button key={s} onClick={() => handleTicketStatus(ticket.id, s)}
                          className={`font-mono text-[10px] tracking-wider px-2 py-1 border transition-colors ${ticket.status === s ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                          {s.replace("_"," ").toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground border-l border-border pl-3">{ticket.message}</p>
                  {replies.filter(r => r.ticket_id === ticket.id).map(r => (
                    <div key={r.id} className="border-l border-foreground pl-3">
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {r.is_admin ? "ADMIN" : "USER"} · {new Date(r.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-foreground">{r.message}</p>
                    </div>
                  ))}
                  {/* Reply area */}
                  <div>
                    <button
                      onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                      className="font-mono text-[10px] tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <MessageSquare size={10} strokeWidth={1.5} />
                      {expandedTicket === ticket.id ? "CLOSE REPLY" : "REPLY"}
                    </button>
                    {expandedTicket === ticket.id && (
                      <div className="mt-2 flex gap-2">
                        <textarea
                          rows={2}
                          placeholder="Type your reply..."
                          value={replyTexts[ticket.id] ?? ""}
                          onChange={e => setReplyTexts(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                          className={`${textareaCls} flex-1`}
                        />
                        <Button variant="hero" size="sm" className="self-end" onClick={() => handleSendReply(ticket.id)}>
                          SEND
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {tickets.length === 0 && <div className="bg-background p-6"><p className="text-sm text-muted-foreground">No tickets yet.</p></div>}
            </div>
          )}

          {/* ═══════════ LICENSES ═══════════ */}
          {activeTab === "licenses" && (
            <div className="space-y-px bg-border">
              {licenses.map(lic => (
                <div key={lic.id} className="flex flex-col gap-3 bg-background p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-mono text-xs font-semibold text-foreground">{lic.license_key}</p>
                    <div className="mt-1 flex flex-wrap gap-3 font-mono text-[10px] text-muted-foreground">
                      <span>PLAN: {lic.plan_type.toUpperCase()}</span>
                      <span>HWID: {lic.hwid || "NOT SET"}</span>
                      <span>EXP: {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : "LIFETIME"}</span>
                      <span className={lic.is_active ? "text-green-400" : ""}>{lic.is_active ? "● ACTIVE" : "○ INACTIVE"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleLicense(lic)}>
                      {lic.is_active ? <X size={12} strokeWidth={1.5} /> : <Check size={12} strokeWidth={1.5} />}
                      {lic.is_active ? "DEACTIVATE" : "ACTIVATE"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteLicense(lic.id)}><Trash2 size={12} strokeWidth={1.5} /></Button>
                  </div>
                </div>
              ))}
              {licenses.length === 0 && <div className="bg-background p-6"><p className="text-sm text-muted-foreground">No licenses found.</p></div>}
            </div>
          )}

          {/* ═══════════ KEYS ═══════════ */}
          {activeTab === "keys" && (
            <div className="space-y-8">
              <div className="border border-border bg-background p-6">
                <p className="mb-1 font-mono text-xs tracking-[0.2em] text-muted-foreground">ADD KEYS</p>
                <p className="mb-4 font-mono text-[10px] text-muted-foreground">
                  The /key page accepts a key only if it is listed here and active. If your protected loader checks keys itself, add the same keys there too.
                </p>
                <form onSubmit={handleAddKeys} className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={labelCls}>KEYS (one per line)</label>
                    <textarea rows={5} spellCheck={false} required value={keyForm.list} onChange={e => setKeyForm(p => ({ ...p, list: e.target.value }))} className={textareaCls} />
                  </div>
                  <div>
                    <label className={labelCls}>EXPIRES AFTER (days, empty = never)</label>
                    <input type="number" min="0" value={keyForm.days} onChange={e => setKeyForm(p => ({ ...p, days: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>NOTE (optional)</label>
                    <input value={keyForm.note} onChange={e => setKeyForm(p => ({ ...p, note: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <Button variant="hero" disabled={keyLoading}>
                      <Plus size={14} strokeWidth={1.5} />
                      {keyLoading ? "SAVING..." : "ADD KEYS"}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="space-y-px bg-border">
                {keys.map(k => {
                  const expired = !!k.expires_at && new Date(k.expires_at).getTime() <= Date.now();
                  const live = k.is_active && !expired;
                  return (
                    <div key={k.id} className="flex flex-col gap-3 bg-background p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-mono text-xs font-semibold text-foreground select-all">{k.key_value}</p>
                        <div className="mt-1 flex flex-wrap gap-3 font-mono text-[10px] text-muted-foreground">
                          <span>EXP: {k.expires_at ? new Date(k.expires_at).toLocaleString() : "NEVER"}</span>
                          {k.note && <span>NOTE: {k.note}</span>}
                          <span className={live ? "text-green-400" : ""}>{live ? "● VALID" : expired ? "○ EXPIRED" : "○ DISABLED"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleKey(k)}>
                          {k.is_active ? <X size={12} strokeWidth={1.5} /> : <Check size={12} strokeWidth={1.5} />}
                          {k.is_active ? "DISABLE" : "ENABLE"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteKey(k.id)}><Trash2 size={12} strokeWidth={1.5} /></Button>
                      </div>
                    </div>
                  );
                })}
                {keys.length === 0 && <div className="bg-background p-6"><p className="text-sm text-muted-foreground">No keys yet.</p></div>}
              </div>
            </div>
          )}

          {/* ═══════════ LOADER ═══════════ */}
          {activeTab === "loader" && (
            <div className="space-y-6">
              <div className="border border-border bg-card p-4">
                <p className={labelCls}>EXECUTOR LINE</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-foreground">
                    {`loadstring(game:HttpGet("${loaderUrl}"))()`}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyLoadstring}>
                    <Copy size={12} strokeWidth={1.5} />
                    COPY
                  </Button>
                </div>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  Served as plain text to executors only. Opening the URL in a browser returns 404.
                </p>
              </div>

              <div>
                <label className={labelCls}>SCRIPT (paste your LuaProt-protected loader here)</label>
                <textarea
                  className={`${textareaCls} h-96 resize-y`}
                  spellCheck={false}
                  value={loader.content}
                  onChange={(e) => setLoader(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={'script_key = "..."\nloadstring(game:HttpGet("..."))()'}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 font-mono text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={loader.enabled}
                    onChange={(e) => setLoader(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                  ENABLED {loader.enabled ? <span className="text-green-400">● LIVE</span> : <span className="text-muted-foreground">○ OFF (404)</span>}
                </label>
                <div className="flex items-center gap-4">
                  {loader.updated_at && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      SAVED {new Date(loader.updated_at).toLocaleString()} · {loader.content.length} CHARS
                    </span>
                  )}
                  <Button size="sm" onClick={handleSaveLoader} disabled={loaderSaving}>
                    <Save size={12} strokeWidth={1.5} />
                    {loaderSaving ? "SAVING..." : "SAVE"}
                  </Button>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </section>
    </Layout>
  );
}
