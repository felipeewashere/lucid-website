// GET https://<project>.supabase.co/functions/v1/loader
//
// Serves the Lua script stored in public.loader_scripts (admin-only table) as plain text, to executors only.
// Browsers always send Sec-Fetch-* headers and a Mozilla user agent; executors' HttpGet does not, so opening
// the URL in a tab gets a 404. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by Supabase.

const text = (status: number, body: string) =>
  new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

Deno.serve(async (req) => {
  if (req.method !== "GET") return text(405, "-- method not allowed");

  const h = req.headers;
  const looksLikeBrowser =
    !!h.get("sec-fetch-mode") ||
    !!h.get("sec-fetch-dest") ||
    /mozilla|chrome|safari|firefox|edge/i.test(h.get("user-agent") ?? "") ||
    /text\/html/i.test(h.get("accept") ?? "");
  if (looksLikeBrowser) return text(404, "-- not found");

  const base = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !serviceKey) return text(500, "-- loader not configured");

  try {
    const r = await fetch(`${base}/rest/v1/loader_scripts?id=eq.main&select=content,enabled`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!r.ok) return text(502, "-- loader unavailable");
    const row = ((await r.json()) as { content: string; enabled: boolean }[])[0];
    if (!row || !row.enabled || !row.content.trim()) return text(404, "-- not found");
    return text(200, row.content);
  } catch {
    return text(502, "-- loader unavailable");
  }
});
