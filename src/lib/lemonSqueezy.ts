// Lemon Squeezy checkout — bez vlastného backendu.
// Skopíruj sem "checkout" (buy link) URL z Lemon Squeezy:
//   Dashboard → Store → Products → daný variant → Share → "Copy checkout URL"
// Vyzerá napr. takto:
//   https://quantryx.lemonsqueezy.com/buy/1a2b3c4d-....
// Kľúč = plan.id (demo | listener | creator | pro) z src/lib/products.ts
export const lemonCheckoutUrls: Record<string, string> = {
  // Demo = dobrovoľný príspevok (PWYW, min 0). Nákup Demo nedá platený tier
  // (webhook ho zapíše ako plan 'demo'), je to len donation.
  demo:     "https://quantryxstudio.lemonsqueezy.com/checkout/buy/a79d7129-1f6a-4e54-bf0b-44231781a5c6?enabled=2155356",
  listener: "https://quantryxstudio.lemonsqueezy.com/checkout/buy/23703730-d011-4431-b789-164b12d1cf2c?enabled=2155812",
  creator:  "https://quantryxstudio.lemonsqueezy.com/checkout/buy/ee375fd4-cff7-47ce-bdc2-9858d6a9f44b?enabled=2155819",
  pro:      "https://quantryxstudio.lemonsqueezy.com/checkout/buy/766ca182-0106-4354-98b1-72ed8c29cfc4?enabled=2155829",
};

type LemonWindow = Window & {
  LemonSqueezy?: { Url?: { Open?: (url: string) => void } };
};

export function isLemonConfigured(planId: string): boolean {
  return Boolean(lemonCheckoutUrls[planId]);
}

/**
 * Otvorí Lemon Squeezy checkout. Ak je načítané lemon.js, otvorí sa ako overlay
 * (bez opustenia stránky); inak sa otvorí v novej karte. Vracia false, ak pre
 * daný plán nie je nastavený žiadny link.
 */
export function openLemonCheckout(
  planId: string,
  opts: { email?: string; userId?: string } = {}
): boolean {
  const base = lemonCheckoutUrls[planId];
  if (!base) return false;

  const url = new URL(base);
  url.searchParams.set("embed", "1");
  url.searchParams.set("media", "0");
  if (opts.email) url.searchParams.set("checkout[email]", opts.email);
  if (opts.userId) url.searchParams.set("checkout[custom][user_id]", opts.userId);

  const w = window as LemonWindow;
  const open = w.LemonSqueezy?.Url?.Open;
  if (typeof open === "function") {
    open(url.toString());
  } else {
    window.open(url.toString(), "_blank", "noopener");
  }
  return true;
}
