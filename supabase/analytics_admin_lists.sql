-- ============================================================
-- Admin doplnky k analytike:
--   * zoznam registrácií (účtov) s plným infom
--   * zoznam waitlistu s plným infom
--   * počet waitlistu v súhrne (namiesto „relácie")
--   * admina (profiles.is_admin alebo quantryxmusic@gmail.com)
--     do štatistík NErátame
--
-- Spusti v Supabase → SQL editor PO analytics.sql (je idempotentné,
-- create or replace prepíše pôvodné analytics_summary).
-- ============================================================

-- Kto je admin — na vylúčenie z čísel. Vracia ich user_id.
create or replace function public.admin_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles
  where is_admin = true
     or lower(email) = 'quantryxmusic@gmail.com';
$$;

revoke all on function public.admin_ids() from anon, authenticated;

-- ---------- Súhrn (prepis) ----------
-- Pridané pole `waitlist`. Admin je vylúčený z návštevnosti aj z registrácií.
create or replace function public.analytics_summary(days integer default 30)
returns table (
  visitors          bigint,
  sessions          bigint,
  page_views        bigint,
  views_per_visit   numeric,
  sign_ups          bigint,
  returning_users   bigint,
  checkout_starts   bigint,
  purchases         bigint,
  waitlist          bigint
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
      and (user_id is null or user_id not in (select public.admin_ids()))
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
        and created_at >= now() - make_interval(days => days)
        and id not in (select public.admin_ids()))                            as sign_ups,
    count(distinct user_id) filter (where event_name = 'sign_in')             as returning_users,
    count(distinct visitor_hash) filter (where event_name = 'checkout_start') as checkout_starts,
    (select count(*) from public.orders
      where public.is_admin()
        and status = 'paid'
        and ordered_at >= now() - make_interval(days => days))                as purchases,
    (select count(*) from public.waitlist
      where public.is_admin())                                                as waitlist
  from scope;
$$;

-- ---------- Zoznam registrácií (účtov) ----------
create or replace function public.analytics_registrations()
returns table (
  id uuid,
  email text,
  name text,
  country text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select id, email, name, country, created_at
  from public.profiles
  where public.is_admin()
    and id not in (select public.admin_ids())
  order by created_at desc;
$$;

-- ---------- Zoznam waitlistu ----------
create or replace function public.analytics_waitlist()
returns table (
  id uuid,
  kind text,
  name text,
  email text,
  instagram text,
  specialization text,
  message text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select id, kind::text, name, email, instagram, specialization, message, created_at
  from public.waitlist
  where public.is_admin()
  order by created_at desc;
$$;
