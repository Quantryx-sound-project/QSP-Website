-- ============================================================
-- Email zákazníka priamo v tabuľkách licenses, orders a refund_requests
-- (aby bolo v Table Editore hneď vidieť, komu riadok patrí).
-- Spusti CELÉ v Supabase → SQL Editor → Run. Dá sa spustiť aj viackrát.
-- ============================================================

-- 1) nový stĺpec customer_email
alter table public.licenses        add column if not exists customer_email text;
alter table public.orders          add column if not exists customer_email text;
alter table public.refund_requests add column if not exists customer_email text;

-- 2) funkcia, ktorá email doplní z účtu (auth.users) podľa user_id
create or replace function public.fill_customer_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null then
    select u.email into new.customer_email from auth.users u where u.id = new.user_id;
  end if;
  return new;
end;
$$;

-- 3) automaticky pri každom novom riadku (aj pri zmene majiteľa)
drop trigger if exists licenses_fill_email on public.licenses;
create trigger licenses_fill_email
  before insert or update of user_id on public.licenses
  for each row execute function public.fill_customer_email();

drop trigger if exists orders_fill_email on public.orders;
create trigger orders_fill_email
  before insert or update of user_id on public.orders
  for each row execute function public.fill_customer_email();

drop trigger if exists refund_requests_fill_email on public.refund_requests;
create trigger refund_requests_fill_email
  before insert or update of user_id on public.refund_requests
  for each row execute function public.fill_customer_email();

-- 4) doplnenie emailov do už existujúcich riadkov
update public.licenses l        set customer_email = u.email from auth.users u where u.id = l.user_id;
update public.orders o          set customer_email = u.email from auth.users u where u.id = o.user_id;
update public.refund_requests r set customer_email = u.email from auth.users u where u.id = r.user_id;
