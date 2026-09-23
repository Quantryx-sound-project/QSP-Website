-- ============================================================
-- Deaktivácia licencie používateľom (napr. pred upgradom Demo → Pro)
-- Spusti CELÉ v Supabase → SQL Editor → Run. Dá sa spustiť aj viackrát.
-- ============================================================

-- 1) nový stav 'deactivated' (odstránime starý check na status a dáme nový)
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

-- 2) funkcia, ktorú volá web (tlačidlo "Deaktivovať" v profile)
--    Používateľ smie deaktivovať LEN svoju aktívnu jednorazovú/free licenciu.
create or replace function public.deactivate_license(p_license_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.licenses;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  select * into l from public.licenses where id = p_license_id for update;
  if not found or l.user_id <> auth.uid() then
    raise exception 'license_not_found';
  end if;
  if l.status <> 'active' then
    raise exception 'license_not_active';
  end if;
  if l.period_type = 'subscription' then
    raise exception 'subscription_use_portal';
  end if;

  update public.licenses
     set status = 'deactivated', deactivated_at = now()
   where id = p_license_id;
end;
$$;

revoke all on function public.deactivate_license(uuid) from public, anon;
grant execute on function public.deactivate_license(uuid) to authenticated;
