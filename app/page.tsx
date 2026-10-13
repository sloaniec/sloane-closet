import { Suspense } from "react";
import { kindInfo } from "@/lib/kinds";
import { getPreferences } from "@/lib/preferences";
import { createClient } from "@/lib/supabase/server";
import { getTryOn, type TryOnRow } from "@/lib/tryons";
import { ClosetScene, type Look, type RailItem } from "./closet-scene";

const SIGNED_URL_SECONDS = 60 * 60;
const MAX_LAYERS = 12;

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <main className="flex flex-1 flex-col pb-6">
      <Suspense
        fallback={
          <p className="mt-24 text-center text-sm">Opening your closet…</p>
        }
      >
        <SceneLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SceneLoader({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const { look: lookParam, mix: mixParam } = await searchParams;
  const supabase = await createClient();
  const prefs = await getPreferences(supabase);

  const [{ data: photo }, { data: items }] = await Promise.all([
    supabase
      .from("person_photos")
      .select("id, storage_path, green_screen")
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("closet_items")
      .select("id, title, image_path, is_starting_outfit, kind")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
  ]);
  const allItems = items ?? [];
  const startingItem = allItems.find((i) => i.is_starting_outfit) ?? null;

  // A finished try-on of this photo, with the items it's wearing (walking
  // back through the layers).
  async function lookFrom(row: TryOnRow | null): Promise<Look | null> {
    if (!row || !photo) return null;
    if (row.status !== "completed" || !row.result_path) return null;
    if (row.person_photo_id !== photo.id) return null;
    const itemIds = [row.item_id];
    const chain = [row.id];
    let base = row.base_tryon_id;
    for (let i = 0; base && i < MAX_LAYERS; i++) {
      const parent = await getTryOn(supabase, base);
      if (!parent) break;
      itemIds.unshift(parent.item_id);
      chain.unshift(parent.id);
      base = parent.base_tryon_id;
    }
    return {
      id: row.id,
      baseId: row.base_tryon_id,
      path: row.result_path,
      itemIds,
      chain,
    };
  }

  let startingLook: Look | null = null;
  if (photo && startingItem) {
    const { data: row } = await supabase
      .from("tryons")
      .select("id")
      .eq("item_id", startingItem.id)
      .eq("person_photo_id", photo.id)
      .is("base_tryon_id", null)
      .maybeSingle();
    startingLook = row
      ? await lookFrom(await getTryOn(supabase, row.id))
      : null;
  }
  const requested =
    typeof lookParam === "string"
      ? await lookFrom(await getTryOn(supabase, lookParam))
      : null;
  const current = requested ?? startingLook;

  // One batch of short-lived signed links for every picture on screen.
  const paths = [
    ...allItems.map((i) => i.image_path),
    ...(photo ? [photo.storage_path] : []),
    ...(current ? [current.path] : []),
    ...(startingLook ? [startingLook.path] : []),
  ];
  const { data: signed } = paths.length
    ? await supabase.storage
        .from("closet")
        .createSignedUrls(paths, SIGNED_URL_SECONDS)
    : { data: [] };
  const url = new Map(
    (signed ?? []).map((s) => [s.path, s.signedUrl] as const),
  );
  const withUrl = (look: Look | null) =>
    look ? { ...look, imageUrl: url.get(look.path) ?? "" } : null;

  const rail: RailItem[] = allItems.map((i) => ({
    id: i.id,
    title: i.title ?? "",
    imageUrl: url.get(i.image_path) ?? "",
    kind: i.kind,
    section: kindInfo(i.kind).section,
  }));

  return (
    <ClosetScene
      sceneId={prefs.scene}
      shelvesId={prefs.shelves}
      photo={
        photo
          ? {
              url: url.get(photo.storage_path) ?? "",
              greenScreen: photo.green_screen,
            }
          : null
      }
      items={rail}
      startingItemId={startingItem?.id ?? null}
      startingLook={withUrl(startingLook)}
      initialLook={withUrl(current)}
      initialMix={mixedOutfit(mixParam, allItems)}
    />
  );
}

// A mixed outfit in the link (`?mix=<item id>,<item id>`): the closet puts
// it together again in the browser. Only pieces still in her closet.
function mixedOutfit(param: unknown, items: { id: string }[]) {
  if (typeof param !== "string") return null;
  const ids = param.split(",").filter((id) => items.some((i) => i.id === id));
  return ids.length ? ids : null;
}
