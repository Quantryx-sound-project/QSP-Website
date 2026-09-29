// Lemon Squeezy checkout — bez vlastného backendu.
// Skopíruj sem "checkout" (buy link) URL z Lemon Squeezy:
//   Dashboard → Store → Products → daný variant → Share → "Copy checkout URL"
// Vyzerá napr. takto:
//   https://quantryx.lemonsqueezy.com/buy/1a2b3c4d-....
// Kľúč = plan.id (demo | listener | creator | pro) z src/lib/products.ts
export const lemonCheckoutUrls: Record<string, string> = {
  // Demo = dobrovoľný príspevok (PWYW, min 0). Nákup Demo nedá platený tier
  // (webhook ho zapíše ako plan 'demo'), je to len donation.
  demo:     "https://quantryxstudio.lemonsqueezy.com/checkout/buy/bcf31942-fb56-4cb1-ad7b-2f8fb248fbbc?enabled=2183586",
  listener: "https://quantryxstudio.lemonsqueezy.com/checkout/buy/83ad3ba9-9fe4-4d17-a5e5-897432f4ca3e?enabled=2183587",
  creator:  "https://quantryxstudio.lemonsqueezy.com/checkout/buy/14578a4b-155f-4641-a3a8-60f50a1fc84d?enabled=2183588",
  pro:      "https://quantryxstudio.lemonsqueezy.com/checkout/buy/8f2d5851-bb03-4285-bb94-ab5d1db1323b?enabled=2183589",
};

type LemonWindow = Window & {
  LemonSqueezy?: {
    Url?: { Open?: (url: string) => void };
    Setup?: (opts: { eventHandler: (e: { event?: string }) => void }) => void;
  };
  createLemonSqueezy?: () => void;
};

// Po úspešnej platbe (overlay) presmeruj používateľa rovno k jeho licencii
// (Dashboard → sekcia licencií). Nastaví sa raz.
let successHandlerReady = false;
function ensureSuccessRedirect() {
  const w = window as LemonWindow;
  if (!w.LemonSqueezy && typeof w.createLemonSqueezy === "function") w.createLemonSqueezy();
  if (successHandlerReady || !w.LemonSqueezy?.Setup) return;
  successHandlerReady = true;
  w.LemonSqueezy.Setup({
    eventHandler: (e) => {
      if (e?.event === "Checkout.Success") {
        window.location.href = "/dashboard?checkout=success#licenses";
      }
    },
  });
}

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
  ensureSuccessRedirect();
  // Ak sa checkout otvorí v novej karte (bez overlay), po návrate na túto kartu
  // pošleme používateľa do profilu, kde sa licencia automaticky dorovná.
  if (typeof w.LemonSqueezy?.Url?.Open !== "function") {
    const onReturn = () => {
      if (document.visibilityState === "visible") {
        document.removeEventListener("visibilitychange", onReturn);
        window.location.href = "/dashboard?checkout=success#licenses";
      }
    };
    setTimeout(() => document.addEventListener("visibilitychange", onReturn), 1500);
  }
  const open = w.LemonSqueezy?.Url?.Open;
  if (typeof open === "function") {
    open(url.toString());
  } else {
    window.open(url.toString(), "_blank", "noopener");
  }
  return true;
}
