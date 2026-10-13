"use client";

import { useTransition } from "react";
import { SCENES, SceneImage } from "@/components/scenes";
import { chooseScene } from "./scene-actions";

export function ScenePicker({ current }: { current: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      {SCENES.map((scene) => (
        <button
          key={scene.id}
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => chooseScene(scene.id))}
          className={`overflow-hidden rounded-2xl bg-shell text-left shadow-sm transition active:scale-[0.98] ${
            current === scene.id ? "ring-4 ring-gold" : "ring-1 ring-seaglass"
          }`}
        >
          <span className="relative block aspect-[3/4]">
            <SceneImage scene={scene} />
          </span>
          <span className="block px-3 py-2 text-sm font-medium">
            {scene.label}
          </span>
        </button>
      ))}
    </div>
  );
}
