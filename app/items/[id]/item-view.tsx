"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { CreditLine } from "@/components/credit-line";
import { useCreditSummary } from "@/lib/use-credit-summary";
import type { TryOnView } from "@/lib/tryons";
import { KINDS, canTryOn } from "@/lib/kinds";
import { removeItem, setItemKind, setStartingOutfit } from "./actions";

const POLL_MS = 2000;
const POLL_LIMIT_MS = 60_000;
const OUT_OF_CREDITS = "Out of credits.";

type Props = {
  item: {
    id: string;
    title: string;
    details: string;
    productUrl: string;
    imageUrl: string;
  };
  hasPhoto: boolean;
  isStartingOutfit: boolean;
  kind: string;
  initialTryOn: TryOnView | null;
};

export function ItemView({
  item,
  hasPhoto,
  isStartingOutfit,
  kind,
  initialTryOn,
}: Props) {
  const [savingKind, startSavingKind] = useTransition();
  const [removing, startRemoving] = useTransition();
  const wearable = canTryOn(kind);
  const [savingStart, startSavingStart] = useTransition();
  const [tryOn, setTryOn] = useState<TryOnView | null>(initialTryOn);
  const [showOriginal, setShowOriginal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const pollStarted = useRef<number | null>(null);
  // Credits left and spending, loaded on open and after each finished run.
  const summary = useCreditSummary(
    tryOn?.status === "completed" ? tryOn.resultUrl : null,
  );
  const outOfCredits =
    summary !== null && summary.credits !== null && summary.credits <= 0;

  const working = starting || tryOn?.status === "pending";
  const resultUrl = tryOn?.resultUrl ?? null;
  const showingResult = Boolean(resultUrl) && !showOriginal && !working;

  // While a try-on is running, ask every 2 seconds for up to a minute.
  const poll = useCallback(async (id: string) => {
    const res = await fetch(`/api/tryons/${id}`, { cache: "no-store" });
    if (!res.ok) return;
    setTryOn((await res.json()) as TryOnView);
  }, []);

  useEffect(() => {
    if (tryOn?.status !== "pending") {
      pollStarted.current = null;
      return;
    }
    pollStarted.current ??= Date.now();
    const timer = setTimeout(() => {
      if (Date.now() - (pollStarted.current ?? 0) > POLL_LIMIT_MS) {
        setNotice("This is taking longer than usual. Check back in a minute.");
      } else {
        void poll(tryOn.id);
      }
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [tryOn, poll]);

  const failure =
    tryOn?.status === "failed"
      ? tryOn.error === "pose"
        ? "Try a clearer full-body photo. This one didn't use a credit."
        : "That didn't work, and it didn't use a credit. Try again?"
      : null;
  const message = notice ?? failure;

  async function start(redo: boolean) {
    if (outOfCredits) {
      setNotice(OUT_OF_CREDITS);
      return;
    }
    if (redo && !confirm("Uses 1 credit.")) return;
    setNotice(null);
    setShowOriginal(false);
    setStarting(true);
    try {
      const res = await fetch("/api/tryons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: item.id, redo }),
      });
      if (res.status === 409) {
        const { error } = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setNotice(
          error === "no_credits"
            ? OUT_OF_CREDITS
            : "Add a photo of yourself in Profile first.",
        );
      } else if (!res.ok) {
        setNotice("Something went wrong. Please try again.");
      } else {
        pollStarted.current = null;
        setTryOn((await res.json()) as TryOnView);
      }
    } catch {
      setNotice("Something went wrong. Please try again.");
    }
    setStarting(false);
  }

  const canFlip = Boolean(resultUrl) && !working;

  return (
    <div className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4">
      <button
        type="button"
        disabled={!canFlip}
        onClick={() => setShowOriginal((v) => !v)}
        className="relative overflow-hidden rounded-3xl bg-shell shadow-sm ring-1 ring-seaglass"
        aria-label={canFlip ? "Switch between try-on and original" : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
        <img
          src={showingResult ? resultUrl! : item.imageUrl}
          alt=""
          className="aspect-[2/3] w-full object-cover"
        />
        {canFlip && (
          <span className="absolute left-3 top-3 pill">
            {showingResult ? "On me" : "Original"}
          </span>
        )}
        {working && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-sand/70 backdrop-blur-sm">
            <span className="h-12 w-12 animate-spin rounded-full border-4 border-seaglass border-t-gold" />
            <span className="text-lg font-semibold">Getting you dressed…</span>
          </span>
        )}
      </button>
      {canFlip && (
        <p className="-mt-2 text-center text-xs">Tap the picture to compare</p>
      )}

      <div>
        <h1 className="text-xl font-bold">{item.title}</h1>
        {item.details && (
          <p className="mt-1 text-sm text-seaglass-deep">{item.details}</p>
        )}
      </div>

      {message && (
        <p role="alert" className="text-sm font-medium text-coral-orange">
          {message}{" "}
          {!hasPhoto || message.startsWith("Add a photo") ? (
            <Link href="/profile" className="underline">
              Go to Profile
            </Link>
          ) : null}
        </p>
      )}

      <div className="flex gap-3">
        {!wearable ? null : resultUrl ? (
          <button
            type="button"
            disabled={working}
            onClick={() => void start(true)}
            className="btn flex-1 px-6 py-3 text-lg"
          >
            Redo
          </button>
        ) : (
          <button
            type="button"
            disabled={working}
            onClick={() =>
              hasPhoto
                ? void start(false)
                : setNotice("Add a photo of yourself in Profile first.")
            }
            className="btn flex-1 px-6 py-3 text-lg"
          >
            Try On
          </button>
        )}
        <a
          href={item.productUrl}
          target="_blank"
          rel="noopener"
          className="btn flex-1 px-6 py-3 text-lg"
        >
          Shop
        </a>
      </div>

      {!wearable && (
        <p className="text-center text-sm text-seaglass-deep">
          Shoes and hats can&apos;t be tried on yet.
        </p>
      )}
      {wearable && summary && <CreditLine summary={summary} />}

      <fieldset className="mt-2 flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Type of clothing</legend>
        <div className="grid grid-cols-3 gap-2">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              disabled={savingKind}
              onClick={() =>
                startSavingKind(() => setItemKind(item.id, k.value))
              }
              className={`rounded-xl px-2 py-2 text-sm font-medium ring-1 transition disabled:opacity-60 ${
                kind === k.value
                  ? "bg-sunshine/30 ring-2 ring-gold"
                  : "bg-white ring-gold/60"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </fieldset>

      {wearable &&
        (isStartingOutfit ? (
          <p className="text-center text-sm font-medium text-seaglass-deep">
            ★ Your starting outfit
          </p>
        ) : (
          <button
            type="button"
            disabled={savingStart}
            onClick={() => startSavingStart(() => setStartingOutfit(item.id))}
            className="text-sm font-medium text-seaglass-deep underline-offset-4 hover:underline disabled:opacity-60"
          >
            Make this my starting outfit
          </button>
        ))}

      <button
        type="button"
        disabled={removing}
        onClick={() => {
          if (confirm("Remove this from your closet?")) {
            startRemoving(() => removeItem(item.id));
          }
        }}
        className="mt-4 text-sm font-medium text-coral-orange underline-offset-4 hover:underline disabled:opacity-60"
      >
        Remove from closet
      </button>
    </div>
  );
}
