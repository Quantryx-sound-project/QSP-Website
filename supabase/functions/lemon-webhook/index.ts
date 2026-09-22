// ============================================================
// Lemon Squeezy → Supabase webhook  (Supabase Edge Function, Deno)
//
// Po platbe Lemon Squeezy pošle POST na túto funkciu a my z neho
// zapíšeme reálnu licenciu + objednávku k správnemu užívateľovi.
//
// Spracované eventy:
//   order_created           → nová objednávka + (pri jednorazovom pláne) licencia
//   order_refunded          → objednávka + licencia označené ako refunded
//   subscription_created    → licencia typu subscription (renews_at, portal URL)
//   subscription_updated    → aktualizácia stavu / dátumu obnovy
//   subscription_cancelled  → status 'cancelled' (beží do konca obdobia)
//   subscription_expired    → status 'expired'
//
// Nasadenie:
//   supabase functions deploy lemon-webhook --no-verify-jwt
// Premenné (Project Settings → Edge Functions → Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (Supabase dopĺňa automaticky)
//   LEMON_WEBHOOK_SECRET     – "Signing secret" z Lemon Squeezy webhooku
//   LS_VARIANT_LISTENER, LS_VARIANT_CREATOR, LS_VARIANT_PRO
//                            – variant ID z Lemon Squeezy (na mapovanie na plán)
//
// V Lemon Squeezy: Settings → Webhooks → + → URL tejto funkcie, vyber eventy
// vyššie, skopíruj signing secret do LEMON_WEBHOOK_SECRET.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("LEMON_WEBHOOK_SECRET") ?? "";

// variant ID (Lemon Squeezy) → náš plán
const VARIANT_TO_PLAN: Record<string, "demo" | "listener" | "creator" | "pro"> = {};
const addVariant = (id: string | undefined, plan: "demo" | "listener" | "creator" | "pro") => {
  if (id) VARIANT_TO_PLAN[id] = plan;
};
// Známe variant ID (test mode) — natvrdo, aby mapovanie fungovalo aj bez secrets.
addVariant("2155356", "demo");
addVariant("2155812", "listener");
addVariant("2155819", "creator");
addVariant("2155829", "pro");
// Voliteľné prepísanie cez secrets (napr. pri prechode na Live s inými ID):
addVariant(Deno.env.get("LS_VARIANT_DEMO"), "demo");
addVariant(Deno.env.get("LS_VARIANT_LISTENER"), "listener");
addVariant(Deno.env.get("LS_VARIANT_CREATOR"), "creator");
addVariant(Deno.env.get("LS_VARIANT_PRO"), "pro");
console.log("[lemon-webhook] VARIANT_TO_PLAN =", JSON.stringify(VARIANT_TO_PLAN));

const PLAN_NAME: Record<string, string> = {
  demo: "Alter Demo",
  listener: "Alter Listener",
  creator: "Alter Creator",
  pro: "Alter Pro",
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------- overenie HMAC podpisu ----------
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
  // porovnanie odolné voči časovému úniku
  if (digest.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < digest.length; i++) diff |= digest.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

// jednoduchý generátor licenčného kľúča: ALTR-XXXX-XXXX-XXXX
function makeLicenseKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `ALTR-${block()}-${block()}-${block()}`;
}

