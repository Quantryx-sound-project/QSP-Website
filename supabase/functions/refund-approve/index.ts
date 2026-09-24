// ============================================================
// refund-approve  (Supabase Edge Function, Deno) — LEN PRE ADMINA
//
// Admin v /admin klikne "Schváliť a vrátiť peniaze". Funkcia:
//   1. overí, že volajúci je admin (profiles.is_admin),
//   2. cez Lemon Squeezy API vráti celú sumu objednávky,
//   3. žiadosť → 'refunded', licencia → 'refunded', objednávka → 'refunded'.
//   (Lemon Squeezy potom pošle aj webhook order_refunded — ten spraví to isté.)
//
// Nasadenie:  npx supabase functions deploy refund-approve --project-ref rocsxttousdashuavfut
// Secrets:    LEMON_API_KEY (ten istý ako pre lemon-sync)
// ============================================================

import { adminClient } from "../_shared/licensing.ts";

const API_KEY = (Deno.env.get("LEMON_API_KEY") ?? "").trim();
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

  // 1) je to admin?
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !auth?.user) return json({ error: "unauthorized" }, 401);
  const { data: prof } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!prof?.is_admin) return json({ error: "forbidden" }, 403);

  if (!API_KEY) return json({ error: "LEMON_API_KEY nie je nastavený v Supabase Secrets" }, 500);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* prázdne telo */
  }
  const requestId = String(body.request_id ?? "");
  const note: string | null = body.note ? String(body.note) : null;
  if (!requestId) return json({ error: "missing request_id" }, 400);

  const { data: rr, error: rrErr } = await admin
    .from("refund_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (rrErr || !rr) return json({ error: "request_not_found" }, 404);
  if (rr.status !== "pending") return json({ error: `request is ${rr.status}` }, 409);

  // 2) refund cez Lemon Squeezy (celá suma)
  const r = await fetch(`https://api.lemonsqueezy.com/v1/orders/${rr.ls_order_id}/refund`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ data: { type: "orders", id: String(rr.ls_order_id), attributes: {} } }),
  });
  if (!r.ok) {
    const txt = await r.text();
    console.error(`[refund-approve] LS ${r.status}: ${txt.slice(0, 400)}`);
    await admin
      .from("refund_requests")
      .update({ admin_note: `Lemon Squeezy chyba ${r.status}: ${txt.slice(0, 200)}` })
      .eq("id", requestId);
    return json({ error: `Lemon Squeezy odmietol refund (${r.status})`, detail: txt.slice(0, 400) }, 502);
  }

  // 3) zápis stavov
  const now = new Date().toISOString();
  await admin
    .from("refund_requests")
    .update({ status: "refunded", resolved_at: now, admin_note: note })
    .eq("id", requestId);
  await admin.from("licenses").update({ status: "refunded" }).eq("id", rr.license_id);
  await admin.from("orders").update({ status: "refunded" }).eq("ls_order_id", rr.ls_order_id);

  console.log(`[refund-approve] refunded order ${rr.ls_order_id} (request ${requestId})`);
  return json({ ok: true });
});
