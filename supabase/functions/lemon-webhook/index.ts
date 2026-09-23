// ============================================================
// Lemon Squeezy → Supabase webhook  (Supabase Edge Function, Deno)
//
// Po platbe Lemon Squeezy pošle POST sem a my zapíšeme objednávku + licenciu
// (plán podľa variantu: demo / listener / creator / pro) k správnemu užívateľovi.
//
// Nasadenie (verify_jwt=false je aj v supabase/config.toml, takže flag netreba):
//   supabase functions deploy lemon-webhook
//
// Diagnostika: otvor v prehliadači
//   https://<projekt>.supabase.co/functions/v1/lemon-webhook
//   → ukáže, či je nastavený LEMON_WEBHOOK_SECRET a aké varianty pozná.
//   Ak namiesto JSON uvidíš {"msg":"Missing authorization header"}, funkcia je
//   nasadená S overovaním JWT a Lemon Squeezy dostáva 401 → licencie nevzniknú.
//
// Secrets: LEMON_WEBHOOK_SECRET (Signing secret z LS webhooku),
//          voliteľne LS_VARIANT_DEMO / _LISTENER / _CREATOR / _PRO
// ============================================================

import {
  adminClient,
  findUserIdByEmail,
  grantFromOrder,
  resolvePlan,
  upsertBy,
  makeLicenseKey,
  variantMap,
  PLAN_NAME,
} from "../_shared/licensing.ts";

const WEBHOOK_SECRET = (Deno.env.get("LEMON_WEBHOOK_SECRET") ?? "").trim();
const admin = adminClient();

async function verifySignature(raw: string, signature: string): Promise<boolean> {
  if (!WEBHOOK_SECRET || !signature) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(raw));
  const digest = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const sig = signature.trim().toLowerCase();
  if (digest.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < digest.length; i++) diff |= digest.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });

Deno.serve(async (req) => {
  // --- health check (bez citlivých údajov) ---
  if (req.method === "GET") {
    return json({
      ok: true,
      function: "lemon-webhook",
      webhook_secret_set: WEBHOOK_SECRET.length > 0,
      service_role_set: Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
      variants: variantMap(),
    });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  const signature = req.headers.get("X-Signature") ?? "";
  if (!(await verifySignature(raw, signature))) {
    console.error(
      "[lemon-webhook] NEPLATNÝ PODPIS – LEMON_WEBHOOK_SECRET v Supabase sa nezhoduje so " +
        "'Signing secret' webhooku v Lemon Squeezy (pozor: Test a Live mode majú iný webhook). " +
        `secret_set=${WEBHOOK_SECRET.length > 0}`,
    );
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const eventName: string = payload?.meta?.event_name ?? "";
  const testMode: boolean = payload?.meta?.test_mode ?? false;
  const custom = payload?.meta?.custom_data ?? {};
  const attr = payload?.data?.attributes ?? {};
  const buyerEmail: string | undefined = attr.user_email ?? custom.email;
  console.log(
    `[lemon-webhook] ${eventName} id=${payload?.data?.id} test_mode=${testMode} ` +
      `custom_user_id=${custom.user_id ?? "-"} email=${buyerEmail ?? "-"}`,
  );

  // user_id z checkoutu, inak párovanie podľa emailu
  let userId: string | null = (custom.user_id ?? custom.userId ?? null) as string | null;
  if (userId) {
    const { data: u, error } = await admin.auth.admin.getUserById(userId);
    if (error || !u?.user) {
      console.warn(`[lemon-webhook] user_id ${userId} neexistuje, skúšam email`);
      userId = null;
    }
  }
  if (!userId) userId = await findUserIdByEmail(admin, buyerEmail);

  if (!userId) {
    // 200, aby LS neopakoval donekonečna; lemon-sync to dorovná, keď sa človek
    // zaregistruje/prihlási s tým istým emailom.
    console.warn(`[lemon-webhook] ${eventName}: žiadny účet pre email=${buyerEmail ?? "?"}`);
    return new Response("ok (no user match)", { status: 200 });
  }

  try {
    switch (eventName) {
      case "order_created": {
        const res = await grantFromOrder(admin, userId, {
          orderId: String(payload.data.id),
          attr,
        });
        console.log(`[lemon-webhook] order → plan=${res.plan} license=${res.license} user=${userId}`);
        break;
      }

      case "order_refunded": {
        const orderId = String(payload.data.id);
        await admin.from("orders").update({ status: "refunded" }).eq("ls_order_id", orderId);
        await admin.from("licenses").update({ status: "refunded" }).eq("ls_order_id", orderId);
        break;
      }

      case "subscription_created":
      case "subscription_updated": {
        const subId = String(payload.data.id);
        const plan = resolvePlan(attr.variant_id, attr.variant_name, attr.product_name);
        if (!plan) throw new Error(`Neznámy variant ${attr.variant_id} (${attr.product_name})`);
        const statusMap: Record<string, string> = {
          active: "active",
          on_trial: "active",
          paused: "cancelled",
          past_due: "active",
          unpaid: "expired",
          cancelled: "cancelled",
          expired: "expired",
        };
        await upsertBy(
          admin,
          "licenses",
          "ls_subscription_id",
          subId,
          {
            user_id: userId,
            plan,
            product_name: PLAN_NAME[plan],
            status: statusMap[attr.status] ?? "active",
            period_type: "subscription",
            renews_at: attr.renews_at ?? null,
            ends_at: attr.ends_at ?? null,
            customer_portal_url: attr.urls?.customer_portal ?? null,
            card_brand: attr.card_brand ?? null,
            card_last_four: attr.card_last_four ?? null,
            ls_subscription_id: subId,
            ls_variant_id: attr.variant_id != null ? String(attr.variant_id) : null,
          },
          { license_key: makeLicenseKey(), activations_used: 0, activations_limit: 3 },
        );
        break;
      }

      case "subscription_cancelled": {
        await admin
          .from("licenses")
          .update({ status: "cancelled", ends_at: attr.ends_at ?? null })
          .eq("ls_subscription_id", String(payload.data.id));
        break;
      }

      case "subscription_expired": {
        await admin
          .from("licenses")
          .update({ status: "expired" })
          .eq("ls_subscription_id", String(payload.data.id));
        break;
      }

      default:
        console.log(`[lemon-webhook] nespracovaný event: ${eventName}`);
    }
  } catch (err) {
    console.error(`[lemon-webhook] CHYBA pri ${eventName}:`, (err as Error).message ?? err);
    return new Response(`processing error: ${(err as Error).message ?? err}`, { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