function planFromVariant(variantId: unknown): "demo" | "listener" | "creator" | "pro" | null {
  const id = variantId == null ? "" : String(variantId);
  return VARIANT_TO_PLAN[id] ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const raw = await req.text();
  const signature = req.headers.get("X-Signature") ?? "";

  if (!(await verifySignature(raw, signature))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const eventName: string = payload?.meta?.event_name ?? "";
  const custom = payload?.meta?.custom_data ?? {};
  const attr = payload?.data?.attributes ?? {};
  let userId: string | undefined = custom.user_id ?? custom.userId;
  const buyerEmail: string | undefined = attr.user_email ?? custom.email;

  // Fallback: ak z checkoutu neprišlo user_id (napr. hosted checkout alebo
  // nezachytené custom data), napárujeme kupujúceho podľa emailu na profiles.
  if (!userId && buyerEmail) {
    const { data: prof, error: profErr } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", buyerEmail)
      .maybeSingle();
    if (profErr) console.warn("[lemon-webhook] profiles lookup error:", profErr.message);
    if (prof?.id) {
      userId = prof.id as string;
      console.log("[lemon-webhook] user_id doplnené podľa emailu:", buyerEmail);
    }
  }

  // bez user_id ani emailovej zhody nevieme licenciu priradiť
  if (!userId) {
    console.warn(`[lemon-webhook] ${eventName}: žiadne user_id ani email match (email=${buyerEmail ?? "?"}), preskakujem`);
    return new Response("ok (no user match)", { status: 200 });
  }

  try {
    switch (eventName) {
      case "order_created": {
        const orderId = String(payload.data.id);
        const total = (attr.total ?? 0) / 100; // centy → jednotky
        const currency = attr.currency ?? "EUR";
        const firstItem = attr.first_order_item ?? {};
        const variantId = firstItem.variant_id;
        const plan = planFromVariant(variantId) ?? "demo";
        console.log("[lemon-webhook] order_created variant_id=", String(variantId), "plan=", plan, "subscription_id=", String(attr.subscription_id));
        const productName = firstItem.product_name ?? PLAN_NAME[plan];

        // 1) objednávka do histórie
        await admin.from("orders").upsert(
          {
            user_id: userId,
            plan,
            product_name: productName,
            total,
            currency,
            status: attr.refunded ? "refunded" : "paid",
            invoice_url: attr.urls?.receipt ?? null,
            card_brand: attr.card_brand ?? null,
            card_last_four: attr.card_last_four ?? null,
            ls_order_id: orderId,
            order_number: attr.order_number ? String(attr.order_number) : null,
            ordered_at: attr.created_at ?? new Date().toISOString(),
          },
          { onConflict: "ls_order_id" },
        );

        // 2) jednorazová licencia (subscription rieši subscription_created)
        if (attr.subscription_id == null) {
          await admin.from("licenses").upsert(
            {
              user_id: userId,
              plan,
              product_name: productName,
              status: "active",
              period_type: "oneTime",
              license_key: makeLicenseKey(),
              activations_used: 0,
              activations_limit: 3,
              price_paid: total,
              currency,
              card_brand: attr.card_brand ?? null,
              card_last_four: attr.card_last_four ?? null,
              ls_order_id: orderId,
              ls_variant_id: variantId ? String(variantId) : null,
              purchased_at: attr.created_at ?? new Date().toISOString(),
            },
            { onConflict: "ls_order_id" },
          );
        }
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
        const variantId = attr.variant_id;
        const plan = planFromVariant(variantId) ?? "demo";
        console.log("[lemon-webhook] subscription variant_id=", String(variantId), "plan=", plan);
        const productName = attr.product_name ?? PLAN_NAME[plan];

        const statusMap: Record<string, string> = {
          active: "active",
          on_trial: "active",
          paused: "cancelled",
          past_due: "active",
          unpaid: "expired",
          cancelled: "cancelled",
          expired: "expired",
        };
        const status = statusMap[attr.status] ?? "active";

        await admin.from("licenses").upsert(
          {
            user_id: userId,
            plan,
            product_name: productName,
            status,
            period_type: "subscription",
            license_key: eventName === "subscription_created" ? makeLicenseKey() : undefined,
            price_paid: undefined,
            currency: "EUR",
            renews_at: attr.renews_at ?? null,
            ends_at: attr.ends_at ?? null,
            customer_portal_url: attr.urls?.customer_portal ?? null,
            card_brand: attr.card_brand ?? null,
            card_last_four: attr.card_last_four ?? null,
            ls_subscription_id: subId,
            ls_variant_id: variantId ? String(variantId) : null,
          },
          { onConflict: "ls_subscription_id" },
        );
        break;
      }

      case "subscription_cancelled": {
        const subId = String(payload.data.id);
        await admin
          .from("licenses")
          .update({ status: "cancelled", ends_at: attr.ends_at ?? null })
          .eq("ls_subscription_id", subId);
        break;
      }

      case "subscription_expired": {
        const subId = String(payload.data.id);
        await admin.from("licenses").update({ status: "expired" }).eq("ls_subscription_id", subId);
        break;
      }

      default:
        console.log(`[lemon-webhook] nespracovaný event: ${eventName}`);
    }
  } catch (err) {
    console.error(`[lemon-webhook] chyba pri ${eventName}:`, err);
    return new Response("processing error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
