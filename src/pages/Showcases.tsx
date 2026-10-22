import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Play, Youtube, Ghost } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Extract YouTube video ID from any YouTube URL format */
function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** Only ever link to http(s) URLs, so a stored `javascript:` link can never run script when clicked. */
function safeUrl(url: string | null | undefined): string {
  return url && /^https?:\/\//i.test(url.trim()) ? url.trim() : "#";
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PlayBadge({ big }: { big?: boolean }) {
  return (
    <span
      className={`flex items-center justify-center border border-primary bg-black/70 text-primary shadow-[0_0_30px_-4px_hsl(var(--pumpkin))] backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground ${
        big ? "h-16 w-16" : "h-12 w-12"
      }`}
    >
      <Play size={big ? 24 : 18} fill="currentColor" strokeWidth={0} className="ml-0.5" />
    </span>
  );
}

export default function ShowcasesPage() {
  const { data: showcases = [], isLoading } = useQuery({
    queryKey: ["showcases"],
    queryFn: async () => {
      const { data, error } = await supabase.from("showcases").select("*").order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const latest = showcases[0] ?? null;
  const latestYt = latest ? getYouTubeId(latest.url) : null;
  const latestThumb = latestYt ? getYouTubeThumbnail(latestYt) : latest?.thumbnail_url ?? null;
  const rest = showcases.slice(1);

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <PageHeader eyebrow="GALLERY" title="SHOWCASES">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
            <p>See Lucid in action. Fresh videos and clips from the crypt.</p>
            <a
              href="https://www.youtube.com/@mngr06/featured"
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-2 border border-red-500/40 bg-red-600/10 px-4 py-2 font-mono text-xs font-bold tracking-wider text-red-400 transition-all hover:bg-red-600/20 hover:shadow-[0_0_24px_-6px_rgba(239,68,68,0.7)]"
            >
              <Youtube size={16} strokeWidth={1.5} />
              YOUTUBE CHANNEL
            </a>
          </div>
        </PageHeader>

        {/* Latest upload */}
        {!isLoading && latest && (
          <motion.a
            href={safeUrl(latest.url)}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="spooky-card group relative mb-12 block overflow-hidden"
          >
            <div className="relative aspect-video w-full overflow-hidden md:aspect-[21/9]">
              {latestThumb ? (
                <img src={latestThumb} alt={latest.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="h-full w-full bg-secondary/40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayBadge big />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <p className="eyebrow mb-3 flex items-center gap-3">
                  <span className="bg-primary px-2 py-0.5 text-[10px] font-bold tracking-widest text-primary-foreground">LATEST UPLOAD</span>
                  <span className="text-muted-foreground">{formatDate(latest.created_at)}</span>
                </p>
                <h2 className="glow-text max-w-2xl font-mono text-xl font-bold leading-tight text-foreground md:text-3xl">{latest.title}</h2>
                {latest.description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/70 line-clamp-2">{latest.description}</p>}
              </div>
            </div>
          </motion.a>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="spooky-card p-4">
                <div className="mb-4 aspect-video animate-pulse bg-secondary/40" />
                <div className="h-4 w-2/3 animate-pulse bg-secondary/40" />
              </div>
            ))}
          </div>
        ) : showcases.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Ghost size={48} strokeWidth={1} className="float-slow text-primary" />
            <p className="font-mono text-sm text-muted-foreground">No showcases yet. It's quiet in here...</p>
          </div>
        ) : (
          rest.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((item, i) => {
                const ytId = getYouTubeId(item.url);
                const thumb = ytId ? getYouTubeThumbnail(ytId) : item.thumbnail_url ?? null;
                return (
                  <motion.a
                    key={item.id}
                    href={safeUrl(item.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 9) * 0.05, duration: 0.4 }}
                    className="spooky-card group flex flex-col overflow-hidden"
                  >
                    <div className="relative aspect-video overflow-hidden border-b border-border">
                      {thumb ? (
                        <img src={thumb} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="h-full w-full bg-secondary/40" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <PlayBadge />
                      </div>
                      {ytId && (
                        <span className="absolute left-2 top-2 flex items-center gap-1 bg-black/70 px-1.5 py-1 backdrop-blur-sm">
                          <Youtube size={11} className="text-red-500" />
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="mb-1.5 font-mono text-[10px] tracking-widest text-primary">{formatDate(item.created_at)}</p>
                      <h3 className="font-mono text-sm font-semibold leading-snug tracking-wide text-foreground">{item.title}</h3>
                      {item.description && <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">{item.description}</p>}
                    </div>
                  </motion.a>
                );
              })}
            </div>
          )
        )}
      </section>
    </Layout>
  );
}
