"use client";

import { useTransition } from "react";
import { FillImage, SCENES, SHELVES } from "@/components/scenes";
import { chooseScene, chooseShelves } from "./scene-actions";

// Two rows of choices: the room she stands in, and the closet shelves her
// clothes hang in.
export function ScenePicker({
  scene,
  shelves,
}: {
  scene: string;
  shelves: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Choices
        options={SCENES}
        current={scene}
        aspect="aspect-[4/3]"
        disabled={pending}
        onPick={(id) => startTransition(() => chooseScene(id))}
      />
      <h3 className="mt-6 text-base font-semibold">Closet shelves</h3>
      <Choices
        options={SHELVES}
        current={shelves}
        aspect="aspect-[665/450]"
        disabled={pending}
        onPick={(id) => startTransition(() => chooseShelves(id))}
      />
    </>
  );
}

function Choices({
  options,
  current,
  aspect,
  disabled,
  onPick,
}: {
  options: { id: string; label: string; image: string }[];
  current: string;
  aspect: string;
  disabled: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(option.id)}
          className={`overflow-hidden rounded-2xl bg-shell text-left shadow-sm transition active:scale-[0.98] disabled:opacity-70 ${
            current === option.id ? "ring-4 ring-gold" : "ring-1 ring-seaglass"
          }`}
        >
          <span className={`relative block ${aspect}`}>
            <FillImage src={option.image} />
          </span>
          <span className="block px-3 py-2 text-sm font-medium">
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}
