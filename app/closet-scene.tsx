"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditLine } from "@/components/credit-line";
import {
  ClosetSections,
  scrollItemIntoView,
  type RailItem,
} from "@/components/closet-sections";
import { FillImage, sceneFor, shelvesFor } from "@/components/scenes";
import { canTryOn } from "@/lib/kinds";
import { stepToReturnTo, wornItems } from "@/lib/outfit";
import { keyOutGreen } from "@/lib/green-screen";
import { pollUntilDone } from "@/lib/poll";
import type { TryOnView } from "@/lib/tryons";
import { useCreditSummary } from "@/lib/use-credit-summary";

export type Look = {
  id: string;
  baseId: string | null;
  path: string;
  itemIds: string[]; // every piece put on, in order
  chain: string[]; // the saved look after each of those steps
  imageUrl?: string;
};

export type { RailItem };

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
  not_wearable: "Shoes and hats can't be tried on yet.",
};

// The arrows beside her browse these sections.
const ARROW_ROWS = [
  { section: "tops", label: "tops", top: "36%" },
  { section: "bottoms", label: "bottoms", top: "64%" },
] as const;
type Browse = { section: "tops" | "bottoms"; index: number } | null;

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
  const [browse, setBrowse] = useState<Browse>(null);
  const router = useRouter();

  // What she's actually wearing: later pieces replace earlier ones of the
  // same type.
  const kindById = new Map(items.map((i) => [i.id, i.kind]));
  const kindOf = (id: string) => kindById.get(id);
  const worn = look ? wornItems(look.itemIds, kindOf) : [];

  // Arrows: step through a section without putting anything on. Starts
  // from the piece she's wearing, if any. Free; only "Put on" spends.
  function step(section: "tops" | "bottoms", delta: 1 | -1) {
    const list = items.filter((i) => i.section === section);
    if (list.length === 0) return;
    const from =
      browse?.section === section
        ? browse.index
        : Math.max(
            -1,
            list.findIndex((i) => worn.includes(i.id)),
          );
    const index =
      from === -1 && delta === -1
        ? list.length - 1
        : (from + delta + list.length) % list.length;
    setBrowse({ section, index });
    scrollItemIntoView(list[index].id);
  }
  const browsing = browse
    ? items.filter((i) => i.section === browse.section)[browse.index]
    : null;
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
    chainBefore: string[],
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
          chain: [...chainBefore, view.id],
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
    setBrowse(null);
    if (!canTryOn(item.kind)) {
      router.push(`/items/${item.id}`);
      return;
    }
    if (!photo) return setNotice(ERRORS.no_photo);
    if (worn.includes(item.id)) {
      return setNotice("You're already wearing this.");
    }
    // Switching back to a piece she just had on: reuse that saved look.
    const back = look ? stepToReturnTo(look.itemIds, item.id, kindOf) : -1;
    if (look && back >= 0) {
      void returnTo(look, back);
      return;
    }
    void run(
      { itemId: item.id, baseTryOnId: look?.id ?? null, redo: false },
      [...(look?.itemIds ?? []), item.id],
      look?.chain ?? [],
    );
  }

  // Shows an earlier saved step of this outfit. Free: no FASHN call.
  async function returnTo(from: Look, index: number) {
    setWorking(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/tryons/${from.chain[index]}`, {
        cache: "no-store",
      });
      const view = res.ok ? ((await res.json()) as TryOnView) : null;
      if (view?.status !== "completed" || !view.resultUrl) throw new Error();
      showLook({
        id: view.id,
        baseId: index > 0 ? from.chain[index - 1] : null,
        path: "",
        itemIds: from.itemIds.slice(0, index + 1),
        chain: from.chain.slice(0, index + 1),
        imageUrl: view.resultUrl,
      });
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  function backToStart() {
    if (working) return;
    if (startingLook) {
      setNotice(null);
      return showLook(startingLook);
    }
    if (startingItemId && photo) {
      showLook(null);
      void run(
        { itemId: startingItemId, baseTryOnId: null, redo: false },
        [startingItemId],
        [],
      );
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
      look.chain.slice(0, -1),
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

        {/* Arrows beside her: browse tops (upper) and bottoms (lower) */}
        {photo &&
          ARROW_ROWS.map((row) =>
            items.some((i) => i.section === row.section) ? (
              <div
                key={row.section}
                className="pointer-events-none absolute inset-x-2 z-20 flex justify-between"
                style={{ top: row.top }}
              >
                {([-1, 1] as const).map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    disabled={working}
                    onClick={() => step(row.section, delta)}
                    aria-label={`${delta === -1 ? "Previous" : "Next"} ${row.label}`}
                    className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-shell/90 text-2xl leading-none text-tide shadow ring-1 ring-seaglass transition active:scale-90 disabled:opacity-50"
                  >
                    {delta === -1 ? "‹" : "›"}
                  </button>
                ))}
              </div>
            ) : null,
          )}

        {/* What the arrows landed on, with Put on */}
        {browsing && !working && (
          <div
            className="absolute left-1/2 z-20 flex w-[min(15rem,70%)] -translate-x-1/2 items-center gap-2 rounded-2xl bg-shell/95 p-2 shadow-lg ring-1 ring-seaglass"
            style={{ bottom: "3%" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
            <img
              src={browsing.imageUrl}
              alt=""
              className="h-14 w-11 shrink-0 rounded-lg object-cover"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {browsing.title}
            </span>
            {worn.includes(browsing.id) ? (
              <span className="shrink-0 px-2 text-xs text-seaglass-deep">
                Wearing
              </span>
            ) : (
              <button
                type="button"
                onClick={() => putOn(browsing)}
                className="shrink-0 rounded-full bg-sunshine px-3 py-2 text-sm font-semibold text-tide shadow-sm"
              >
                Put on
              </button>
            )}
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
              Tap to put on · Hold for details · Arrows browse tops &amp;
              bottoms
            </p>
            <ClosetSections
              shelves={shelves}
              items={items}
              wearing={worn}
              highlighted={browsing?.id ?? null}
              onTap={putOn}
            />
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
