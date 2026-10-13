"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { FillImage, type Shelves } from "@/components/scenes";
import type { SectionId } from "@/lib/kinds";

const HOLD_MS = 550;

export type RailItem = {
  id: string;
  title: string;
  imageUrl: string;
  kind: string;
  section: SectionId;
};

// The closet, top to bottom like a real one. Each section is a part of
// Sloane's cabinet picture.
export const SECTIONS: {
  id: SectionId;
  label: string;
  style: "hanging" | "shelf";
  part: keyof Shelves["parts"];
}[] = [
  { id: "hats", label: "Hats", style: "shelf", part: "hats" },
  { id: "tops", label: "Tops", style: "hanging", part: "hanging" },
  {
    id: "dresses",
    label: "Dresses & outerwear",
    style: "hanging",
    part: "hanging",
  },
  { id: "bottoms", label: "Bottoms", style: "shelf", part: "folded" },
  { id: "shoes", label: "Shoes", style: "shelf", part: "shoes" },
];

export function itemCardId(itemId: string) {
  return `closet-item-${itemId}`;
}

// Slides a section sideways so an item is in the middle, without moving
// the page.
export function scrollItemIntoView(itemId: string) {
  const el = document.getElementById(itemCardId(itemId));
  const strip = el?.closest("ul");
  if (!el || !strip) return;
  strip.scrollTo({
    left: el.offsetLeft - (strip.clientWidth - el.clientWidth) / 2,
    behavior: "smooth",
  });
}

export function ClosetSections({
  shelves,
  items,
  wearing,
  highlighted,
  onTap,
}: {
  shelves: Shelves;
  items: RailItem[];
  wearing: string[];
  highlighted: string | null;
  onTap: (item: RailItem) => void;
}) {
  return (
    <div className="-mx-2 flex flex-col overflow-hidden rounded-2xl shadow-md">
      {SECTIONS.map((section) => {
        const inSection = items.filter((i) => i.section === section.id);
        const hanging = section.style === "hanging";
        return (
          <section
            key={section.id}
            aria-label={section.label}
            className={`relative ${hanging ? "aspect-[665/310]" : "h-[104px]"}`}
          >
            <div className="absolute inset-0 [&_img]:object-bottom">
              <FillImage src={shelves.parts[section.part]} />
            </div>
            <span className="absolute left-2 top-1 z-10 pill px-2 py-0.5 text-[12px]">
              {section.label}
            </span>
            {inSection.length === 0 ? (
              <span className="absolute bottom-3 right-3 pill px-2 py-0.5 text-[12px] font-medium text-seaglass-deep">
                Nothing here yet
              </span>
            ) : (
              <ul
                className="absolute inset-x-0 flex snap-x gap-3 overflow-x-auto px-[6%]"
                style={
                  hanging
                    ? { top: `calc(${shelves.rodTop}% - 7px)`, bottom: 0 }
                    : { bottom: 6, top: 18, alignItems: "flex-end" }
                }
              >
                {inSection.map((item) => (
                  <ClosetCard
                    key={item.id}
                    item={item}
                    hanging={hanging}
                    hook={shelves.hook}
                    wearing={wearing.includes(item.id)}
                    highlighted={highlighted === item.id}
                    onTap={() => onTap(item)}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

// Tap: put it on (or open it, for shoes and hats). Press and hold: open
// its details, with Shop.
function ClosetCard({
  item,
  hanging,
  hook,
  wearing,
  highlighted,
  onTap,
}: {
  item: RailItem;
  hanging: boolean;
  hook: string;
  wearing: boolean;
  highlighted: boolean;
  onTap: () => void;
}) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);

  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  const ring = highlighted
    ? "ring-4 ring-sunshine"
    : wearing
      ? "ring-4 ring-gold"
      : "ring-1 ring-seaglass";

  return (
    <li
      id={itemCardId(item.id)}
      className={`flex shrink-0 snap-center flex-col items-center ${hanging ? "w-20" : "w-16"}`}
    >
      {hanging && (
        <svg
          viewBox="0 0 96 30"
          className="relative z-10 -mb-1 h-[26px] w-20"
          aria-hidden="true"
        >
          <path
            d="M48 22 V12 C48 6 56 6 56 11"
            fill="none"
            stroke={hook}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M48 22 L12 29 M48 22 L84 29"
            fill="none"
            stroke="#c98f62"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </svg>
      )}
      <button
        type="button"
        aria-label={item.title}
        onPointerDown={() => {
          held.current = false;
          cancel();
          timer.current = setTimeout(() => {
            held.current = true;
            router.push(`/items/${item.id}`);
          }, HOLD_MS);
        }}
        onPointerUp={() => {
          const wasHeld = held.current;
          cancel();
          if (!wasHeld) onTap();
        }}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
        className={`block w-full origin-top select-none overflow-hidden rounded-xl bg-shell text-left shadow-md transition active:scale-95 [-webkit-touch-callout:none] ${ring}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
        <img
          src={item.imageUrl}
          alt=""
          draggable={false}
          className={`pointer-events-none w-full object-cover ${hanging ? "aspect-[3/4]" : "aspect-square"}`}
        />
        {hanging && (
          <span className="block truncate px-2 py-1 text-xs font-medium">
            {item.title}
          </span>
        )}
      </button>
    </li>
  );
}
