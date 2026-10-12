-- 0001_init: tables, row-level security, the private `closet` storage bucket,
-- its storage policies, and meta.whoami().

-- ---------------------------------------------------------------------------
-- meta.whoami(): lets Greg confirm which database he's connected to.
-- The meta schema is not exposed through the Data API.
-- ---------------------------------------------------------------------------
create schema if not exists meta;
revoke all on schema meta from public, anon, authenticated;

create function meta.whoami()
returns text
language sql
immutable
set search_path = ''
as $$
  select 'Sloane Closet'::text
$$;
revoke all on function meta.whoami() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- person_photos: Sloane's full-body photos. At most one active per user.
-- ---------------------------------------------------------------------------
create table public.person_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  storage_path text not null,
  is_active boolean not null default false,
  -- Lets tryons reference (id, user_id) so a try-on can only use its owner's photo.
  unique (id, user_id)
);

create unique index person_photos_one_active_per_user
  on public.person_photos (user_id)
  where is_active;

-- ---------------------------------------------------------------------------
-- closet_items: saved products.
-- ---------------------------------------------------------------------------
create table public.closet_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  product_url text not null,
  title text,
  store text,
  price_text text,
  image_path text not null,
  category text not null default 'auto'
    check (category in ('auto', 'tops', 'bottoms', 'one-pieces')),
  archived_at timestamptz,
  unique (id, user_id)
);

create index closet_items_user_id_created_at
  on public.closet_items (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- tryons: one row per (item, photo). Redo updates the existing row.
-- ---------------------------------------------------------------------------
create table public.tryons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  item_id uuid not null,
  person_photo_id uuid not null,
  status text not null check (status in ('pending', 'completed', 'failed')),
  fashn_id text,
  result_path text,
  error text,
  completed_at timestamptz,
  unique (item_id, person_photo_id),
  -- Composite keys keep the item and photo owned by the same user as the try-on.
  foreign key (item_id, user_id)
    references public.closet_items (id, user_id) on delete cascade,
  foreign key (person_photo_id, user_id)
    references public.person_photos (id, user_id) on delete cascade
);

create index tryons_user_id on public.tryons (user_id);
create index tryons_person_photo_id_user_id on public.tryons (person_photo_id, user_id);
create index tryons_item_id_user_id on public.tryons (item_id, user_id);

-- ---------------------------------------------------------------------------
-- Row-level security and grants: each user sees and changes only their rows.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['person_photos', 'closet_items', 'tryons'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated', t);

    execute format(
      'create policy "Owner can select" on public.%I for select to authenticated
         using (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "Owner can insert" on public.%I for insert to authenticated
         with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "Owner can update" on public.%I for update to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "Owner can delete" on public.%I for delete to authenticated
         using (user_id = (select auth.uid()))', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Storage: one private bucket. Every object path starts with the owner's id:
--   {user_id}/person/{uuid}.jpg, {user_id}/items/{uuid}.jpg,
--   {user_id}/tryons/{tryon_id}.jpg
-- Images are shown only through signed URLs.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('closet', 'closet', false)
on conflict (id) do nothing;

create policy "Closet owner can select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'closet'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Closet owner can insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'closet'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Closet owner can update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'closet'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'closet'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Closet owner can delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'closet'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
