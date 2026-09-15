-- ============================================================
-- Quantryx Sound Project – Supabase setup
-- Spusti celý tento skript v Supabase dashboarde:
--   SQL Editor → New query → vlož → Run
-- Skript je idempotentný (dá sa spustiť opakovane bez chyby).
--
-- Obsahuje:
--   1. profiles  – základné údaje užívateľa (email, meno, krajina, avatar)
--   2. licenses  – zakúpené licencie (kľúč, aktivácie, cena, predplatné…)
--   3. orders    – história objednávok (faktúry z Lemon Squeezy)
-- Do licenses/orders zapisuje výhradne Lemon Squeezy webhook
-- (Edge Function `lemon-webhook`) cez service_role – RLS to teda obchádza.
-- ============================================================

-- ---------- 1. PROFILES ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text,
  country    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migrácia zo staršej verzie: full_name -> name, doplniť country, zmazať avatar.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) then
    alter table public.profiles rename column full_name to name;
  end if;
end $$;
alter table public.profiles add  column if not exists name    text;
alter table public.profiles add  column if not exists country text;
alter table public.profiles drop column if exists avatar_url;

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- updated_at sa udržiava automaticky
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Trigger: pri novej registrácii vytvor profil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', null)
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. LICENSES ----------
-- Jedna zakúpená licencia = jeden riadok. Plní ju Lemon Squeezy webhook.
create table if not exists public.licenses (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  plan                 text not null check (plan in ('demo', 'listener', 'creator', 'pro')),
  product_name         text,
  status               text not null default 'active'
                         check (status in ('active', 'cancelled', 'revoked', 'refunded', 'expired')),
  period_type          text not null default 'oneTime'
                         check (period_type in ('free', 'oneTime', 'subscription')),

  -- licenčný kľúč a aktivácie zariadení
  license_key          text,
  activations_used     integer not null default 0,
  activations_limit    integer not null default 3,

  -- cena
  price_paid           numeric(10,2),
  currency             text not null default 'EUR',

  -- predplatné (ak period_type = 'subscription')
  renews_at            timestamptz,
  ends_at              timestamptz,
  customer_portal_url  text,

  -- uložená platobná karta (LEN bezpečné údaje z Lemon Squeezy – nikdy celé číslo!)
  card_brand           text,          -- napr. "visa", "mastercard"
  card_last_four       text,          -- napr. "4242"

  -- párovanie s Lemon Squeezy
  ls_order_id          text,
  ls_subscription_id   text,
  ls_variant_id        text,

  purchased_at         timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Doplnenie stĺpcov, ak tabuľka existovala zo staršej (minimálnej) verzie.
alter table public.licenses add column if not exists product_name        text;
alter table public.licenses add column if not exists period_type         text not null default 'oneTime';
alter table public.licenses add column if not exists license_key         text;
alter table public.licenses add column if not exists activations_used    integer not null default 0;
alter table public.licenses add column if not exists activations_limit   integer not null default 3;
alter table public.licenses add column if not exists price_paid          numeric(10,2);
alter table public.licenses add column if not exists currency            text not null default 'EUR';
alter table public.licenses add column if not exists renews_at           timestamptz;
alter table public.licenses add column if not exists ends_at             timestamptz;
alter table public.licenses add column if not exists customer_portal_url text;
alter table public.licenses add column if not exists ls_subscription_id  text;
alter table public.licenses add column if not exists ls_variant_id       text;
alter table public.licenses add column if not exists card_brand          text;
alter table public.licenses add column if not exists card_last_four      text;
alter table public.licenses add column if not exists purchased_at        timestamptz not null default now();
alter table public.licenses add column if not exists updated_at          timestamptz not null default now();

create index if not exists licenses_user_id_idx on public.licenses (user_id);
create unique index if not exists licenses_ls_order_uk
  on public.licenses (ls_order_id) where ls_order_id is not null;
create unique index if not exists licenses_ls_sub_uk
  on public.licenses (ls_subscription_id) where ls_subscription_id is not null;

alter table public.licenses enable row level security;

drop trigger if exists licenses_touch_updated_at on public.licenses;
create trigger licenses_touch_updated_at
  before update on public.licenses
  for each row execute function public.touch_updated_at();

-- Užívateľ VIDÍ len svoje licencie; zapisovať smie iba backend (service_role).
drop policy if exists "Users can view own licenses" on public.licenses;
create policy "Users can view own licenses"
  on public.licenses for select
  using (auth.uid() = user_id);

-- ---------- 3. ORDERS ----------
-- História objednávok / faktúr. Plní ju rovnaký webhook.
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  plan          text,
  product_name  text,
  total         numeric(10,2),
  currency      text not null default 'EUR',
  status        text not null default 'paid'
                  check (status in ('paid', 'refunded', 'partial_refund', 'pending')),
  invoice_url   text,          -- odkaz na faktúru/účtenku z Lemon Squeezy
  card_brand    text,          -- bezpečný údaj karty (značka)
  card_last_four text,         -- bezpečný údaj karty (posledné 4 číslice)
  ls_order_id   text,
  order_number  text,
  ordered_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- Doplnenie stĺpcov karty, ak orders existovala zo staršej verzie.
alter table public.orders add column if not exists card_brand     text;
alter table public.orders add column if not exists card_last_four text;

create index if not exists orders_user_id_idx on public.orders (user_id);
create unique index if not exists orders_ls_order_uk
  on public.orders (ls_order_id) where ls_order_id is not null;

alter table public.orders enable row level security;

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- ---------- Hotovo ----------
-- Overenie: Table Editor → tabuľky "profiles", "licenses", "orders".
-- Na testovanie sa dá licencia vložiť ručne (Table Editor → Insert row),
-- v ostrej prevádzke ich zapisuje Edge Function `lemon-webhook`.
