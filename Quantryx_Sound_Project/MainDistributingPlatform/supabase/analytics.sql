-- ============================================================
-- Quantryx Sound Project – vlastná analytika
-- Spusti v Supabase: SQL Editor → New query → vlož → Run
-- Skript je idempotentný (dá sa spustiť opakovane).
--
-- Návrh:
--   * analytics_events – jeden riadok = jedna udalosť (zobrazenie, klik, …)
--   * návštevník sa identifikuje denným hashom (IP + prehliadač + soľ),
--     ktorý ráta Edge Function `track`. IP sa NIKDY neukladá.
--     Hash sa každý deň mení, takže sa nedá spätne spojiť s človekom
--     ani sledovať naprieč dňami → bez cookies, bez súhlasu, bez lišty.
--   * zapisuje výhradne Edge Function cez service_role (obchádza RLS).
--     Klient do tabuľky nevidí a nezapisuje.
--   * čítať smie len admin, cez security definer funkcie nižšie.
-- ============================================================

-- ---------- 1. ADMIN PRÍZNAK ----------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Pomocná funkcia – je prihlásený užívateľ admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- ---------- 2. TABUĽKA UDALOSTÍ ----------
create table if not exists public.analytics_events (
  id            bigint generated always as identity primary key,
  occurred_at   timestamptz not null default now(),

  -- identita (denný hash, nie osoba)
  visitor_hash  text        not null,
  session_id    text        not null,

  -- čo sa stalo
  event_name    text        not null,   -- page_view | click | sign_up | sign_in | checkout_start | purchase
  path          text,                   -- '/', '/pricing', '/product/pro'
  label         text,                   -- pri klikoch: 'waitlist_join', 'pricing_cta', …

  -- kontext
  referrer_host text,                   -- 'instagram.com', 'google.com', null = priamy vstup
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  device_type   text,                   -- mobile | tablet | desktop
  browser       text,
  os            text,
  country       text,

  -- prepojenie na účet, ak je človek prihlásený
  user_id       uuid references auth.users (id) on delete set null,

  props         jsonb       not null default '{}'::jsonb
);

comment on table public.analytics_events is
  'Vlastná analytika. Zapisuje len Edge Function `track` cez service_role. IP sa neukladá.';

create index if not exists analytics_events_occurred_at_idx
  on public.analytics_events (occurred_at desc);
create index if not exists analytics_events_name_time_idx
  on public.analytics_events (event_name, occurred_at desc);
create index if not exists analytics_events_visitor_idx
  on public.analytics_events (visitor_hash, occurred_at desc);
create index if not exists analytics_events_session_idx
  on public.analytics_events (session_id);
create index if not exists analytics_events_path_idx
  on public.analytics_events (path, occurred_at desc);

alter table public.analytics_events enable row level security;

-- Žiadna policy pre anon/authenticated = nikto z klienta sem nevidí ani nezapíše.
-- Edge Function používa service_role, ktorý RLS obchádza.
drop policy if exists "Admin can read analytics" on public.analytics_events;
create policy "Admin can read analytics"
  on public.analytics_events for select
  using (public.is_admin());

-- ---------- 3. DENNÁ SOĽ PRE HASH ----------
-- Soľ sa raz denne vygeneruje a po 7 dňoch maže. Vďaka tomu sa staré
-- hashe nedajú prepočítať ani keby niekto získal prístup k databáze.
create table if not exists public.analytics_salt (
  day  date primary key default current_date,
  salt text not null default encode(gen_random_bytes(32), 'hex')
);

alter table public.analytics_salt enable row level security;
-- žiadna policy → dostupné výhradne cez service_role

create or replace function public.analytics_current_salt()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  s text;
begin
  insert into public.analytics_salt (day) values (current_date)
    on conflict (day) do nothing;
  select salt into s from public.analytics_salt where day = current_date;
  delete from public.analytics_salt where day < current_date - 7;
  return s;
end;
$$;

revoke all on function public.analytics_current_salt() from anon, authenticated;

-- ============================================================
-- 4. PREHĽADY PRE ADMINA
-- Všetko sú security definer funkcie chránené cez is_admin(),
-- takže sa dajú volať z frontendu cez supabase.rpc(...).
-- ============================================================

