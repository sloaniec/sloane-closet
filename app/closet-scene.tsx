"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CreditLine } from "@/components/credit-line";
import {
  ClosetSections,
  scrollItemIntoView,
  type RailItem,
} from "@/components/closet-sections";
import {
  ButtonArt,
  FillImage,
  sceneFor,
  shelvesFor,
} from "@/components/scenes";
import { composeOutfit } from "@/lib/compose";
import { keyOutGreen } from "@/lib/green-screen";
import { canTryOn } from "@/lib/kinds";
import { Wardrobe, outfitWith, wearOrder, type Finished } from "@/lib/mix";
import { wornItems } from "@/lib/outfit";
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
  mixed?: boolean; // made in the browser from several try-ons
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
  initialMix: string[] | null;
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
  initialMix,
}: Props) {
  const scene = sceneFor(sceneId);
  const shelves = shelvesFor(shelvesId, scene);
  const [look, setLook] = useState<Look | null>(initialLook);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [browse, setBrowse] = useState<Browse>(null);
  const landedOn = useRef<string | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [runs, setRuns] = useState(0);
  const router = useRouter();

  // What she's actually wearing: later pieces replace earlier ones of the
  // same type.
  const kindById = new Map(items.map((i) => [i.id, i.kind]));
  const kindOf = (id: string) => kindById.get(id);
  const worn = look ? wornItems(look.itemIds, kindOf) : [];
  const summary = useCreditSummary(runs);

  // Every finished try-on of her photo, loaded once. Everything free
  // (saved outfits and mixes) is worked out from these.
  const wardrobe = useRef<Promise<Wardrobe> | null>(null);
  function getWardrobe() {
    wardrobe.current ??= fetch("/api/tryons/looks", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<Finished[]>) : []))
      .catch(() => [] as Finished[])
      .then((looks) => new Wardrobe(looks, kindOf));
    return wardrobe.current;
  }

  // On a green-screen photo she stands in the scene; otherwise she shows
  // in the mirror. Pictures are prepared once (green removed) and kept, so
  // switching outfits is instant. The current picture stays up until the
  // next one is ready.
  const figureSrc = look?.imageUrl ?? photo?.url ?? null;
  const prepared = useRef(new Map<string, Promise<string>>());
  function prepare(url: string): Promise<string> {
    if (!photo?.greenScreen) return Promise.resolve(url);
    let ready = prepared.current.get(url);
    if (!ready) {
      ready = keyOutGreen(url);
      ready.catch(() => prepared.current.delete(url));
      prepared.current.set(url, ready);
    }
    return ready;
  }
  const [standing, setStanding] = useState<{ src: string; url: string } | null>(
    null,
  );
  useEffect(() => {
    if (!photo?.greenScreen || !figureSrc) return;
    let current = true;
    prepare(figureSrc)
      .then((url) => {
        if (current) setStanding({ src: figureSrc, url });
      })
      .catch(() => {});
    return () => {
      current = false;
    };
    // prepare() is stable in effect for a given photo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figureSrc, photo?.greenScreen]);

  // Mixed outfits, kept so going back to one is instant.
  const mixes = useRef(new Map<string, Promise<string>>());
  function mixPicture(
    w: Wardrobe,
    plan: NonNullable<ReturnType<Wardrobe["mixPlan"]>>,
  ): Promise<string> {
    const urlOf = (id: string | null) =>
      (id && w.get(id)?.resultUrl) || photo?.url || "";
    const startUrl = urlOf(plan.start);
    const layers = plan.layers.map((l) => ({
      url: l.resultUrl,
      baseUrl: urlOf(l.baseTryOnId),
      kind: kindOf(l.itemId),
    }));
    const key = [startUrl, ...layers.map((l) => l.url)].join("|");
    let ready = mixes.current.get(key);
    if (!ready) {
      ready = composeOutfit(startUrl, layers).then((blob) =>
        URL.createObjectURL(blob),
      );
      ready.catch(() => mixes.current.delete(key));
      mixes.current.set(key, ready);
    }
    return ready;
  }

  function savedLook(w: Wardrobe, id: string): Look {
    const found = w.get(id)!;
    return {
      id,
      baseId: found.baseTryOnId,
      path: "",
      itemIds: w.itemIdsOf(id) ?? [found.itemId],
      chain: w.chainOf(id) ?? [id],
      imageUrl: found.resultUrl,
    };
  }

  // The outfit as a picture without FASHN: a saved try-on of exactly
  // these pieces, or a mix of the pieces' own try-ons. Null when a piece
  // hasn't been tried on yet.
  async function freeLook(outfit: string[]): Promise<Look | null> {
    const w = await getWardrobe();
    const found = w.exact(outfit, look && !look.mixed ? look.id : null);
    if (found) return savedLook(w, found.id);
    const plan = photo ? w.mixPlan(outfit, startingLook?.id ?? null) : null;
    if (!plan) return null;
    const ordered = wearOrder(outfit, kindOf);
    return {
      id: `mix:${ordered.join(",")}`,
      baseId: null,
      path: "",
      itemIds: ordered,
      chain: [],
      imageUrl: await mixPicture(w, plan),
      mixed: true,
    };
  }

  // Shows the outfit for free if it can. Returns false when it needs a new
  // try-on. Only the latest request wins, so quick taps can't land out of
  // order; `stillWanted` lets a slow answer be ignored too.
  const latest = useRef(0);
  async function wearFree(
    outfit: string[],
    stillWanted: () => boolean = () => true,
  ): Promise<boolean> {
    const ticket = ++latest.current;
    let next: Look | null;
    try {
      next = await freeLook(outfit);
    } catch {
      if (ticket === latest.current) {
        setNotice("Couldn't put that outfit together. Try again?");
      }
      return true;
    }
    if (!next) return false;
    await prepare(next.imageUrl!).catch(() => {});
    if (ticket !== latest.current || !stillWanted()) return true;
    setNotice(null);
    showLook(next);
    return true;
  }

  // Get an outfit ready ahead of time (for the next arrow tap).
  function warmUp(outfit: string[]) {
    freeLook(outfit)
      .then((next) => next?.imageUrl && prepare(next.imageUrl))
      .catch(() => {});
  }

  function showLook(next: Look | null) {
    setLook(next);
    window.history.replaceState(
      null,
      "",
      !next
        ? "/"
        : next.mixed
          ? `/?mix=${next.itemIds.join(",")}`
          : `/?look=${next.id}`,
    );
  }

  // One FASHN try-on (or a saved one, if the server has it). Returns the
  // finished look, or null with a message shown.
  async function tryOn(body: {
    itemId: string;
    baseTryOnId: string | null;
    redo: boolean;
  }): Promise<Finished | null> {
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
        if (error === "bad_base") {
          wardrobe.current = null;
          showLook(startingLook);
        }
        return null;
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
        const finished = {
          id: view.id,
          itemId: view.itemId,
          baseTryOnId: view.baseTryOnId,
          resultUrl: view.resultUrl,
        };
        (await getWardrobe()).add(finished);
        setRuns((n) => n + 1);
        return finished;
      }
      setNotice(
        view.status === "pending"
          ? "This is taking longer than usual. Check back in a minute."
          : view.error === "pose"
            ? "Try a clearer full-body photo. This one didn't use a credit."
            : "That didn't work, and it didn't use a credit. Try again?",
      );
    } catch {
      setNotice("Something went wrong. Please try again.");
    }
    return null;
  }

  // Shows a saved look, with its picture ready first.
  async function showSaved(id: string) {
    const w = await getWardrobe();
    const next = savedLook(w, id);
    await prepare(next.imageUrl!).catch(() => {});
    latest.current++;
    showLook(next);
  }

  // Arrows: step through a section. A piece that's free to wear (saved or
  // mixable) goes straight on; otherwise "Put on" shows.
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

    const item = list[index];
    landedOn.current = item.id;
    if (photo && canTryOn(item.kind) && !worn.includes(item.id)) {
      setChecking(item.id);
      void wearFree(
        outfitWith(worn, item.id, kindOf),
        () => landedOn.current === item.id,
      ).finally(() => setChecking((c) => (c === item.id ? null : c)));
    }
    // Get the next one in this direction ready too.
    const next = list[(index + delta + list.length) % list.length];
    if (photo && canTryOn(next.kind) && !worn.includes(next.id)) {
      warmUp(outfitWith(worn, next.id, kindOf));
    }
  }
  const browsing = browse
    ? items.filter((i) => i.section === browse.section)[browse.index]
    : null;

  // Once the piece the arrows landed on is on, its "Wearing" card fades
  // away after a few seconds. A "Put on" card stays until she decides.
  const WEARING_CARD_MS = 3000;
  const wearingCard =
    browsing && checking !== browsing.id && worn.includes(browsing.id)
      ? browsing.id
      : null;
  useEffect(() => {
    if (!wearingCard) return;
    const timer = setTimeout(() => setBrowse(null), WEARING_CARD_MS);
    return () => clearTimeout(timer);
  }, [wearingCard]);

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
    const outfit = outfitWith(worn, item.id, kindOf);
    void (async () => {
      if (await wearFree(outfit)) return;
      // A piece she hasn't tried on yet: one try-on (1 credit), on the
      // saved look closest to the new outfit. Then mix if needed.
      setWorking(true);
      const w = await getWardrobe();
      const base = w.closest(outfit)?.id ?? startingLook?.id ?? null;
      const done = await tryOn({
        itemId: item.id,
        baseTryOnId: base,
        redo: false,
      });
      if (done) await wearFree(outfit);
      setWorking(false);
    })();
  }

  // A mixed outfit as a real try-on picture: puts the pieces on one at a
  // time, reusing any steps already saved. Says the cost first.
  async function makeExact() {
    if (working || !look?.mixed) return;
    const outfit = worn;
    const w = await getWardrobe();
    const plan = w.exactPlan(outfit, startingLook?.id ?? null);
    if (
      plan.runs > 0 &&
      !confirm(`Uses ${plan.runs} credit${plan.runs === 1 ? "" : "s"}.`)
    ) {
      return;
    }
    setWorking(true);
    let base = plan.start;
    let finished = true;
    for (const itemId of plan.itemIds) {
      const next =
        w.step(base, itemId) ??
        (await tryOn({ itemId, baseTryOnId: base, redo: false }));
      if (!next) {
        finished = false; // the message is already showing
        break;
      }
      base = next.id;
    }
    if (finished && base) await showSaved(base);
    setWorking(false);
  }

  function backToStart() {
    if (working) return;
    if (startingLook) {
      setNotice(null);
      latest.current++;
      return showLook(startingLook);
    }
    if (startingItemId && photo) {
      latest.current++;
      showLook(null);
      setWorking(true);
      void tryOn({ itemId: startingItemId, baseTryOnId: null, redo: false })
        .then((done) => (done ? showSaved(done.id) : undefined))
        .finally(() => setWorking(false));
    }
  }

  function redo() {
    if (working || !look || look.mixed) return;
    if (!confirm("Uses 1 credit.")) return;
    setWorking(true);
    void tryOn({
      itemId: look.itemIds[look.itemIds.length - 1],
      baseTryOnId: look.baseId,
      redo: true,
    })
      .then((done) => (done ? showSaved(done.id) : undefined))
      .finally(() => setWorking(false));
  }

  // Load the try-ons when the closet opens (and rebuild a mixed outfit
  // from the link).
  useEffect(() => {
    if (!photo) return;
    void getWardrobe().then(() => {
      if (initialMix) void wearFree(initialMix);
    });
    // Runs once when the closet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atStart = startingLook ? look?.id === startingLook.id : look === null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col">
      <div className="relative h-[54vh] min-h-[380px] w-full overflow-hidden rounded-b-3xl shadow-sm">
        <FillImage src={scene.image} priority />

        {/* Corners: Profile and add clothes */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link href="/profile" aria-label="Profile" className="btn-round">
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
          <Image
            src={scene.sign.src}
            alt="Sloane's Closet"
            width={scene.sign.width}
            height={scene.sign.height}
            priority
            sizes={`${scene.sign.shown}px`}
            style={{ width: `min(${scene.sign.shown}px, 50vw)` }}
            className="h-auto drop-shadow-md"
          />
          <Link
            href="/add"
            aria-label="Add an item"
            className="btn-round"
          >
            {/* Drawn, not typed, so it sits exactly in the middle in any font. */}
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>

        {/* Her */}
        {photo?.greenScreen ? (
          standing && (
            <>
              <span className="absolute bottom-[5%] left-1/2 h-4 w-40 -translate-x-1/2 rounded-[50%] bg-tide/20 blur-md" />
              {/* eslint-disable-next-line @next/next/no-img-element -- generated cut-out */}
              <img
                src={standing.url}
                alt="You, in your current outfit"
                className="absolute bottom-[5%] left-1/2 z-10 h-[76%] w-auto max-w-none -translate-x-1/2 object-contain drop-shadow-xl"
              />
            </>
          )
        ) : (
          <div className="absolute bottom-[7%] left-[24%] top-[21%] z-10 w-[52%] overflow-hidden rounded-t-full border-[6px] border-gold bg-shell shadow-xl ring-4 ring-shell">
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

        {look?.mixed && (
          <span
            className="absolute left-4 top-[15%] z-20 pill"
            title="Put together from your try-ons. Make it exact for a new picture."
          >
            Mixed
          </span>
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
                    className={
                      scene.arrows
                        ? "pointer-events-auto block h-12 w-12 rounded-full transition active:scale-90 disabled:opacity-50"
                        : "btn-round pointer-events-auto text-2xl"
                    }
                  >
                    {scene.arrows ? (
                      <ButtonArt
                        src={
                          delta === -1 ? scene.arrows.prev : scene.arrows.next
                        }
                      />
                    ) : delta === -1 ? (
                      "‹"
                    ) : (
                      "›"
                    )}
                  </button>
                ))}
              </div>
            ) : null,
          )}

        {/* What the arrows landed on, with Put on */}
        {browsing && !working && (
          <div
            key={wearingCard ?? "card"}
            className={`absolute left-1/2 z-20 flex w-[min(15rem,70%)] -translate-x-1/2 items-center gap-2 rounded-2xl border-[1.5px] border-gold bg-white p-2 shadow-lg ${
              wearingCard ? "animate-fade-away" : ""
            }`}
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
            {checking === browsing.id ? (
              <span className="shrink-0 px-3 text-lg text-seaglass-deep">
                …
              </span>
            ) : worn.includes(browsing.id) ? (
              <span className="shrink-0 px-2 text-xs text-seaglass-deep">
                Wearing
              </span>
            ) : (
              <button
                type="button"
                onClick={() => putOn(browsing)}
                className="btn shrink-0 px-3 py-1.5 text-sm"
              >
                Put on
              </button>
            )}
          </div>
        )}

        {working && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-sand/50 backdrop-blur-[2px]">
            <span className="h-12 w-12 animate-spin rounded-full border-4 border-seaglass border-t-gold" />
            <span className="pill px-4 text-lg">Getting you dressed…</span>
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
                className="btn py-2 text-base"
              >
                Back to PJs
              </button>
            )}
            {look?.mixed ? (
              <button
                type="button"
                disabled={working}
                onClick={() => void makeExact()}
                className="btn py-2 text-base"
              >
                Make it exact
              </button>
            ) : (
              look && (
                <button
                  type="button"
                  disabled={working}
                  onClick={redo}
                  className="btn py-2 text-base"
                >
                  Redo
                </button>
              )
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
