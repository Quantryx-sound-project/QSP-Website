-- ============================================================
-- Alter — login-based aktivácia aplikácie (device sloty)
-- Spusti v Supabase: SQL Editor → New query → vlož → Run.
-- Idempotentné (dá sa spustiť opakovane).
--
-- Doplnok k setup.sql. Pridáva:
--   1. licenses: povolený 'demo' v plane + 'free' v period_type (už sú v checku)
--   2. devices  – zariadenia, na ktorých je používateľ prihlásený v appke
--                 (nahrádza license-key aktivačné sloty; limit = počet strojov)
--
-- Do devices zapisuje VÝHRADNE Edge Function `app-activate` cez service_role.
-- Používateľ svoje zariadenia iba VIDÍ (na "Moje zariadenia" v profile).
-- ============================================================

-- ---------- DEVICES ----------
create table if not exists public.devices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  machine_id   text not null,              -- stabilný per-stroj identifikátor z appky
  machine_name text,                       -- napr. "Martyn – Studio PC" (voliteľné)
  platform     text,                       -- "windows" | "macos"
  app_version  text,
  last_seen    timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  unique (user_id, machine_id)
);

create index if not exists devices_user_id_idx on public.devices (user_id);

alter table public.devices enable row level security;

-- Používateľ vidí len svoje zariadenia; zápis/mazanie robí len backend.
drop policy if exists "Users can view own devices" on public.devices;
create policy "Users can view own devices"
  on public.devices for select
  using (auth.uid() = user_id);

-- ---------- Voliteľné: počet strojov ako pohľad pre appku ----------
-- (nepovinné, appka to dostane z edge function; toto je len na kontrolu)
comment on table public.devices is
  'Zariadenia prihlásené v Alter appke. Slot = jeden riadok. Napĺňa app-activate.';

-- Hotovo. Over v Table Editor: tabuľka "devices".
