-- ============================================================
-- ALTER – Reviews & your projects
-- Spusti CELÉ v Supabase → SQL Editor → New query → vlož → Run.
-- Dá sa spustiť aj viackrát (idempotentné).
--
-- Pravidlá:
--   • čítať recenzie a komentáre môže ktokoľvek (aj neprihlásený)
--   • komentovať / lajkovať môže každý prihlásený
--   • recenziu (1 na človeka) môže napísať len ten, kto má licenciu (aj Demo)
--     → funkcia can_review() nižšie (tam sa dá pravidlo ľahko zmeniť)
--   • písať (recenziu aj komentár) môže len ten, kto má v profile vyplnené meno
--   • pri mene sa zobrazuje edícia licencie (Demo / Listener / Creator / Pro)
--     a sama sa aktualizuje, keď si človek licenciu zmení (napr. Demo → Pro)
--   • autor môže svoju recenziu / komentár upraviť alebo zmazať
--   • admin (profiles.is_admin) môže zmazať čokoľvek
--   • video: max 20 MB, mp4/webm/mov (dĺžku max 10 s kontroluje web)
-- ============================================================

-- ---------- 1. Kto smie písať recenziu ----------
-- Ktoré edície sa rátajú ako licencia (Demo áno – má svoje limity, ale je to licencia).
create or replace function public.can_review(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user is not null and exists (
    select 1 from public.licenses l
    where l.user_id = p_user
      and l.status = 'active'
      and l.plan in ('demo', 'listener', 'creator', 'pro')
  );
$$;

-- Najvyššia aktívna edícia človeka (odznak pri mene). Bez licencie = null.
create or replace function public.review_best_plan(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select l.plan from public.licenses l
  where l.user_id = p_user and l.status = 'active' and l.plan in ('demo', 'listener', 'creator', 'pro')
  order by case l.plan when 'pro' then 4 when 'creator' then 3 when 'listener' then 2 else 1 end desc
  limit 1;
$$;

-- Verejné meno autora (profiles sú súkromné, preto meno ukladáme k príspevku).
-- Vráti null, ak meno nie je vyplnené → zápis sa zamietne ('name_required').
create or replace function public.review_display_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(trim(p.name), '') from public.profiles p where p.id = p_user;
$$;

-- ---------- 2. Tabuľky ----------
create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  product         text not null default 'alter',
  user_id         uuid not null references auth.users (id) on delete cascade,
  author_name     text not null default 'Alter user',
  author_plan     text,
  rating          smallint not null check (rating between 1 and 5),
  body            text not null check (char_length(trim(body)) between 3 and 2000),
  youtube_url     text check (youtube_url is null or char_length(youtube_url) <= 300),
  project_url     text check (project_url is null or (char_length(project_url) <= 500 and project_url ~* '^https?://')),
  video_path      text check (video_path is null or char_length(video_path) <= 300),
  likes_count     integer not null default 0,
  comments_count  integer not null default 0,
  edited          boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (product, user_id)
);
create index if not exists reviews_product_created_idx on public.reviews (product, created_at desc);

create table if not exists public.review_comments (
  id           uuid primary key default gen_random_uuid(),
  review_id    uuid not null references public.reviews (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  author_name  text not null default 'Alter user',
  author_plan  text,
  body         text not null check (char_length(trim(body)) between 1 and 1000),
  edited       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.review_comments add column if not exists author_plan text;
create index if not exists review_comments_review_idx on public.review_comments (review_id, created_at);

create table if not exists public.review_likes (
  review_id   uuid not null references public.reviews (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- ---------- 3. Triggery ----------
-- Pri vložení: doplň meno, edíciu; pri úprave: označ "edited".
create or replace function public.reviews_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if tg_op = 'INSERT' then
    v_name := public.review_display_name(new.user_id);
    if v_name is null then raise exception 'name_required'; end if;
    new.author_name := v_name;
    new.author_plan := public.review_best_plan(new.user_id);
    new.likes_count := 0;
    new.comments_count := 0;
    new.edited := false;
    new.created_at := now();
  else
    if new.rating is distinct from old.rating or new.body is distinct from old.body
       or new.youtube_url is distinct from old.youtube_url
       or new.project_url is distinct from old.project_url
       or new.video_path is distinct from old.video_path then
      new.edited := true;
      v_name := public.review_display_name(new.user_id);
      if v_name is null then raise exception 'name_required'; end if;
      new.author_name := v_name;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists reviews_before_write on public.reviews;
create trigger reviews_before_write
  before insert or update on public.reviews
  for each row execute function public.reviews_before_write();

create or replace function public.review_comments_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if tg_op = 'INSERT' then
    -- jednoduchá ochrana proti spamu: max 20 komentárov za hodinu
    if (select count(*) from public.review_comments c
        where c.user_id = new.user_id and c.created_at > now() - interval '1 hour') >= 20 then
      raise exception 'too_many_comments';
    end if;
    v_name := public.review_display_name(new.user_id);
    if v_name is null then raise exception 'name_required'; end if;
    new.author_name := v_name;
    new.author_plan := public.review_best_plan(new.user_id);
    new.edited := false;
    new.created_at := now();
  elsif new.body is distinct from old.body then
    new.edited := true;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists review_comments_before_write on public.review_comments;
create trigger review_comments_before_write
  before insert or update on public.review_comments
  for each row execute function public.review_comments_before_write();

-- Počítadlá lajkov a komentárov.
create or replace function public.review_counters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid := coalesce(new.review_id, old.review_id);
begin
  if tg_table_name = 'review_likes' then
    update public.reviews set likes_count = (select count(*) from public.review_likes where review_id = rid)
    where id = rid;
  else
    update public.reviews set comments_count = (select count(*) from public.review_comments where review_id = rid)
    where id = rid;
  end if;
  return null;
end;
$$;
drop trigger if exists review_likes_count on public.review_likes;
create trigger review_likes_count
  after insert or delete on public.review_likes
  for each row execute function public.review_counters();
drop trigger if exists review_comments_count on public.review_comments;
create trigger review_comments_count
  after insert or delete on public.review_comments
  for each row execute function public.review_counters();

-- Počítadlá mení len trigger → "edited" sa pri lajku nesmie zapnúť.
-- (reviews_before_write kontroluje len obsahové stĺpce, takže je to v poriadku.)

-- ---------- 3b. Meno a edícia sa držia aktuálne ----------
-- Keď si človek zmení meno v profile alebo získa/zmení licenciu,
-- prepíše sa to pri všetkých jeho recenziách a komentároch.
create or replace function public.review_sync_author(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := public.review_display_name(p_user);
  v_plan text := public.review_best_plan(p_user);
begin
  update public.reviews
     set author_name = coalesce(v_name, author_name), author_plan = v_plan
   where user_id = p_user
     and (author_name is distinct from coalesce(v_name, author_name) or author_plan is distinct from v_plan);
  update public.review_comments
     set author_name = coalesce(v_name, author_name), author_plan = v_plan
   where user_id = p_user
     and (author_name is distinct from coalesce(v_name, author_name) or author_plan is distinct from v_plan);
end;
$$;
revoke execute on function public.review_sync_author(uuid) from public, anon, authenticated;

create or replace function public.review_sync_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'profiles' then
    perform public.review_sync_author(new.id);
  elsif tg_op = 'DELETE' then
    perform public.review_sync_author(old.user_id);
  else
    perform public.review_sync_author(new.user_id);
  end if;
  return null;
end;
$$;

drop trigger if exists profiles_review_sync on public.profiles;
create trigger profiles_review_sync
  after update of name on public.profiles
  for each row execute function public.review_sync_trigger();

drop trigger if exists licenses_review_sync on public.licenses;
create trigger licenses_review_sync
  after insert or update of plan, status or delete on public.licenses
  for each row execute function public.review_sync_trigger();

-- dorovnanie existujúcich záznamov (ak SQL spúšťaš znova)
do $$
declare u uuid;
begin
  for u in select distinct user_id from public.reviews
           union select distinct user_id from public.review_comments
  loop
    perform public.review_sync_author(u);
  end loop;
end $$;

-- ---------- 4. Práva (RLS) ----------
alter table public.reviews         enable row level security;
alter table public.review_comments enable row level security;
alter table public.review_likes    enable row level security;

-- čítanie pre všetkých
drop policy if exists "reviews read" on public.reviews;
create policy "reviews read" on public.reviews for select using (true);
drop policy if exists "review comments read" on public.review_comments;
create policy "review comments read" on public.review_comments for select using (true);
drop policy if exists "review likes read" on public.review_likes;
create policy "review likes read" on public.review_likes for select using (true);

-- recenzie
drop policy if exists "reviews insert by owners" on public.reviews;
create policy "reviews insert by owners" on public.reviews for insert
  with check (auth.uid() = user_id and public.can_review(auth.uid()));
drop policy if exists "reviews update own" on public.reviews;
create policy "reviews update own" on public.reviews for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "reviews delete own or admin" on public.reviews;
create policy "reviews delete own or admin" on public.reviews for delete
  using (auth.uid() = user_id or public.is_admin());

-- komentáre
drop policy if exists "review comments insert" on public.review_comments;
create policy "review comments insert" on public.review_comments for insert
  with check (auth.uid() = user_id);
drop policy if exists "review comments update own" on public.review_comments;
create policy "review comments update own" on public.review_comments for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "review comments delete own or admin" on public.review_comments;
create policy "review comments delete own or admin" on public.review_comments for delete
  using (auth.uid() = user_id or public.is_admin());

-- lajky
drop policy if exists "review likes insert own" on public.review_likes;
create policy "review likes insert own" on public.review_likes for insert
  with check (auth.uid() = user_id);
drop policy if exists "review likes delete own" on public.review_likes;
create policy "review likes delete own" on public.review_likes for delete
  using (auth.uid() = user_id);

-- Stĺpce, ktoré smie používateľ meniť (počítadlá, meno a autor sú zamknuté).
revoke insert, update on public.reviews from anon, authenticated;
grant  insert (product, user_id, rating, body, youtube_url, project_url, video_path)
  on public.reviews to authenticated;
grant  update (rating, body, youtube_url, project_url, video_path)
  on public.reviews to authenticated;
grant  select on public.reviews to anon, authenticated;
grant  delete on public.reviews to authenticated;

revoke insert, update on public.review_comments from anon, authenticated;
grant  insert (review_id, user_id, body) on public.review_comments to authenticated;
grant  update (body) on public.review_comments to authenticated;
grant  select on public.review_comments to anon, authenticated;
grant  delete on public.review_comments to authenticated;

grant select on public.review_likes to anon, authenticated;
grant insert, delete on public.review_likes to authenticated;

grant execute on function public.can_review(uuid) to anon, authenticated;

-- ---------- 5. Úložisko na krátke videá ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-videos', 'review-videos', true, 20971520,
        array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- súbory idú do priečinka <user_id>/...
drop policy if exists "review videos upload" on storage.objects;
create policy "review videos upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'review-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.can_review(auth.uid())
  );
drop policy if exists "review videos delete" on storage.objects;
create policy "review videos delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'review-videos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
