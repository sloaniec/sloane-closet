-- 0004_item_kinds: what kind of clothing each item is, so the closet can
-- sort it into a section (tops on the rod, bottoms folded, shoes and hats
-- on shelves). Existing items are sorted from their FASHN category.

alter table public.closet_items
  add column kind text not null default 'top'
    check (kind in ('top', 'bottom', 'dress', 'outerwear', 'shoes', 'hat'));

update public.closet_items
set kind = case category
  when 'bottoms' then 'bottom'
  when 'one-pieces' then 'dress'
  else 'top'
end;
