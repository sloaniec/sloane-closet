"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CreditLine } from "@/components/credit-line";
import {
  FillImage,
  sceneFor,
  shelvesFor,
  type Shelves,
} from "@/components/scenes";
import { keyOutGreen } from "@/lib/green-screen";
import { pollUntilDone } from "@/lib/poll";
import type { TryOnView } from "@/lib/tryons";
import { useCreditSummary } from "@/lib/use-credit-summary";

const HOLD_MS = 550;

export type Look = {
  id: string;
  baseId: string | null;
  path: string;
  itemIds: string[];
  imageUrl?: string;
};

export type RailItem = { id: string; title: string; imageUrl: string };

type Props = {
  sceneId: string | null;
  shelvesId: string | null;
  photo: { url: string; greenScreen: boolean } | null;
  items: RailItem[];
  startingItemId: string | null;
  startingLook: Look | null;
  initialLook: Look | null;
};

const ERRORS: Record<string, string> = {
  no_photo: "Add a photo of yourself in Profile first.",
  no_credits: "Out of credits.",
  bad_base:
    "That outfit is out of date. Starting again from your starting outfit.",
};

export function ClosetScene({
  sceneId,
  shelvesId,
  photo,
  items,
  startingItemId,
  startingLook,
  initialLook,
}: Props) {
  const scene = sceneFor(sceneId);
  const shelves = shelvesFor(shelvesId, scene);
  const [look, setLook] = useState<Look | null>(initialLook);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const summary = useCreditSummary(look?.id);

  // On a green-screen photo she stands in the scene; otherwise she shows
  // in the mirror.
  const figureSrc = look?.imageUrl ?? photo?.url ?? null;
  const [keyed, setKeyed] = useState<{ src: string; url: string } | null>(null);
  useEffect(() => {
    if (!photo?.greenScreen || !figureSrc) return;
    let url: string | null = null;
    let cancelled = false;
    keyOutGreen(figureSrc)
      .then((u) => {
        url = u;
        if (cancelled) URL.revokeObjectURL(u);
        else setKeyed({ src: figureSrc, url: u });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [figureSrc, photo?.greenScreen]);
  const standing =
    photo?.greenScreen && keyed?.src === figureSrc ? keyed.url : null;

  function showLook(next: Look | null) {
    setLook(next);
    window.history.replaceState(null, "", next ? `/?look=${next.id}` : "/");
  }

  async function run(
    body: { itemId: string; baseTryOnId: string | null; redo: boolean },
    itemIds: string[],
  ) {
    setWorking(true);
    setNotice(null);
    try {
      const res = await fetch("/api/tryons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        const { error } = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setNotice(
          ERRORS[error ?? ""] ?? "Something went wrong. Please try again.",
        );
        if (error === "bad_base") showLook(startingLook);
        return;
      }
      if (!res.ok) throw new Error();
      const view = await pollUntilDone(
        (await res.json()) as TryOnView,
        (v) => v.status === "pending",
        async (v) => {
          const next = await fetch(`/api/tryons/${v.id}`, {
            cache: "no-store",
          });
          return next.ok ? ((await next.json()) as TryOnView) : v;
        },
      );
      if (view.status === "completed" && view.resultUrl) {
        showLook({
          id: view.id,
          baseId: view.baseTryOnId,
          path: "",
          itemIds,
          imageUrl: view.resultUrl,
        });
      } else if (view.status === "pending") {
        setNotice("This is taking longer than usual. Check back in a minute.");
      } else {
        setNotice(
          view.error === "pose"
            ? "Try a clearer full-body photo. This one didn't use a credit."
            : "That didn't work, and it didn't use a credit. Try again?",
        );
      }
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  function putOn(item: RailItem) {
    if (working) return;
    if (!photo) return setNotice(ERRORS.no_photo);
    const wearing = look?.itemIds ?? [];
    if (wearing.includes(item.id)) {
      return setNotice("You're already wearing this.");
    }
    void run({ itemId: item.id, baseTryOnId: look?.id ?? null, redo: false }, [
      ...wearing,
      item.id,
    ]);
  }

  function backToStart() {
    if (working) return;
    if (startingLook) {
      setNotice(null);
      return showLook(startingLook);
    }
    if (startingItemId && photo) {
      showLook(null);
      void run({ itemId: startingItemId, baseTryOnId: null, redo: false }, [
        startingItemId,
      ]);
    }
  }

  function redo() {
    if (working || !look) return;
    if (!confirm("Uses 1 credit.")) return;
    void run(
      {
        itemId: look.itemIds[look.itemIds.length - 1],
        baseTryOnId: look.baseId,
        redo: true,
      },
      look.itemIds,
    );
  }

  const atStart = startingLook ? look?.id === startingLook.id : look === null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col">
      <div className="relative h-[54vh] min-h-[380px] w-full overflow-hidden rounded-b-3xl shadow-sm">
        <FillImage src={scene.image} priority />

        {/* Corners: Profile and add clothes */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link
            href="/profile"
            aria-label="Profile"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-shell/90 text-tide shadow"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
            </svg>
          </Link>
          <span className="rounded-full bg-shell/80 px-3 py-1 text-sm font-semibold tracking-tight shadow-sm">
            Sloane&apos;s Closet
          </span>
          <Link
            href="/add"
            aria-label="Add an item"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-sunshine text-3xl font-light leading-none text-tide shadow ring-2 ring-gold"
          >
            +
          </Link>
        </div>

        {/* Her */}
        {standing ? (
          <>
            <span className="absolute bottom-[5%] left-1/2 h-4 w-40 -translate-x-1/2 rounded-[50%] bg-tide/20 blur-md" />
            {/* eslint-disable-next-line @next/next/no-img-element -- generated cut-out */}
            <img
              src={standing}
              alt="You, in your current outfit"
              className="absolute bottom-[5%] left-1/2 z-10 h-[80%] w-auto max-w-none -translate-x-1/2 object-contain drop-shadow-xl"
            />
          </>
        ) : (
          <div className="absolute bottom-[7%] left-[24%] top-[17%] z-10 w-[52%] overflow-hidden rounded-t-full border-[6px] border-gold bg-shell shadow-xl ring-4 ring-shell">
            {figureSrc && !photo?.greenScreen ? (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
              <img
                src={figureSrc}
                alt="You, in your current outfit"
                className="h-full w-full object-cover object-top"
              />
            ) : !photo ? (
              <Link
                href="/profile"
                className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-seaglass-deep underline"
              >
                Add a photo of yourself
              </Link>
            ) : null}
          </div>
        )}

        {working && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-sand/50 backdrop-blur-[2px]">
            <span className="h-12 w-12 animate-spin rounded-full border-4 border-seaglass border-t-gold" />
            <span className="rounded-full bg-shell/90 px-4 py-1 text-lg font-semibold shadow">
              Getting you dressed…
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 px-4 pt-3">
        {notice && (
          <p
            role="alert"
            className="text-center text-sm font-medium text-coral-orange"
          >
            {notice}{" "}
            {notice === ERRORS.no_photo && (
              <Link href="/profile" className="underline">
                Go to Profile
              </Link>
            )}
          </p>
        )}

        {(startingItemId || look) && (
          <div className="flex justify-center gap-3">
            {startingItemId && !atStart && (
              <button
                type="button"
                disabled={working}
                onClick={backToStart}
                className="rounded-full bg-seaglass px-5 py-2 text-sm font-semibold text-tide shadow-sm transition active:scale-[0.98] disabled:opacity-60"
              >
                Back to PJs
              </button>
            )}
            {look && (
              <button
                type="button"
                disabled={working}
                onClick={redo}
                className="rounded-full bg-shell px-5 py-2 text-sm font-semibold text-tide shadow-sm ring-1 ring-seaglass transition active:scale-[0.98] disabled:opacity-60"
              >
                Redo
              </button>
            )}
          </div>
        )}

        {summary && <CreditLine summary={summary} />}

        {items.length === 0 ? (
          <p className="py-4 text-center">
            Add clothing item links to build the wardrobe.
          </p>
        ) : (
          <>
            <p className="text-center text-xs">
              Tap to put on · Hold for details
            </p>
            <ClosetRail shelves={shelves}>
              {items.map((item) => (
                <RailCard
                  key={item.id}
                  item={item}
                  hook={shelves.hook}
                  wearing={look?.itemIds.includes(item.id) ?? false}
                  onTap={() => putOn(item)}
                />
              ))}
            </ClosetRail>
          </>
        )}
        {!startingItemId && items.length > 0 && (
          <p className="text-center text-xs text-seaglass-deep">
            Hold a piece and tap &ldquo;Make this my starting outfit&rdquo; to
            start every visit wearing it.
          </p>
        )}
      </div>
    </div>
  );
}

// Tap puts it on; press and hold opens its details (with Shop).
function RailCard({
  item,
  hook,
  wearing,
  onTap,
}: {
  item: RailItem;
  hook: string;
  wearing: boolean;
  onTap: () => void;
}) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);

  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  return (
    <li className="flex w-20 shrink-0 snap-start flex-col items-center">
      {/* Hanger: hook over the rod, shoulders down to the clothes */}
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
      <button
        type="button"
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
        className={`block w-full origin-top select-none overflow-hidden rounded-xl bg-shell text-left shadow-md transition active:rotate-1 active:scale-95 [-webkit-touch-callout:none] ${
          wearing ? "ring-4 ring-gold" : "ring-1 ring-seaglass"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
        <img
          src={item.imageUrl}
          alt=""
          draggable={false}
          className="pointer-events-none aspect-[3/4] w-full object-cover"
        />
        <span className="block truncate px-2 py-1 text-xs font-medium">
          {item.title}
        </span>
      </button>
    </li>
  );
}

// The inside of a closet: Sloane's shelves picture, with her clothes
// hanging on hangers from its gold rod. Scrolls sideways along the rod.
function ClosetRail({
  shelves,
  children,
}: {
  shelves: Shelves;
  children: React.ReactNode;
}) {
  const { top, left, right } = shelves.rod;
  return (
    <div className="relative -mx-2 aspect-[665/450] overflow-hidden rounded-2xl shadow-md">
      <FillImage src={shelves.image} />
      <ul
        className="absolute bottom-0 flex snap-x gap-3 overflow-x-auto"
        style={{
          top: `calc(${top}% - 7px)`,
          left: `${left}%`,
          right: `${right}%`,
          paddingLeft: "4%",
          paddingRight: "4%",
        }}
      >
        {children}
      </ul>
    </div>
  );
}
