-- ============================================================
-- 30-dňová garancia vrátenia peňazí – žiadosti o refund
-- Spusti CELÉ v Supabase → SQL Editor → Run. Dá sa spustiť aj viackrát.
--
-- Tok:
--   1. Zákazník v profile vyplní žiadosť  → request_refund()        (status 'pending')
--   2. Admin v /admin žiadosť schváli     → edge funkcia refund-approve
--      (vráti peniaze cez Lemon Squeezy API, licencia → 'refunded')
--      alebo zamietne                    → admin_reject_refund()   (status 'rejected')
--   Zákazník môže čakajúcu žiadosť stiahnuť → cancel_refund_request()
-- ============================================================

-- 0) stavy licencie (obsahuje aj 'deactivated' z license_deactivate.sql)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.licenses'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.licenses drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.licenses
  add constraint licenses_status_check
  check (status in ('active', 'cancelled', 'revoked', 'refunded', 'expired', 'deactivated'));

alter table public.licenses add column if not exists deactivated_at timestamptz;

-- 1) tabuľka žiadostí
create table if not exists public.refund_requests (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  license_id         uuid not null references public.licenses (id) on delete cascade,
  ls_order_id        text not null,
  plan               text not null,
  amount             numeric(10,2),
  currency           text,
  reason             text not null,
  details            text not null,
  system_info        text,
  contacted_support  boolean not null default false,
  status             text not null default 'pending'
                       check (status in ('pending', 'refunded', 'rejected', 'withdrawn', 'failed')),
  admin_note         text,
  created_at         timestamptz not null default now(),
  resolved_at        timestamptz
);
create index if not exists refund_requests_user_idx on public.refund_requests (user_id);
create index if not exists refund_requests_status_idx on public.refund_requests (status);

alter table public.refund_requests enable row level security;

drop policy if exists "Users can view own refund requests" on public.refund_requests;
create policy "Users can view own refund requests"
  on public.refund_requests for select
  using (auth.uid() = user_id);
-- zápis len cez funkcie nižšie (security definer)

-- 2) zákazník: podať žiadosť
create or replace function public.request_refund(
  p_license_id        uuid,
  p_reason            text,
  p_details           text,
  p_system_info       text,
  p_contacted_support boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.licenses;
  new_id uuid;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;

  select * into l from public.licenses where id = p_license_id for update;
  if not found or l.user_id <> auth.uid() then raise exception 'license_not_found'; end if;
  if l.status <> 'active' then raise exception 'license_not_active'; end if;
  if l.period_type <> 'oneTime' or l.ls_order_id is null or coalesce(l.price_paid, 0) <= 0 then
    raise exception 'not_refundable';
  end if;
  if l.purchased_at < now() - interval '30 days' then
    raise exception 'guarantee_expired';
  end if;
  if exists (select 1 from public.refund_requests r
             where r.license_id = l.id and r.status = 'pending') then
    raise exception 'already_pending';
  end if;
  -- jeden refund na zákazníka a edíciu
  if exists (select 1 from public.refund_requests r
             where r.user_id = auth.uid() and r.plan = l.plan and r.status = 'refunded') then
    raise exception 'already_refunded_once';
  end if;
  if coalesce(length(trim(p_reason)), 0) = 0 then raise exception 'reason_required'; end if;
  if coalesce(length(trim(p_details)), 0) < 50 then raise exception 'details_too_short'; end if;

  insert into public.refund_requests
    (user_id, license_id, ls_order_id, plan, amount, currency,
     reason, details, system_info, contacted_support)
  values
    (auth.uid(), l.id, l.ls_order_id, l.plan, l.price_paid, l.currency,
     trim(p_reason), trim(p_details), nullif(trim(coalesce(p_system_info, '')), ''),
     coalesce(p_contacted_support, false))
  returning id into new_id;

  return new_id;
end;
$$;

-- 3) zákazník: stiahnuť čakajúcu žiadosť
create or replace function public.cancel_refund_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.refund_requests
     set status = 'withdrawn', resolved_at = now()
   where id = p_request_id and user_id = auth.uid() and status = 'pending';
  if not found then raise exception 'request_not_found'; end if;
end;
$$;

-- 4) admin: zoznam žiadostí
create or replace function public.admin_refund_requests()
returns table (
  id uuid, email text, plan text, amount numeric, currency text,
  reason text, details text, system_info text, contacted_support boolean,
  status text, admin_note text, created_at timestamptz, resolved_at timestamptz,
  purchased_at timestamptz, ls_order_id text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
    select r.id, u.email::text, r.plan, r.amount, r.currency,
           r.reason, r.details, r.system_info, r.contacted_support,
           r.status, r.admin_note, r.created_at, r.resolved_at,
           l.purchased_at, r.ls_order_id
      from public.refund_requests r
      join auth.users u on u.id = r.user_id
      left join public.licenses l on l.id = r.license_id
     order by (r.status = 'pending') desc, r.created_at desc
     limit 200;
end;
$$;

-- 5) admin: zamietnuť žiadosť
create or replace function public.admin_reject_refund(p_request_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.refund_requests
     set status = 'rejected', admin_note = nullif(trim(coalesce(p_note, '')), ''), resolved_at = now()
   where id = p_request_id and status = 'pending';
  if not found then raise exception 'request_not_found'; end if;
end;
$$;

revoke all on function public.request_refund(uuid, text, text, text, boolean) from public, anon;
revoke all on function public.cancel_refund_request(uuid) from public, anon;
revoke all on function public.admin_refund_requests() from public, anon;
revoke all on function public.admin_reject_refund(uuid, text) from public, anon;
grant execute on function public.request_refund(uuid, text, text, text, boolean) to authenticated;
grant execute on function public.cancel_refund_request(uuid) to authenticated;
grant execute on function public.admin_refund_requests() to authenticated;
grant execute on function public.admin_reject_refund(uuid, text) to authenticated;
