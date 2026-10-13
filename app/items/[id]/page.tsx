import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTryOn, refreshTryOn, toView, type TryOnView } from "@/lib/tryons";
import { ItemView } from "./item-view";

const SIGNED_URL_SECONDS = 60 * 60;

export default function ItemPage({ params }: PageProps<"/items/[id]">) {
  return (
    <main className="flex flex-1 flex-col px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between">
        <Link href="/" className="text-sm font-medium text-seaglass-deep">
          ← Closet
        </Link>
      </header>
      <Suspense
        fallback={<p className="mt-10 text-center text-sm">Loading…</p>}
      >
        <Item params={params} />
      </Suspense>
    </main>
  );
}

async function Item({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("closet_items")
    .select(
      "id, title, store, price_text, product_url, image_path, is_starting_outfit",
    )
    .eq("id", id)
    .maybeSingle();
  if (!item) notFound();

  const { data: photo } = await supabase
    .from("person_photos")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();

  let tryOn: TryOnView | null = null;
  if (photo) {
    const { data: row } = await supabase
      .from("tryons")
      .select("id")
      .eq("item_id", item.id)
      .eq("person_photo_id", photo.id)
      .is("base_tryon_id", null)
      .maybeSingle();
    const full = row ? await getTryOn(supabase, row.id) : null;
    if (full)
      tryOn = await toView(supabase, await refreshTryOn(supabase, full));
  }

  const { data: signed } = await supabase.storage
    .from("closet")
    .createSignedUrl(item.image_path, SIGNED_URL_SECONDS);

  return (
    <ItemView
      item={{
        id: item.id,
        title: item.title ?? "",
        details: [item.store, item.price_text].filter(Boolean).join(" · "),
        productUrl: item.product_url,
        imageUrl: signed?.signedUrl ?? "",
      }}
      hasPhoto={Boolean(photo)}
      isStartingOutfit={item.is_starting_outfit}
      initialTryOn={tryOn}
    />
  );
}
