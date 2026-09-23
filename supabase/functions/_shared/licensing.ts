// ============================================================
// Spoločná licenčná logika pre lemon-webhook aj lemon-sync.
// Jeden zdroj pravdy: variant ID → plán, názvy produktov, zápis licencie.
// ============================================================

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

export type Plan = "demo" | "listener" | "creator" | "pro";

export const PLAN_NAME: Record<Plan, string> = {
  demo: "Alter Demo",
  listener: "Alter Listener",
  creator: "Alter Creator",
  pro: "Alter Pro",
};

export const TIER_RANK: Record<string, number> = { demo: 0, listener: 1, creator: 2, pro: 3 };

// ---------- variant ID (Lemon Squeezy) → plán ----------
const VARIANT_TO_PLAN: Record<string, Plan> = {};
const addVariant = (id: string | undefined | null, plan: Plan) => {
  const v = (id ?? "").trim();
  if (v) VARIANT_TO_PLAN[v] = plan;
};
// Známe variant ID (rovnaké ako ?enabled=… v src/lib/lemonSqueezy.ts)
addVariant("2155356", "demo");
addVariant("2155812", "listener");
addVariant("2155819", "creator");
addVariant("2155829", "pro");
// Voliteľne ďalšie ID cez secrets (napr. Live mode má iné ID). Hodnota môže
// obsahovať viac ID oddelených čiarkou.
for (const plan of ["demo", "listener", "creator", "pro"] as Plan[]) {
  const raw = Deno.env.get(`LS_VARIANT_${plan.toUpperCase()}`) ?? "";
  raw.split(",").forEach((id) => addVariant(id, plan));
}

export function variantMap() {
  return { ...VARIANT_TO_PLAN };
}

/**
 * Určí plán z objednávky. Poradie: variant ID → názov variantu/produktu.
 * Vracia null, ak sa plán nedá určiť (NIKDY potichu nepadá na "demo").
 */
export function resolvePlan(
  variantId: unknown,
  variantName?: string | null,
  productName?: string | null,
): Plan | null {
  const id = variantId == null ? "" : String(variantId);
  if (VARIANT_TO_PLAN[id]) return VARIANT_TO_PLAN[id];
  // záloha podľa názvu (napr. "Alter Pro", "Pro", "Creator edition"…)
  const hay = `${variantName ?? ""} ${productName ?? ""}`.toLowerCase();
  for (const plan of ["pro", "creator", "listener", "demo"] as Plan[]) {
    if (new RegExp(`\\b${plan}\\b`).test(hay)) return plan;
  }
  return null;
}

export function makeLicenseKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = new Uint32Array(12);
  crypto.getRandomValues(buf);
  const ch = [...buf].map((n) => alphabet[n % alphabet.length]);
  return `ALTR-${ch.slice(0, 4).join("")}-${ch.slice(4, 8).join("")}-${ch.slice(8, 12).join("")}`;
}

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Zápis bez PostgREST onConflict (naše unique indexy sú PARTIAL → 42P10).
export async function upsertBy(
  admin: SupabaseClient,
  table: string,
  keyCol: string,
  keyVal: string,
  row: Record<string, unknown>,
  insertOnly: Record<string, unknown> = {},
): Promise<"inserted" | "updated"> {
  const { data: existing, error: selErr } = await admin
    .from(table)
    .select("id")
    .eq(keyCol, keyVal)
    .limit(1);
  if (selErr) throw new Error(`${table} select(${keyCol}=${keyVal}): ${selErr.message}`);
  if (existing && existing.length > 0) {
    const { error } = await admin.from(table).update(row).eq("id", existing[0].id);
    if (error) throw new Error(`${table} update: ${error.message}`);
    return "updated";
  }
  const { error } = await admin.from(table).insert({ ...row, ...insertOnly });
  if (error) throw new Error(`${table} insert: ${error.message}`);
  return "inserted";
}

/** Nájde user_id podľa emailu (profiles, potom auth.users). */
export async function findUserIdByEmail(
  admin: SupabaseClient,
  email: string | undefined | null,
): Promise<string | null> {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return null;
  const { data } = await admin.from("profiles").select("id").ilike("email", e).limit(1);
  if (data && data.length > 0) return data[0].id as string;
  // záloha: auth.users (profil nemusí mať email vyplnený)
  for (let page = 1; page <= 10; page++) {
    const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !list?.users?.length) break;
    const hit = list.users.find((u) => (u.email ?? "").toLowerCase() === e);
    if (hit) return hit.id;
    if (list.users.length < 1000) break;
  }
  return null;
}

/** Normalizovaná objednávka (z webhooku aj z LS API majú rovnaké attributes). */
export interface OrderInput {
  orderId: string;
  attr: Record<string, any>; // data.attributes objednávky z Lemon Squeezy
}

/**
 * Zapíše objednávku do `orders` a (pri jednorazovom nákupe) licenciu do `licenses`.
 * Vracia plán, ktorý bol pridelený.
 */
export async function grantFromOrder(
  admin: SupabaseClient,
  userId: string,
  { orderId, attr }: OrderInput,
): Promise<{ plan: Plan; license: "inserted" | "updated" | "skipped" }> {
  const item = attr.first_order_item ?? {};
  const plan = resolvePlan(item.variant_id, item.variant_name, item.product_name);
  if (!plan) {
    throw new Error(
      `Neznámy variant ${item.variant_id} (${item.product_name} / ${item.variant_name}). ` +
        `Pridaj ho do LS_VARIANT_* secrets alebo do _shared/licensing.ts.`,
    );
  }
  const productName = PLAN_NAME[plan]; // názov vždy podľa skutočného plánu
  const total = (attr.total ?? 0) / 100;
  const currency = attr.currency ?? "EUR";
  const lsStatus: string = attr.status ?? "paid";
  const refunded = attr.refunded === true || lsStatus === "refunded";
  const orderStatus = refunded ? "refunded" : lsStatus === "pending" ? "pending" : "paid";

  await upsertBy(admin, "orders", "ls_order_id", orderId, {
    user_id: userId,
    plan,
    product_name: productName,
    total,
    currency,
    status: orderStatus,
    invoice_url: attr.urls?.receipt ?? null,
    card_brand: attr.card_brand ?? null,
    card_last_four: attr.card_last_four ?? null,
    ls_order_id: orderId,
    order_number: attr.order_number ? String(attr.order_number) : null,
    ordered_at: attr.created_at ?? new Date().toISOString(),
  });

  // predplatné rieši subscription_* event; nezaplatené (failed/pending) licenciu nedostane
  if (attr.subscription_id != null || !["paid", "refunded"].includes(lsStatus)) {
    return { plan, license: "skipped" };
  }

  const license = await upsertBy(
    admin,
    "licenses",
    "ls_order_id",
    orderId,
    {
      user_id: userId,
      plan,
      product_name: productName,
      status: refunded ? "refunded" : "active",
      period_type: "oneTime",
      price_paid: total,
      currency,
      card_brand: attr.card_brand ?? null,
      card_last_four: attr.card_last_four ?? null,
      ls_order_id: orderId,
      ls_variant_id: item.variant_id != null ? String(item.variant_id) : null,
      purchased_at: attr.created_at ?? new Date().toISOString(),
    },
    { license_key: makeLicenseKey(), activations_used: 0, activations_limit: 3 },
  );
  return { plan, license };
}
