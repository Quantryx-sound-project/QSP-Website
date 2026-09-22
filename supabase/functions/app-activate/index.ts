// ============================================================
// Alter — app-activate  (Supabase Edge Function, Deno)
//
// Login-based aktivácia appky. Appka po prihlásení (email+heslo cez Supabase
// Auth) pošle sem svoj JWT + machine_id. My:
//   1. z JWT zistíme používateľa,
//   2. nájdeme jeho najvyššiu platnú licenciu -> tier,
//   3. skontrolujeme device sloty (limit = activations_limit, default 3),
//   4. zaregistrujeme/aktualizujeme toto zariadenie,
//   5. vrátime tier + metadáta, ktoré si appka podpíše do license.dat.
//
// LS licenčné kľúče sa NEPOUŽÍVAJÚ. Zdroj pravdy je tabuľka licenses
// (napĺňa ju lemon-webhook). Toto je jediná aktivačná autorita.
//
// Nasadenie:
//   supabase functions deploy app-activate --no-verify-jwt
//   (JWT overujeme sami cez auth.getUser, aby sme dostali user_id)
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Supabase dopĺňa sám)
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REVALIDATE_AFTER_DAYS = 7;   // musí sedieť s kRevalidateEveryDays v appke
const GRACE_DAYS = 30;             // musí sedieť s kOfflineGraceDays v appke
const DEFAULT_SLOT_LIMIT = 3;

const TIER_RANK: Record<string, number> = { demo: 0, listener: 1, creator: 2, pro: 3 };

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

// licencia platí, ak je 'active', alebo 'cancelled' ale ešte beží do ends_at
function isUsable(l: any): boolean {
  if (l.status === "active") return true;
  if (l.status === "cancelled" && l.ends_at && new Date(l.ends_at) > new Date()) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // --- identifikuj používateľa z JWT ---
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ error: "missing_token" }, 401);

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "invalid_token" }, 401);
  const user = userData.user;

  // --- telo ---
  let body: any = {};
  try { body = await req.json(); } catch { /* prázdne telo OK */ }
  const machineId: string = String(body.machine_id ?? "").trim();
  if (!machineId) return json({ error: "missing_machine_id" }, 400);
  const machineName: string | null = body.machine_name ?? null;
  const platform: string | null = body.platform ?? null;
  const appVersion: string | null = body.app_version ?? null;

  // --- nájdi najvyššiu platnú licenciu ---
  const { data: licenses, error: licErr } = await admin
    .from("licenses")
    .select("id, plan, status, period_type, ends_at, activations_limit, product_name")
    .eq("user_id", user.id);
  if (licErr) return json({ error: "db_error", detail: licErr.message }, 500);

  const usable = (licenses ?? []).filter(isUsable);
  usable.sort((a, b) => (TIER_RANK[b.plan] ?? 0) - (TIER_RANK[a.plan] ?? 0));
  const best = usable[0];

  const nowIso = new Date().toISOString();

  // žiadna platná licencia -> appka beží v Demo, zariadenie neregistrujeme
  if (!best) {
    return json({
      tier: "demo",
      reason: "no_active_license",
      email: user.email ?? null,
      server_time: nowIso,
      revalidate_after_days: REVALIDATE_AFTER_DAYS,
      grace_days: GRACE_DAYS,
    });
  }

  const slotLimit = best.activations_limit && best.activations_limit > 0
    ? best.activations_limit : DEFAULT_SLOT_LIMIT;

  // --- device sloty (per používateľ) ---
  const { data: devices, error: devErr } = await admin
    .from("devices")
    .select("id, machine_id")
    .eq("user_id", user.id);
  if (devErr) return json({ error: "db_error", detail: devErr.message }, 500);

  const existing = (devices ?? []).find((d) => d.machine_id === machineId);

  if (existing) {
    await admin.from("devices")
      .update({ last_seen: nowIso, machine_name: machineName, platform, app_version: appVersion })
      .eq("id", existing.id);
  } else {
    if ((devices?.length ?? 0) >= slotLimit) {
      return json({
        error: "device_limit",
        slots_used: devices?.length ?? 0,
        slots_limit: slotLimit,
        tier: "demo",
      }, 409);
    }
    const { error: insErr } = await admin.from("devices").insert({
      user_id: user.id,
      machine_id: machineId,
      machine_name: machineName,
      platform,
      app_version: appVersion,
      last_seen: nowIso,
    });
    if (insErr) return json({ error: "db_error", detail: insErr.message }, 500);
  }

  // drž activations_used synchronizované (len na zobrazenie v profile)
  const { count } = await admin
    .from("devices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const slotsUsed = count ?? (existing ? (devices?.length ?? 1) : (devices?.length ?? 0) + 1);
  await admin.from("licenses").update({ activations_used: slotsUsed }).eq("id", best.id);

  return json({
    tier: best.plan,                       // "listener" | "creator" | "pro"
    plan: best.plan,
    product_name: best.product_name ?? null,
    status: best.status,
    period_type: best.period_type,
    ends_at: best.ends_at ?? null,         // null = lifetime / oneTime
    email: user.email ?? null,
    slots_used: slotsUsed,
    slots_limit: slotLimit,
    server_time: nowIso,
    revalidate_after_days: REVALIDATE_AFTER_DAYS,
    grace_days: GRACE_DAYS,
  });
});
