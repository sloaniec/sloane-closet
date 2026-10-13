"use client";

import { useState, useTransition } from "react";
import { cutoutOnGreen } from "@/lib/green-screen";
import { pollUntilDone } from "@/lib/poll";
import { resizeToJpeg } from "@/lib/resize-image";
import { createClient } from "@/lib/supabase/client";
import { addPhoto, deletePhoto, setActivePhoto } from "./actions";

type CutoutView =
  | { status: "none" | "pending" | "failed" | "no_credits" }
  | { status: "completed"; cutoutUrl: string };

export function PhotoCard({
  id,
  url,
  isActive,
  greenScreen,
}: {
  id: string;
  url: string;
  isActive: boolean;
  greenScreen: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [cutting, setCutting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // "Cut me out": FASHN cuts her out once (1 credit), then the app puts the
  // cut-out on green and saves it as a new photo that becomes active.
  async function cutMeOut() {
    if (!confirm("Uses 1 credit.")) return;
    setNotice(null);
    setCutting(true);
    try {
      const view = await pollUntilDone(
        (await (
          await fetch(`/api/photos/${id}/cutout`, { method: "POST" })
        ).json()) as CutoutView,
        (v) => v.status === "pending",
        async () =>
          (await (
            await fetch(`/api/photos/${id}/cutout`, { cache: "no-store" })
          ).json()) as CutoutView,
      );
      if (view.status === "no_credits") {
        setNotice("Out of credits.");
      } else if (view.status === "pending") {
        setNotice("This is taking longer than usual. Try again in a minute.");
      } else if (view.status !== "completed") {
        setNotice("That didn't work, and it didn't use a credit. Try again?");
      } else {
        const supabase = createClient();
        const { data } = await supabase.auth.getClaims();
        const userId = data?.claims?.sub;
        if (!userId) throw new Error("signed out");
        const jpeg = await resizeToJpeg(await cutoutOnGreen(view.cutoutUrl));
        const path = `${userId}/person/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage
          .from("closet")
          .upload(path, jpeg, { contentType: "image/jpeg" });
        if (error) throw error;
        await addPhoto(path, { greenScreen: true });
      }
    } catch {
      setNotice("Something went wrong. Please try again.");
    }
    setCutting(false);
  }

  return (
    <figure
      className={`relative overflow-hidden rounded-2xl bg-shell shadow-sm ${
        isActive ? "ring-4 ring-gold" : "ring-1 ring-seaglass"
      } ${pending ? "opacity-60" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
      <img src={url} alt="" className="aspect-[2/3] w-full object-cover" />
      {isActive && (
        <span className="absolute left-2 top-2 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-tide shadow">
          Using this one
        </span>
      )}
      {greenScreen && (
        <span className="absolute right-2 top-2 rounded-full bg-shell/90 px-2 py-1 text-xs font-semibold text-seaglass-deep shadow">
          Cut out
        </span>
      )}
      {cutting && (
        <span className="absolute inset-0 flex items-center justify-center bg-sand/70 text-sm font-semibold backdrop-blur-sm">
          Cutting you out…
        </span>
      )}
      <figcaption className="flex flex-col gap-1 p-2 text-sm">
        {!greenScreen && (
          <button
            type="button"
            disabled={pending || cutting}
            onClick={() => void cutMeOut()}
            className="rounded-full bg-sunshine px-3 py-2 font-medium text-tide"
          >
            Cut me out
          </button>
        )}
        {notice && (
          <p role="alert" className="text-xs font-medium text-coral-orange">
            {notice}
          </p>
        )}
        {!isActive && (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => setActivePhoto(id))}
            className="rounded-full bg-seaglass px-3 py-2 font-medium text-tide"
          >
            Use this one
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Remove this photo?")) {
              startTransition(() => deletePhoto(id));
            }
          }}
          className="py-1 font-medium text-seaglass-deep"
        >
          Remove
        </button>
      </figcaption>
    </figure>
  );
}
