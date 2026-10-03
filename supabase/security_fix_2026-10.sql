-- ============================================================
-- BEZPEČNOSTNÁ OPRAVA (audit 3. 10. 2026)
-- Spusti CELÉ v Supabase → SQL Editor → New query → vlož → Run.
-- Je idempotentné (dá sa spustiť aj viackrát) a NEMAŽE žiadne dáta.
--
-- Opravuje:
--   K1  bežný používateľ si vedel v profile nastaviť is_admin / email
--   V2  demo licenciu si klient zapisoval sám s ľubovoľnými stĺpcami
--   V2  žiadosť o refund sa dala podať na cudziu / neexistujúcu objednávku
--   S1  niektoré funkcie mohol volať ktokoľvek (aj neprihlásený)
--
-- POZOR: spúšťaj až keď je na webe nasadená nová verzia
-- (tlačidlo "Získať Demo" volá claim_demo_license namiesto insertu).
-- ============================================================

-- ---------- 1. PROFILES: používateľ smie meniť len meno a krajinu ----------
revoke insert, update, delete on public.profiles from anon, authenticated;
grant  update (name, country) on public.profiles to authenticated;

-- ---------- 2. Serverové tabuľky: z prehliadača žiadny zápis ----------
-- (RLS to už väčšinou blokovalo; toto je druhá vrstva istoty)
drop policy if exists "Users can self-grant demo license" on public.licenses;

revoke insert, update, delete on public.licenses         from anon, authenticated;
revoke insert, update, delete on public.orders           from anon, authenticated;
revoke insert, update, delete on public.devices          from anon, authenticated;
revoke insert, update, delete on public.refund_requests  from anon, authenticated;
revoke insert, update, delete on public.analytics_events from anon, authenticated;
revoke all                    on public.analytics_salt   from anon, authenticated;

-- ---------- 3. Demo licencia len cez funkciu (hodnoty určí server) ----------
create or replace function public.claim_demo_license()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  insert into public.licenses (user_id, plan, status, period_type, activations_limit)
  values (auth.uid(), 'demo', 'active', 'free', 1)
  on conflict do nothing;   -- max. jedna demo licencia (index licenses_one_demo_per_user)
end;
$$;

revoke all     on function public.claim_demo_license() from public, anon;
grant  execute on function public.claim_demo_license() to authenticated;

-- ---------- 4. Refund len za VLASTNÚ ZAPLATENÚ objednávku ----------
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
  -- NOVÉ: demo sa nerefunduje a objednávka musí existovať, patriť tomuto
  -- používateľovi a byť zaplatená (zapisuje ju len webhook / sync).
  if l.plan = 'demo' or not exists (
       select 1 from public.orders o
        where o.ls_order_id = l.ls_order_id
          and o.user_id = auth.uid()
          and o.status = 'paid'
          and o.total > 0) then
    raise exception 'not_refundable';
  end if;
  if l.purchased_at < now() - interval '30 days' then
    raise exception 'guarantee_expired';
  end if;
  if exists (select 1 from public.refund_requests r
             where r.license_id = l.id and r.status = 'pending') then
    raise exception 'already_pending';
  end if;
  if exists (select 1 from public.refund_requests r
             where r.user_id = auth.uid() and r.plan = l.plan and r.status = 'refunded') then
    raise exception 'already_refunded_once';
  end if;
  if coalesce(length(trim(p_reason)), 0) = 0 then raise exception 'reason_required'; end if;
  if coalesce(length(trim(p_details)), 0) < 50 then raise exception 'details_too_short'; end if;
  -- NOVÉ: rozumné limity dĺžky textu
  if length(p_details) > 5000 or length(coalesce(p_system_info, '')) > 2000
     or length(p_reason) > 200 then
    raise exception 'text_too_long';
  end if;

  insert into public.refund_requests
    (user_id, license_id, ls_order_id, plan, amount, currency, purchased_at,
     reason, details, system_info, contacted_support)
  values
    (auth.uid(), l.id, l.ls_order_id, l.plan, l.price_paid, l.currency, l.purchased_at,
     trim(p_reason), trim(p_details), nullif(trim(coalesce(p_system_info, '')), ''),
     coalesce(p_contacted_support, false))
  returning id into new_id;

  return new_id;
end;
$$;

revoke all     on function public.request_refund(uuid, text, text, text, boolean) from public, anon;
grant  execute on function public.request_refund(uuid, text, text, text, boolean) to authenticated;

-- ---------- 5. Funkcie, ktoré nesmie volať ktokoľvek ----------
-- "revoke ... from anon, authenticated" NESTAČÍ — PostgreSQL dáva právo
-- spúšťať funkcie aj skupine PUBLIC (= všetci). Preto revoke aj z public.
-- (Edge funkcie bežia ako service_role, tie prístup nestratia.)
do $$
declare f text;
begin
  foreach f in array array[
    'public.analytics_current_salt()',
    'public.analytics_prune()',
    'public.admin_ids()',
    'public.review_sync_author(uuid)',
    'public.fill_customer_email()'
  ] loop
    if to_regprocedure(f) is not null then   -- funkcia existuje → zober práva
      execute format('revoke execute on function %s from public, anon, authenticated', f);
    end if;
  end loop;
end $$;

-- ---------- 6. Prinúť API načítať zmeny ----------
notify pgrst, 'reload schema';

-- ============================================================
-- KONTROLA PO SPUSTENÍ (spusti zvlášť, ako nový query):
--
--   select column_name from information_schema.column_privileges
--   where table_schema='public' and table_name='profiles'
--     and grantee='authenticated' and privilege_type='UPDATE';
--   → má vrátiť LEN: country, name
-- ============================================================
