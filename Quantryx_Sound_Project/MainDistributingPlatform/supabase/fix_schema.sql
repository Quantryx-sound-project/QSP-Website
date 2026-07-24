-- ============================================================
-- Quantryx Sound Project – OPRAVA SCHÉMY (migrácia zo starej verzie)
-- Spusti CELÝ tento skript v Supabase:  SQL Editor → New query → Run
-- Je idempotentný a NEMAŽE existujúce dáta.
--
-- Rieši chyby:
--   • column licenses.purchased_at does not exist (42703)
--   • Could not find the table 'public.orders' (PGRST205)
--   • profiles.full_name  →  name (+ doplní country)
--   • preto sa doteraz neukladali zmeny profilu (name/country neexistovali)
-- ============================================================

-- ---------- 1. PROFILES: full_name -> name, + country ----------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) then
    alter table public.profiles rename column full_name to name;
  end if;
end $$;

alter table public.profiles add column if not exists name    text;
alter table public.profiles add column if not exists country text;

-- automatické updated_at
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

-- RLS politiky (select + update s with check)
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

-- trigger pri registrácii zapisuje name (nie full_name)
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

-- Doplnenie profilu pre už existujúcich používateľov (napr. teba),
-- ktorí vznikli skôr, než existoval trigger.
insert into public.profiles (id, email, name)
select u.id, u.email,
       coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', null)
from auth.users u
on conflict (id) do nothing;

-- ---------- 2. LICENSES: doplniť všetky chýbajúce stĺpce ----------
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
alter table public.licenses add column if not exists card_brand          text;
alter table public.licenses add column if not exists card_last_four      text;
alter table public.licenses add column if not exists ls_subscription_id  text;
alter table public.licenses add column if not exists ls_variant_id       text;
alter table public.licenses add column if not exists purchased_at        timestamptz not null default now();
alter table public.licenses add column if not exists updated_at          timestamptz not null default now();

-- rozšíriť povolené hodnoty (stará verzia mala len active/revoked/refunded)
alter table public.licenses drop constraint if exists licenses_status_check;
alter table public.licenses add  constraint licenses_status_check
  check (status in ('active', 'cancelled', 'revoked', 'refunded', 'expired'));

alter table public.licenses drop constraint if exists licenses_period_type_check;
alter table public.licenses add  constraint licenses_period_type_check
  check (period_type in ('free', 'oneTime', 'subscription'));

create index if not exists licenses_user_id_idx on public.licenses (user_id);
create unique index if not exists licenses_ls_order_uk
  on public.licenses (ls_order_id) where ls_order_id is not null;
create unique index if not exists licenses_ls_sub_uk
  on public.licenses (ls_subscription_id) where ls_subscription_id is not null;

drop trigger if exists licenses_touch_updated_at on public.licenses;
create trigger licenses_touch_updated_at
  before update on public.licenses
  for each row execute function public.touch_updated_at();

alter table public.licenses enable row level security;
drop policy if exists "Users can view own licenses" on public.licenses;
create policy "Users can view own licenses"
  on public.licenses for select
  using (auth.uid() = user_id);

-- Používateľ si smie sám pridať LEN demo licenciu (zadarmo, po prihlásení).
-- Platené licencie naďalej zapisuje výhradne backend (service_role).
drop policy if exists "Users can self-grant demo license" on public.licenses;
create policy "Users can self-grant demo license"
  on public.licenses for insert
  with check (auth.uid() = user_id and plan = 'demo');

-- Max. jedna demo licencia na používateľa (zabráni duplicitám).
create unique index if not exists licenses_one_demo_per_user
  on public.licenses (user_id) where plan = 'demo';

-- ---------- 3. ORDERS: vytvoriť tabuľku ----------
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  plan          text,
  product_name  text,
  total         numeric(10,2),
  currency      text not null default 'EUR',
  status        text not null default 'paid'
                  check (status in ('paid', 'refunded', 'partial_refund', 'pending')),
  invoice_url   text,
  card_brand    text,
  card_last_four text,
  ls_order_id   text,
  order_number  text,
  ordered_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create unique index if not exists orders_ls_order_uk
  on public.orders (ls_order_id) where ls_order_id is not null;

alter table public.orders enable row level security;
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- ---------- 4. Prinúť PostgREST prečítať novú schému ----------
-- (odstráni PGRST205 „schema cache" bez čakania)
notify pgrst, 'reload schema';

-- ---------- Hotovo ----------
-- Over v Table Editor: profiles (name, country), licenses (purchased_at, …), orders.
