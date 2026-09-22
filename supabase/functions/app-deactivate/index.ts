// ============================================================
// Alter — app-deactivate  (Supabase Edge Function, Deno)
//
// Uvoľní device slot pre prihláseného používateľa. Appka to volá pri
// "Odhlásiť toto zariadenie" / "Uvoľniť slot". Bez machine_id uvoľní
// zariadenie, z ktorého požiadavka prišla (ak ho appka pošle).
//
// Nasadenie:
//   supabase functions deploy app-deactivate --no-verify-jwt
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ error: "missing_token" }, 401);

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "invalid_token" }, 401);
  const user = userData.user;

  let body: any = {};
  try { body = await req.json(); } catch { /* OK */ }
  const machineId: string = String(body.machine_id ?? "").trim();
  if (!machineId) return json({ error: "missing_machine_id" }, 400);

  const { error } = await admin
    .from("devices")
    .delete()
    .eq("user_id", user.id)
    .eq("machine_id", machineId);
  if (error) return json({ error: "db_error", detail: error.message }, 500);

  const { count } = await admin
    .from("devices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return json({ ok: true, slots_used: count ?? 0 });
});
