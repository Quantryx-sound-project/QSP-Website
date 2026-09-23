// ============================================================
// lemon-sync  (Supabase Edge Function, Deno)
//
// Záchranná sieť k webhooku: prihlásený používateľ (JWT) zavolá túto funkciu
// (Dashboard to robí automaticky po návrate z platobnej brány a tlačidlom
// "Obnoviť licencie"). Funkcia sa priamo spýta Lemon Squeezy API na všetky
// objednávky s emailom používateľa a chýbajúce licencie dopíše.
// → Aj keď webhook z akéhokoľvek dôvodu nedorazí, licencia sa objaví.
//
// Nasadenie:   supabase functions deploy lemon-sync
// Secrets:     LEMON_API_KEY   – Lemon Squeezy → Settings → API → nový kľúč
//                                (kľúč z TEST mode vidí len testovacie objednávky,
//                                 z LIVE mode len ostré)
//              voliteľne LEMON_STORE_ID
// ============================================================

import { adminClient, grantFromOrder } from "../_shared/licensing.ts";

const API_KEY = (Deno.env.get("LEMON_API_KEY") ?? "").trim();
const STORE_ID = (Deno.env.get("LEMON_STORE_ID") ?? "").trim();
const admin = adminClient();

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !auth?.user) return json({ error: "unauthorized" }, 401);
  const user = auth.user;
  const email = (user.email ?? "").trim();

  if (!API_KEY) return json({ ok: false, reason: "LEMON_API_KEY not set" });
  if (!email) return json({ ok: false, reason: "user has no email" });

  const results: unknown[] = [];
  const errors: string[] = [];
  let url: string | null =
    `https://api.lemonsqueezy.com/v1/orders?filter[user_email]=${encodeURIComponent(email)}` +
    (STORE_ID ? `&filter[store_id]=${encodeURIComponent(STORE_ID)}` : "") +
    `&page[size]=100`;

  for (let guard = 0; url && guard < 10; guard++) {
    const r = await fetch(url, {
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });
    if (!r.ok) {
      const txt = await r.text();
      console.error(`[lemon-sync] LS API ${r.status}: ${txt.slice(0, 300)}`);
      return json({ ok: false, reason: `lemon api ${r.status}` }, 502);
    }
    const body = await r.json();
    for (const o of body.data ?? []) {
      const attr = o.attributes ?? {};
      // email musí presne sedieť (filter LS je case-insensitive, istota)
      if ((attr.user_email ?? "").toLowerCase() !== email.toLowerCase()) continue;
      try {
        const res = await grantFromOrder(admin, user.id, { orderId: String(o.id), attr });
        results.push({ order: o.id, ...res });
      } catch (e) {
        errors.push(`order ${o.id}: ${(e as Error).message}`);
      }
    }
    url = body.links?.next ?? null;
  }

  if (errors.length) console.error("[lemon-sync]", errors.join(" | "));
  console.log(`[lemon-sync] user=${user.id} synced=${results.length}`);
  return json({ ok: errors.length === 0, synced: results, errors });
});
