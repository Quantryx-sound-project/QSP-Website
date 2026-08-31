-- ============================================================
-- Waitlist tabuľka – spusti v Supabase SQL Editore (Run)
-- Dve skupiny: 'collab' (spolupráca za free licenciu)
--              'early_access' (email + meno, zľavy pri drope)
-- ============================================================

create table if not exists public.waitlist (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null check (kind in ('collab', 'early_access')),
  name           text,
  email          text,
  instagram      text,
  specialization text,   -- len pre collab (audio-engineering, production, ...)
  message        text,   -- len pre collab (vlastný popis)
  created_at     timestamptz not null default now(),
  -- aspoň jeden kontakt musí byť vyplnený
  constraint waitlist_contact_required check (email is not null or instagram is not null)
);

-- zabráni duplicitným emailom (rovnaký email sa zapíše len raz)
create unique index if not exists waitlist_email_unique
  on public.waitlist (lower(email)) where email is not null;

alter table public.waitlist enable row level security;

-- Ktokoľvek (aj neprihlásený) sa môže ZAPÍSAŤ...
drop policy if exists "Anyone can join waitlist" on public.waitlist;
create policy "Anyone can join waitlist"
  on public.waitlist for insert
  with check (true);

-- ...ale ČÍTAŤ zoznam nemôže nikto z webu (len ty v dashboarde).
-- Žiadna select policy = žiadny prístup na čítanie.
