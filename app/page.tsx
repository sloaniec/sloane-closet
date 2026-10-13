import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_SECONDS = 60 * 60;

export default function ClosetPage() {
  return (
    <main className="flex flex-1 flex-col px-6 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Sloane&apos;s Closet
        </h1>
        <Link
          href="/profile"
          className="text-sm font-medium text-seaglass-deep underline-offset-4 hover:underline"
        >
          Profile
        </Link>
      </header>
      <div className="mx-auto mt-2 h-1 w-full max-w-2xl rounded-full bg-gradient-to-r from-seaglass via-sunshine to-coral-orange" />

      <Suspense
        fallback={
          <p className="mt-10 text-center text-sm">Loading your closet…</p>
        }
      >
        <ClosetItems />
      </Suspense>

      <Link
        href="/add"
        aria-label="Add an item"
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 flex h-16 w-16 items-center justify-center rounded-full bg-sunshine text-4xl font-light text-tide shadow-lg ring-2 ring-gold transition active:scale-95"
      >
        +
      </Link>
    </main>
  );
}

async function ClosetItems() {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("closet_items")
    .select("id, title, store, price_text, image_path")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="mt-10 text-center text-sm text-coral-orange">
        Couldn&apos;t load your closet. Try again in a moment.
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center text-center">
        <div className="rounded-3xl bg-shell/80 px-8 py-10 shadow-sm ring-1 ring-seaglass">
          <p className="text-lg">
            Add clothing item links to build the wardrobe.
          </p>
        </div>
      </section>
    );
  }

  // Show the try-on photo (for the active photo of her) when there is one.
  const { data: photo } = await supabase
    .from("person_photos")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();
  const tryOnPathByItem = new Map<string, string>();
  if (photo) {
    const { data: tryOns } = await supabase
      .from("tryons")
      .select("item_id, result_path")
      .eq("person_photo_id", photo.id)
      .not("result_path", "is", null);
    for (const t of tryOns ?? []) tryOnPathByItem.set(t.item_id, t.result_path);
  }
  const pathFor = (item: { id: string; image_path: string }) =>
    tryOnPathByItem.get(item.id) ?? item.image_path;

  const { data: signed } = await supabase.storage
    .from("closet")
    .createSignedUrls(items.map(pathFor), SIGNED_URL_SECONDS);
  const urlByPath = new Map(
    (signed ?? []).map((s) => [s.path, s.signedUrl] as const),
  );

  return (
    <ul className="mx-auto mt-6 grid w-full max-w-2xl grid-cols-2 gap-4">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/items/${item.id}`}
            className="block overflow-hidden rounded-2xl bg-shell shadow-sm ring-1 ring-seaglass transition active:scale-[0.98]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
            <img
              src={urlByPath.get(pathFor(item)) ?? ""}
              alt=""
              className="aspect-[3/4] w-full bg-sand object-cover"
            />
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-semibold">{item.title}</p>
              {(item.store || item.price_text) && (
                <p className="mt-1 text-xs text-seaglass-deep">
                  {[item.store, item.price_text].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
