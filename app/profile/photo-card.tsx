"use client";

import { useTransition } from "react";
import { deletePhoto, setActivePhoto } from "./actions";

export function PhotoCard({
  id,
  url,
  isActive,
}: {
  id: string;
  url: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

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
      <figcaption className="flex flex-col gap-1 p-2 text-sm">
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
