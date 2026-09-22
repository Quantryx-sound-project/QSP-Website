-- ============================================================
-- Je prihlásený používateľ vo waitliste?
-- Pricing + karty tierov sa ukazujú len prihláseným, ktorí sú vo waitliste
-- (email v tabuľke waitlist) — plus adminom (is_admin()).
-- Spusti v Supabase: SQL Editor → Run.
-- ============================================================
create or replace function public.is_in_waitlist()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.waitlist w
    where w.email is not null
      and lower(w.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_in_waitlist() to authenticated, anon;
