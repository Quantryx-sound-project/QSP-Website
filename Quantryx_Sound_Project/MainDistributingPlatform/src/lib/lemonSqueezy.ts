// Lemon Squeezy checkout — bez vlastného backendu.
// Skopíruj sem "checkout" (buy link) URL z Lemon Squeezy:
//   Dashboard → Store → Products → daný variant → Share → "Copy checkout URL"
// Vyzerá napr. takto:
//   https://quantryx.lemonsqueezy.com/buy/1a2b3c4d-....
// Kľúč = plan.id (demo | listener | creator | pro) z src/lib/products.ts
export const lemonCheckoutUrls: Record<string, string> = {
  demo: "", // zdarma – bez platby
  listener: "",
  creator: "",
  pro: "",
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
