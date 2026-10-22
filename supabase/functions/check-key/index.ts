// POST https://<project>.supabase.co/functions/v1/check-key   body: { "key": "..." }  ->  { "valid": boolean, "reason"?: string }
//
// Asks the LuaProt API (GET /api/v1/hubs/:hubId/keys/info, docs.luaprot.net/luaprot/api-documentation/keys) whether a key exists,
// is not blacklisted and has not expired. This only reads the key, it never assigns it to a device.
// Secrets (set in Supabase > Edge Functions > Secrets): LUAPROT_API_KEY, LUAPROT_HUB_ID.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json(405, { valid: false, reason: "method" });

  const apiKey = Deno.env.get("LUAPROT_API_KEY");
  const hubId = Deno.env.get("LUAPROT_HUB_ID");
  if (!apiKey || !hubId) return json(500, { valid: false, reason: "not_configured" });

  let key = "";
  try {
    key = String((await req.json())?.key ?? "").trim();
  } catch {
    return json(400, { valid: false, reason: "bad_request" });
  }
  if (!key || key.length > 128 || /\s/.test(key)) return json(200, { valid: false, reason: "invalid" });

  try {
    const r = await fetch(
      `https://luaprot.net/api/v1/hubs/${encodeURIComponent(hubId)}/keys/info?key=${encodeURIComponent(key)}`,
      { headers: { Authorization: apiKey } },
    );
    if (r.status >= 500) return json(502, { valid: false, reason: "unavailable" });
    const body = (await r.json().catch(() => null)) as
      | { success?: boolean; key?: { blacklisted?: boolean; expire?: number | null } }
      | null;
    if (!body?.success || !body.key) {
      // "Key could not be found." is the normal invalid case; any other failure (bad API key, rate limit) is ours, not the player's.
      if (r.status === 401 || r.status === 403 || r.status === 429) return json(502, { valid: false, reason: "unavailable" });
      return json(200, { valid: false, reason: "invalid" });
    }
    if (body.key.blacklisted) return json(200, { valid: false, reason: "invalid" });
    const expire = Number(body.key.expire ?? 0);
    if (expire > 0 && expire * 1000 <= Date.now()) return json(200, { valid: false, reason: "expired" });
    return json(200, { valid: true });
  } catch {
    return json(502, { valid: false, reason: "unavailable" });
  }
});
