import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { PhotoCard } from "./photo-card";
import { ScenePicker } from "./scene-picker";
import { UploadPhotos } from "./upload-photos";

const SIGNED_URL_SECONDS = 60 * 60;

export default function ProfilePage() {
  return (
    <main className="flex flex-1 flex-col px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between">
        <Link href="/" className="text-sm font-medium text-seaglass-deep">
          ← Closet
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <span className="w-14" />
      </header>
      <div className="mx-auto mt-2 h-1 w-full max-w-2xl rounded-full bg-gradient-to-r from-seaglass via-sunshine to-coral-orange" />

      <section className="mx-auto mt-6 w-full max-w-2xl">
        <h2 className="text-lg font-semibold">My photos</h2>
        <div className="mt-3 rounded-2xl bg-shell/80 p-4 text-sm ring-1 ring-seaglass">
          <p className="font-medium">Best results:</p>
          <ul className="mt-1 list-disc pl-5">
            <li>Full body, head to toe</li>
            <li>Facing forward</li>
            <li>Good light</li>
            <li>Simple background</li>
            <li>Fitted clothes</li>
          </ul>
        </div>

        <div className="mt-5">
          <UploadPhotos />
        </div>

        <Suspense
          fallback={<p className="mt-6 text-center text-sm">Loading photos…</p>}
        >
          <PhotoGrid />
        </Suspense>
      </section>

      <section className="mx-auto mt-10 w-full max-w-2xl">
        <h2 className="text-lg font-semibold">Background</h2>
        <Suspense
          fallback={<p className="mt-3 text-center text-sm">Loading…</p>}
        >
          <SceneSection />
        </Suspense>
      </section>

      <form action={signOut} className="mx-auto mt-12">
        <button
          type="submit"
          className="text-sm font-medium text-seaglass-deep underline-offset-4 hover:underline"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}

async function PhotoGrid() {
  const supabase = await createClient();
  const { data: photos, error } = await supabase
    .from("person_photos")
    .select("id, storage_path, is_active, green_screen")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="mt-6 text-center text-sm text-coral-orange">
        Couldn&apos;t load your photos. Try again in a moment.
      </p>
    );
  }
  if (photos.length === 0) {
    return <p className="mt-6 text-center text-sm">No photos yet.</p>;
  }

  const { data: signed } = await supabase.storage
    .from("closet")
    .createSignedUrls(
      photos.map((p) => p.storage_path),
      SIGNED_URL_SECONDS,
    );
  const urlByPath = new Map(
    (signed ?? []).map((s) => [s.path, s.signedUrl] as const),
  );

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
      {photos.map((photo) => {
        const url = urlByPath.get(photo.storage_path);
        return url ? (
          <PhotoCard
            key={photo.id}
            id={photo.id}
            url={url}
            isActive={photo.is_active}
            greenScreen={photo.green_screen}
          />
        ) : null;
      })}
    </div>
  );
}

async function SceneSection() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const scene = (data?.claims?.user_metadata as { scene?: string } | undefined)
    ?.scene;
  return <ScenePicker current={scene ?? "ocean-closet"} />;
}