-- 4a. Súhrn za obdobie: návštevníci, návštevy, zobrazenia, hĺbka
--     Registrácie sa NErátajú z udalostí, ale z tabuľky profiles –
--     tá je jediný zdroj pravdy a nemôže sa rozísť s analytikou.
--     Prihlásenia rátame ako počet RÔZNYCH ľudí, ktorí sa vrátili;
--     surový počet prihlásení nič nehovorí (jeden človek sa prihlási päťkrát).
create or replace function public.analytics_summary(days integer default 30)
returns table (
  visitors          bigint,
  sessions          bigint,
  page_views        bigint,
  views_per_visit   numeric,
  sign_ups          bigint,
  returning_users   bigint,
  checkout_starts   bigint,
  purchases         bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with scope as (
    select * from public.analytics_events
    where public.is_admin()
      and occurred_at >= now() - make_interval(days => days)
  )
  select
    count(distinct visitor_hash)                                              as visitors,
    count(distinct session_id)                                                as sessions,
    count(*) filter (where event_name = 'page_view')                          as page_views,
    round(
      count(*) filter (where event_name = 'page_view')::numeric
      / nullif(count(distinct session_id), 0), 2)                             as views_per_visit,
    (select count(*) from public.profiles
      where public.is_admin()
        and created_at >= now() - make_interval(days => days))                as sign_ups,
    count(distinct user_id) filter (where event_name = 'sign_in')             as returning_users,
    count(distinct visitor_hash) filter (where event_name = 'checkout_start') as checkout_starts,
    (select count(*) from public.orders
      where public.is_admin()
        and status = 'paid'
        and ordered_at >= now() - make_interval(days => days))                as purchases
  from scope;
$$;

-- 4b. Ktoré stránky ľudia otvorili + podiel z celkového počtu návštevníkov
create or replace function public.analytics_paths(days integer default 30)
returns table (
  path            text,
  views           bigint,
  visitors        bigint,
  pct_of_visitors numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with scope as (
    select * from public.analytics_events
    where public.is_admin()
      and event_name = 'page_view'
      and occurred_at >= now() - make_interval(days => days)
  ),
  total as (select count(distinct visitor_hash) as v from scope)
  select
    s.path,
    count(*)                        as views,
    count(distinct s.visitor_hash)  as visitors,
    round(100.0 * count(distinct s.visitor_hash) / nullif((select v from total), 0), 1)
                                    as pct_of_visitors
  from scope s
  group by s.path
  order by visitors desc;
$$;

-- 4c. Kliky na tlačidlá
create or replace function public.analytics_clicks(days integer default 30)
returns table (
  label           text,
  clicks          bigint,
  visitors        bigint,
  pct_of_visitors numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with scope as (
    select * from public.analytics_events
    where public.is_admin()
      and occurred_at >= now() - make_interval(days => days)
  ),
  total as (select count(distinct visitor_hash) as v from scope)
  select
    s.label,
    count(*)                       as clicks,
    count(distinct s.visitor_hash) as visitors,
    round(100.0 * count(distinct s.visitor_hash) / nullif((select v from total), 0), 1)
                                   as pct_of_visitors
  from scope s
  where s.event_name = 'click' and s.label is not null
  group by s.label
  order by clicks desc;
$$;

-- 4d. Lievik: návštevník → pozrel ceny → začal nákup → kúpil / zaregistroval sa
create or replace function public.analytics_funnel(days integer default 30)
returns table (
  step        text,
  step_order  integer,
  visitors    bigint,
  pct_of_top  numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with scope as (
    select * from public.analytics_events
    where public.is_admin()
      and occurred_at >= now() - make_interval(days => days)
  ),
  steps as (
    select 'Navštívili web'      as step, 1 as step_order,
           count(distinct visitor_hash) as visitors from scope
    union all
    select 'Pozreli ceny', 2,
           count(distinct visitor_hash) from scope
           where event_name = 'page_view' and path = '/pricing'
    union all
    select 'Otvorili produkt', 3,
           count(distinct visitor_hash) from scope
           where event_name = 'page_view' and path like '/product/%'
    union all
    select 'Zaregistrovali sa', 4,
           (select count(*) from public.profiles
             where created_at >= now() - make_interval(days => days))
    union all
    select 'Začali nákup', 5,
           count(distinct visitor_hash) from scope where event_name = 'checkout_start'
    union all
    select 'Kúpili', 6,
           (select count(*) from public.orders
             where status = 'paid'
               and ordered_at >= now() - make_interval(days => days))
  ),
  top as (select visitors as v from steps where step_order = 1)
  select
    s.step, s.step_order, s.visitors,
    round(100.0 * s.visitors / nullif((select v from top), 0), 1) as pct_of_top
  from steps s
  order by s.step_order;
$$;

-- 4e. Odkiaľ ľudia prišli
create or replace function public.analytics_sources(days integer default 30)
returns table (
  source   text,
  visitors bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(utm_source, ''), referrer_host, 'priamy vstup') as source,
    count(distinct visitor_hash)                                    as visitors
  from public.analytics_events
  where public.is_admin()
    and occurred_at >= now() - make_interval(days => days)
  group by 1
  order by visitors desc;
$$;

-- 4f. Denný priebeh pre graf
create or replace function public.analytics_daily(days integer default 30)
returns table (
  day        date,
  visitors   bigint,
  page_views bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    occurred_at::date                                as day,
    count(distinct visitor_hash)                     as visitors,
    count(*) filter (where event_name = 'page_view') as page_views
  from public.analytics_events
  where public.is_admin()
    and occurred_at >= now() - make_interval(days => days)
  group by 1
  order by 1;
$$;

-- 4g. Zariadenia
create or replace function public.analytics_devices(days integer default 30)
returns table (
  device_type text,
  visitors    bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(device_type, 'neznáme') as device_type,
    count(distinct visitor_hash)     as visitors
  from public.analytics_events
  where public.is_admin()
    and occurred_at >= now() - make_interval(days => days)
  group by 1
  order by visitors desc;
$$;

grant execute on function
  public.analytics_summary(integer),
  public.analytics_paths(integer),
  public.analytics_clicks(integer),
  public.analytics_funnel(integer),
  public.analytics_sources(integer),
  public.analytics_daily(integer),
  public.analytics_devices(integer),
  public.is_admin()
  to authenticated;

-- ---------- 5. UPRATOVANIE ----------
-- Udalosti staršie ako rok zmaž (dá sa volať ručne alebo cez pg_cron).
create or replace function public.analytics_prune()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.analytics_events where occurred_at < now() - interval '1 year';
$$;

-- ============================================================
-- POSLEDNÝ KROK – nastav si seba ako admina:
--   update public.profiles set is_admin = true
--   where email = 'quantryxmusic@gmail.com';
-- ============================================================
