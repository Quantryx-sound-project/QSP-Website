-- ============================================================
-- Quantryx Sound Project – atribúcia a cesty návštevníkov
-- Doplnok k analytics.sql. Spusti v Supabase: SQL Editor → Run.
-- Idempotentné.
--
-- Rieši dve slepé miesta pôvodnej analytiky:
--   1. Cesty v rámci návštevy – kadiaľ človek prešiel, nielen kde bol.
--   2. Atribúcia zákazníka – z akého kanála prišiel ten, kto sa
--      zaregistroval a zaplatil. Ukladá sa priamo na jeho riadok
--      v profiles, čo je náš vlastný zákaznícky údaj, nie sledovanie
--      naprieč cudzími webmi → stále bez cookies a bez súhlasu.
-- ============================================================

-- ---------- 1. ODKIAĽ ZÁKAZNÍK PRIŠIEL ----------
alter table public.profiles add column if not exists signup_utm_source   text;
alter table public.profiles add column if not exists signup_utm_medium   text;
alter table public.profiles add column if not exists signup_utm_campaign text;
alter table public.profiles add column if not exists signup_referrer     text;
alter table public.profiles add column if not exists signup_landing_path text;

comment on column public.profiles.signup_utm_source is
  'Kanál, z ktorého človek prišiel, keď sa registroval. Vyplní sa raz, pri vzniku účtu.';

-- Trigger pri vzniku účtu rozšírime o zapísanie zdroja.
-- Hodnoty posiela klient v options.data pri signUp().
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, name,
    signup_utm_source, signup_utm_medium, signup_utm_campaign,
    signup_referrer, signup_landing_path
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', null),
    nullif(new.raw_user_meta_data ->> 'utm_source', ''),
    nullif(new.raw_user_meta_data ->> 'utm_medium', ''),
    nullif(new.raw_user_meta_data ->> 'utm_campaign', ''),
    nullif(new.raw_user_meta_data ->> 'referrer_host', ''),
    nullif(new.raw_user_meta_data ->> 'landing_path', '')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

-- ---------- 2. AKÝ KANÁL NOSÍ PLATIACICH ZÁKAZNÍKOV ----------
-- Toto je otázka, na ktorú bežná analytika bez cookies neodpovie.
create or replace function public.analytics_acquisition(days integer default 90)
returns table (
  source          text,
  sign_ups        bigint,
  paying_users    bigint,
  revenue         numeric,
  conversion_pct  numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(p.signup_utm_source, ''), nullif(p.signup_referrer, ''), 'priamy vstup') as source,
    count(distinct p.id)                                                as sign_ups,
    count(distinct o.user_id)                                           as paying_users,
    coalesce(sum(o.total), 0)                                           as revenue,
    round(100.0 * count(distinct o.user_id)
          / nullif(count(distinct p.id), 0), 1)                         as conversion_pct
  from public.profiles p
  left join public.orders o
    on o.user_id = p.id and o.status = 'paid'
  where public.is_admin()
    and p.created_at >= now() - make_interval(days => days)
  group by 1
  order by paying_users desc, sign_ups desc;
$$;

-- ---------- 3. CESTY V RÁMCI NÁVŠTEVY ----------
-- Poskladá poradie stránok v jednej relácii a spočíta, ktoré
-- postupnosti sú najčastejšie. Ukáže, kadiaľ ľudia chodia a kde končia.
create or replace function public.analytics_journeys(days integer default 30, max_rows integer default 12)
returns table (
  journey  text,
  steps    integer,
  sessions bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with scope as (
    select session_id, path, occurred_at
    from public.analytics_events
    where public.is_admin()
      and event_name = 'page_view'
      and path is not null
      and occurred_at >= now() - make_interval(days => days)
  ),
  per_session as (
    select
      session_id,
      string_agg(path, ' → ' order by occurred_at) as journey,
      count(*)::integer                            as steps
    from scope
    group by session_id
  )
  select journey, min(steps) as steps, count(*) as sessions
  from per_session
  group by journey
  order by sessions desc, steps desc
  limit max_rows;
$$;

-- ---------- 4. KDE ĽUDIA ODCHÁDZAJÚ ----------
-- Posledná stránka relácie = miesto, kde človek web opustil.
create or replace function public.analytics_exits(days integer default 30)
returns table (
  path       text,
  exits      bigint,
  exit_pct   numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with scope as (
    select session_id, path, occurred_at
    from public.analytics_events
    where public.is_admin()
      and event_name = 'page_view'
      and path is not null
      and occurred_at >= now() - make_interval(days => days)
  ),
  last_step as (
    select distinct on (session_id) session_id, path
    from scope
    order by session_id, occurred_at desc
  ),
  total as (select count(*)::numeric as n from last_step)
  select
    path,
    count(*) as exits,
    round(100.0 * count(*) / nullif((select n from total), 0), 1) as exit_pct
  from last_step
  group by path
  order by exits desc;
$$;

grant execute on function
  public.analytics_acquisition(integer),
  public.analytics_journeys(integer, integer),
  public.analytics_exits(integer)
  to authenticated;
