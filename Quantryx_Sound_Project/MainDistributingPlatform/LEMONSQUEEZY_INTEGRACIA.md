# Lemon Squeezy – platby (bez vlastného backendu)

Platby riešime cez **Lemon Squeezy** (Merchant of Record – rieši DPH/faktúry,
výhodné pre indie/študentov). Nepotrebuješ vlastný server na checkout.

## 1. Vytvor produkty
V Lemon Squeezy: **Store → Products → New Product**. Pre každý plán vytvor
produkt/variant s cenou:
- `listener` – 15 €
- `creator` – 15 €
- `pro` – 25 €
(`demo` je zdarma – bez checkoutu.)

## 2. Skopíruj checkout linky
Pri každom variante: **Share → Copy checkout URL**
(vyzerá `https://TVOJSTORE.lemonsqueezy.com/buy/xxxxxxxx-....`).

Vlož ich do `src/lib/lemonSqueezy.ts`:
```ts
export const lemonCheckoutUrls = {
  demo: "",
  listener: "https://TVOJSTORE.lemonsqueezy.com/buy/....",
  creator:  "https://TVOJSTORE.lemonsqueezy.com/buy/....",
  pro:      "https://TVOJSTORE.lemonsqueezy.com/buy/....",
};
```
Hotovo – tlačidlo na `/checkout` otvorí bezpečný Lemon Squeezy overlay
(cez `lemon.js`, ktoré je už načítané v `index.html`). E-mail prihláseného
používateľa a jeho `user_id` sa predvyplnia automaticky.

## 3. Automatické doručenie licencie (webhook)
Toto už je hotové – Edge Function `supabase/functions/lemon-webhook/`
po platbe zapíše reálnu licenciu + objednávku k používateľovi, takže sa
zobrazia v sekcii **Môj profil**.

### 3a. Nasadenie funkcie
```bash
supabase functions deploy lemon-webhook --no-verify-jwt
```

### 3b. Secrets (Supabase → Project Settings → Edge Functions → Secrets)
- `LEMON_WEBHOOK_SECRET` – „Signing secret" z webhooku (krok 3c)
- `LS_VARIANT_LISTENER`, `LS_VARIANT_CREATOR`, `LS_VARIANT_PRO`
  – variant ID jednotlivých plánov (Lemon Squeezy → Product → variant → …).
  Podľa nich webhook rozpozná, ktorý plán si zákazník kúpil.

`SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY` dopĺňa Supabase automaticky.

### 3c. Registruj webhook v Lemon Squeezy
Settings → Webhooks → **+** →
- **URL:** `https://<project-ref>.functions.supabase.co/lemon-webhook`
- **Events:** `order_created`, `order_refunded`, `subscription_created`,
  `subscription_updated`, `subscription_cancelled`, `subscription_expired`
- Skopíruj **Signing secret** do `LEMON_WEBHOOK_SECRET`.

Dôležité: `user_id` prihláseného zákazníka sa do checkoutu posiela automaticky
(`checkout[custom][user_id]` v `src/lib/lemonSqueezy.ts`), webhook podľa neho
priradí nákup správnemu účtu.

## Platobné metódy (Google Pay, Apple Pay, PayPal…)
Netreba nič programovať. Lemon Squeezy má na každom store automaticky zapnuté
**Google Pay, Apple Pay, PayPal a karty** (platí aj pre predplatné). Google Pay
sa v checkoute zobrazí sám, keď zákazník príde z podporovaného zariadenia/
prehliadača (napr. Chrome s nastaveným Google Pay) cez HTTPS. Náš embedded
overlay checkout ich podporuje.

Over si len: **Settings → Payment methods** – Google Pay/Apple Pay majú byť
zapnuté (predvolene áno). Na localhoste sa Google Pay nemusí zobraziť
(chýba HTTPS/doména) – otestuj na nasadenom preview (Netlify) alebo v Live.

## URL stránky pri registrácii / vývoji
Vlastnú webstránku **nepotrebuješ**. Pri registrácii dostaneš zadarmo subdoménu
(napr. `quantryx.lemonsqueezy.com`) a nový store je automaticky v **Test mode**.

- **Webhook URL** = Supabase Edge Function (`https://<ref>.functions.supabase.co/
  lemon-webhook`). Je verejná a hostuje ju Supabase, takže funguje aj počas
  vývoja na localhoste – **nepotrebuješ ngrok ani nasadený web**.
- **„Website" pole** pri aktivácii store na Live vyplň až keď budeš spúšťať
  ostro – daj plánovanú doménu alebo Netlify/Vercel preview URL.

## Test mód
Nový store je v **Test mode** predvolene – checkout funguje s testovacími
kartami (napr. `4242 4242 4242 4242`), API kľúče v test móde pracujú len
s test dátami. Pred spustením prepni na **Live**, vytvor Live API kľúč
a vymeň checkout linky za Live verziu.
