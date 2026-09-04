// ============================================================
// Vlastná analytika – zber udalostí  (Supabase Edge Function, Deno)
//
// Klient sem posiela udalosti (zobrazenie stránky, klik, registrácia…).
// Všetko citlivé sa rieši TU na serveri, nie v prehliadači:
//
//   * IP adresa sa NIKDY neuloží. Použije sa len ako vstup do denného
//     hashu (sha256 z IP + prehliadač + denná soľ). Soľ sa mení každý
//     deň a po 7 dňoch maže, takže hash sa nedá spätne rozlúštiť.
//     → žiadne cookies, žiadny súhlas, žiadna cookie lišta
//   * Boty sa zahodia podľa User-Agent skôr, než sa čokoľvek zapíše.
//
// Nasadenie:
//   supabase functions deploy track --no-verify-jwt
// (--no-verify-jwt je nutné, lebo väčšina návštevníkov nie je prihlásená)
//
// Premenné (Project Settings → Edge Functions → Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   – Supabase dopĺňa automaticky
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Udalosti, ktoré prijímame. Čokoľvek iné zahodíme, nech sa tabuľka
// nedá zaplniť vymyslenými názvami.
const ALLOWED_EVENTS = new Set([
  "page_view",
  "click",
  "sign_up",
  "sign_in",
  "checkout_start",
  "purchase",
]);

// Boty, crawlery, monitoring, náhľady odkazov na sociálnych sieťach.
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|slack|embedly|quora|pinterest|vkshare|tumblr|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|curl|wget|python-requests|axios|node-fetch|go-http|java\/|okhttp|postman|semrush|ahrefs|mj12|dotbot|petalbot|yandex|baidu|sogou|duckduck|applebot|amazonbot|gptbot|claudebot|ccbot|perplexity/i;

function detectDevice(ua: string): string {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) return "mobile";
  return "desktop";
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/chrome\/|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "iné";
}

function detectOs(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/mac os x|macintosh/i.test(ua)) return "macOS";
  if (/android/i.test(ua)) return "Android";
  if (/linux/i.test(ua)) return "Linux";
  return "iné";
}

/** Doména, z ktorej k nám človek prišiel. Vlastné odkazy ignorujeme. */
function referrerHost(referrer: string | null, self: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host && host !== self.replace(/^www\./, "") ? host : null;
  } catch {
    return null;
  }
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Skráti text na rozumnú dĺžku, nech sa do stĺpcov nedá napchať román. */
const clip = (value: unknown, max: number): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  const ua = req.headers.get("user-agent") ?? "";

  // 1. Boty preč. Odpovieme 204, nech sa nesnažia znova.
  if (!ua || BOT_RE.test(ua)) {
    return new Response(null, { status: 204, headers: CORS });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const eventName = clip(body.event, 40);
  if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
    return new Response(JSON.stringify({ error: "unknown event" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const sessionId = clip(body.session_id, 64);
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "missing session_id" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // 2. Denná soľ + hash návštevníka. IP sa nikam nezapíše.
  const { data: salt, error: saltError } = await supabase.rpc("analytics_current_salt");
  if (saltError || !salt) {
    console.error("salt error", saltError);
    return new Response(null, { status: 204, headers: CORS });
  }

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0";
  const visitorHash = await sha256(`${salt}|${ip}|${ua}`);

  // 3. Ak je človek prihlásený, priradíme udalosť k účtu.
  let userId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const { data } = await supabase.auth.getUser(authHeader.slice(7));
    userId = data.user?.id ?? null;
  }

  const props = (body.props && typeof body.props === "object") ? body.props : {};

  const { error } = await supabase.from("analytics_events").insert({
    visitor_hash: visitorHash,
    session_id: sessionId,
    event_name: eventName,
    path: clip(body.path, 300),
    label: clip(body.label, 80),
    referrer_host: referrerHost(clip(body.referrer, 500), "quantryxstudio.com"),
    utm_source: clip(body.utm_source, 80),
    utm_medium: clip(body.utm_medium, 80),
    utm_campaign: clip(body.utm_campaign, 120),
    device_type: detectDevice(ua),
    browser: detectBrowser(ua),
    os: detectOs(ua),
    country: req.headers.get("cf-ipcountry"),
    user_id: userId,
    props,
  });

  if (error) {
    console.error("insert error", error);
    return new Response(null, { status: 204, headers: CORS });
  }

  return new Response(null, { status: 204, headers: CORS });
});
