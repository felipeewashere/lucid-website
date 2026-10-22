// POST/GET https://<project>.supabase.co/functions/v1/sync-youtube
//
// Pulls the Lucid YouTube channel's RSS feed and adds any video that is not in public.showcases yet, on top of the list
// (display_order below the current lowest). Shorts are skipped: they are cut-downs of the full videos. Existing rows are
// never touched, so titles/descriptions edited in the admin panel stay. Runs hourly from pg_cron (20261022_youtube_sync.sql);
// it only ever inserts this channel's videos, so it is safe to leave public. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// are injected by Supabase.

const CHANNEL_ID = "UCikElrLXn0qJ1R_1uo8WAvg"; // youtube.com/@OffLucidgg
const FEED = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
// Most uploads start with the same promo paragraph; it says nothing about the video, so it never becomes the card text.
const BOILERPLATE = /^(this (is )?one of the best scripts|for educational purposes|-{5,})/i;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1].trim()) : "";
};

function summary(description: string): string | null {
  const line = description.split("\n").map((l) => l.trim()).find((l) => l && !BOILERPLATE.test(l));
  return line ? line.slice(0, 200) : null;
}

Deno.serve(async () => {
  const base = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !key) return json(500, { error: "not configured" });
  const db = (path: string, init: RequestInit = {}) =>
    fetch(`${base}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init.headers },
    });

  const feed = await fetch(FEED);
  if (!feed.ok) return json(502, { error: `feed ${feed.status}` });
  const entries = [...(await feed.text()).matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: tag(e, "yt:videoId"),
    link: e.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ?? "",
    title: tag(e, "title"),
    published: tag(e, "published"),
    description: tag(e, "media:description"),
  }));
  const videos = entries.filter((v) => v.id && !v.link.includes("/shorts/"));

  const existing = await db("showcases?select=url,display_order");
  if (!existing.ok) return json(502, { error: "showcases unavailable" });
  const rows = (await existing.json()) as { url: string | null; display_order: number }[];
  const known = new Set(rows.map((r) => r.url?.match(/[?&]v=([\w-]{11})|youtu\.be\/([\w-]{11})/)?.slice(1).find(Boolean)));
  let top = Math.min(1, ...rows.map((r) => r.display_order));

  // Feed is newest first: insert oldest new video first so the newest ends up with the lowest display_order.
  const fresh = videos.filter((v) => !known.has(v.id)).reverse().map((v) => ({
    title: v.title,
    description: summary(v.description),
    type: "video",
    url: `https://www.youtube.com/watch?v=${v.id}`,
    thumbnail_url: `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
    display_order: --top,
    created_at: v.published,
  }));
  if (fresh.length) {
    const r = await db("showcases", { method: "POST", body: JSON.stringify(fresh), headers: { Prefer: "return=minimal" } });
    if (!r.ok) return json(502, { error: await r.text() });
  }
  return json(200, { checked: videos.length, added: fresh.map((v) => v.title) });
});
