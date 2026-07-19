# Prepojenie Stripe (návod na neskôr)

Tento dokument vysvetľuje, ako neskôr napojíme platby cez Stripe bez toho,
aby sme museli prevádzkovať vlastný server bežiaci 24/7.

## Princíp: prečo to nepotrebuje „runtime machine"

Frontend (táto React appka) sa zbuilduje na statické súbory a beží v prehliadači.
Platby majú dve serverové operácie, ktoré sa nesmú robiť v prehliadači
(potrebujú tajný Stripe kľúč):

1. **Vytvorenie Checkout Session** – keď používateľ klikne „Zaplatiť".
2. **Spracovanie webhooku** – keď Stripe potvrdí, že platba prebehla.

Obe spravíme cez **Supabase Edge Functions**. To sú serverless funkcie, ktoré
sa spustia len pri požiadavke a potom „zaspia" (scale-to-zero). Neplatíš za
bežiaci stroj, platíš len za reálne volania – a vo free/štartovacom pláne
sa do limitov bežný projekt zmestí.

```
Prehliadač (React)  ──klik──►  Edge Function: create-checkout  ──►  Stripe Checkout (hostuje Stripe)
                                                                         │
                                                                  používateľ zaplatí
                                                                         │
Supabase DB  ◄── webhook ──  Edge Function: stripe-webhook  ◄────────────┘
(zapíše predplatné/licenciu)
```

Karta sa zadáva výhradne na stránke Stripe – cez náš kód ani server nikdy
neprejde. Tým padá väčšina PCI povinností na Stripe.

## Kroky na zapojenie (keď budeš chcieť)

### 1. Stripe účet a produkty
- Vytvor účet na stripe.com, prepni na **Test mode** počas vývoja.
- Vytvor dva produkty/ceny: `Alter Pro` (€19/mes, recurring) a
  `Alter Lifetime` (€199, one-time). Skopíruj si ich `price_id`.

### 2. Tabuľka na predplatné v Supabase
Spusti v Supabase SQL editore (zjednodušene):

```sql
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,                       -- 'pro' | 'lifetime'
  status text,                     -- 'active' | 'canceled' | ...
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- DÔLEŽITÉ: zapni Row Level Security, nech každý vidí len svoje dáta
alter table public.subscriptions enable row level security;

create policy "user vidí len svoje predplatné"
  on public.subscriptions for select
  using (auth.uid() = user_id);
-- Zápis robí len webhook cez service_role kľúč (RLS obchádza zámerne).
```

### 3. Edge Function – vytvorenie platby
`supabase/functions/create-checkout/index.ts` (kostra):

```ts
import Stripe from "https://esm.sh/stripe@14?target=deno";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

Deno.serve(async (req) => {
  const { plan } = await req.json();
  const priceId = plan === "lifetime"
    ? Deno.env.get("STRIPE_PRICE_LIFETIME")
    : Deno.env.get("STRIPE_PRICE_PRO");

  const session = await stripe.checkout.sessions.create({
    mode: plan === "lifetime" ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${Deno.env.get("SITE_URL")}/dashboard?paid=1`,
    cancel_url: `${Deno.env.get("SITE_URL")}/pricing`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### 4. Edge Function – webhook
`supabase/functions/stripe-webhook/index.ts` overí podpis Stripe a po
udalosti `checkout.session.completed` / `customer.subscription.updated`
zapíše/aktualizuje riadok v tabuľke `subscriptions` (cez service_role klienta).

### 5. Tajné kľúče (NIKDY nie do frontendu)
Nastav cez `supabase secrets set`:
- `STRIPE_SECRET_KEY` – tajný kľúč (sk_...)
- `STRIPE_WEBHOOK_SECRET` – z nastavenia webhooku v Stripe
- `STRIPE_PRICE_PRO`, `STRIPE_PRICE_LIFETIME`, `SITE_URL`

> Service_role a Stripe secret kľúč patria LEN do Edge Functions / servera.
> Do `.env` frontendu ide výhradne verejný `anon` kľúč.

### 6. Napojenie frontendu
V `src/pages/Checkout.tsx` je už pripravené miesto (funkcia `handleCheckout`
s TODO). Stačí odkomentovať volanie:

```ts
const { data, error } = await supabase.functions.invoke("create-checkout", {
  body: { plan },
});
if (error) throw error;
window.location.href = data.url; // presmeruje na Stripe
```

A v Dashboarde čítaj stav z tabuľky `subscriptions` namiesto napevno
zadaného „Pro aktívne".

## Náklady (orientačne)
- **Frontend hosting (Netlify):** zadarmo pre tento typ stránky.
- **Supabase:** free tier na štart; produkčný plán cca $25/mes (bez „stroja",
  je to managed služba). Edge Functions sa platia podľa počtu volaní.
- **Stripe:** žiadny mesačný poplatok, len % z každej platby.

Žiadny z týchto bodov nevyžaduje vlastný server, ktorý musíš držať nažive.
