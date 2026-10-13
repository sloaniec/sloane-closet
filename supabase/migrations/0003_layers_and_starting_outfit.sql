-- 0003_layers_and_starting_outfit: layering and the starting outfit.
--
-- A try-on can now be made on top of an earlier try-on (base_tryon_id),
-- so an outfit is a chain: photo -> PJs -> top -> jacket. Each link is
-- saved, so any combination she has already made is free to see again.

alter table public.tryons
  add column base_tryon_id uuid;

-- Lets base_tryon_id point at (id, user_id), so a layer can only sit on
-- the same person's earlier try-on.
alter table public.tryons
  add constraint tryons_id_user_id_key unique (id, user_id);

alter table public.tryons
  add constraint tryons_base_tryon_fkey
    foreign key (base_tryon_id, user_id)
    references public.tryons (id, user_id) on delete cascade;

-- One saved try-on per item, photo, and starting point. "nulls not
-- distinct" treats "straight onto the photo" (no base) as one value.
alter table public.tryons
  drop constraint tryons_item_id_person_photo_id_key;

alter table public.tryons
  add constraint tryons_item_photo_base_key
    unique nulls not distinct (item_id, person_photo_id, base_tryon_id);

create index tryons_base_tryon_id_user_id
  on public.tryons (base_tryon_id, user_id);

-- The outfit the closet scene starts in (at most one per person).
alter table public.closet_items
  add column is_starting_outfit boolean not null default false;

create unique index closet_items_one_starting_outfit
  on public.closet_items (user_id)
  where is_starting_outfit;
