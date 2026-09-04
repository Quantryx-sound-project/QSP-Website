// ============================================================
// Vlastná analytika – klientská časť.
//
// Neukladá NIČ do prehliadača: žiadne cookies, žiadny localStorage.
// ID relácie žije len v pamäti karty, návštevníka rozlišuje server
// cez denný hash. Preto netreba cookie lištu ani súhlas.
//
// Server: supabase/functions/track (Edge Function)
// ============================================================

import { supabase, supabaseConfigured } from "@/integrations/supabase/client";

export type AnalyticsEvent =
  | "page_view"
  | "click"
  | "sign_up"
  | "sign_in"
  | "checkout_start"
  | "purchase";

interface TrackPayload {
  path?: string;
  label?: string;
  props?: Record<string, unknown>;
}

/**
 * ID relácie. Zámerne len v pamäti – po obnovení stránky vznikne nové.
 * Mierne to nadhodnotí počet relácií, ale nezapíše to nič do zariadenia.
 */
const SESSION_ID = (() => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
})();

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL ?? ""}/functions/v1/track`;

/**
 * Odkiaľ človek prišiel. Zachytáva sa RAZ, pri načítaní aplikácie –
 * neskôr už v adrese utm parametre nie sú, lebo medzitým preklikal ďalej.
 * Drží sa len v pamäti karty, nikam sa neukladá.
 *
 * Použije sa pri registrácii: zapíše sa zákazníkovi do profilu, takže
 * navždy vieš, ktorý kanál ti priviedol platiaceho človeka.
 */
const ACQUISITION = (() => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  let referrerHost = "";
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (host && !host.endsWith("quantryxstudio.com")) referrerHost = host;
    }
  } catch {
    // neplatný referrer – ignorujeme
  }
  return {
    utm_source: params.get("utm_source") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
    referrer_host: referrerHost,
    landing_path: window.location.pathname,
  };
})();

/** Zdroj návštevy pre uloženie k novému účtu. */
export const acquisition = (): Record<string, string> => ({ ...ACQUISITION });

/** UTM parametre z adresy, ak nejaké sú. */
function utmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
    const value = params.get(key);
    if (value) out[key] = value;
  }
  return out;
}

/**
 * Pošle udalosť. Nikdy nevyhodí chybu a nikdy nezdrží stránku –
 * ak meranie zlyhá, návštevník o tom nemá vedieť.
 */
export async function track(event: AnalyticsEvent, payload: TrackPayload = {}): Promise<void> {
  if (typeof window === "undefined" || !supabaseConfigured) return;

  const body = JSON.stringify({
    event,
    session_id: SESSION_ID,
    path: payload.path ?? window.location.pathname,
    label: payload.label,
    referrer: document.referrer || undefined,
    ...utmParams(),
    props: payload.props ?? {},
  });

  try {
    // Ak je človek prihlásený, priložíme token, nech sa udalosť
    // dá priradiť k účtu. Server si ho overí sám.
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      keepalive: true,
    });
  } catch {
    // Ticho. Výpadok merania nesmie ovplyvniť web.
  }
}

/** Skratka pre kliky na tlačidlá. */
export const trackClick = (label: string, props?: Record<string, unknown>) =>
  void track("click", { label, props });
