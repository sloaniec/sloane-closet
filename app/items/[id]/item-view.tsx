"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CreditSummary } from "@/lib/spending";
import type { TryOnView } from "@/lib/tryons";

const POLL_MS = 2000;
const POLL_LIMIT_MS = 60_000;
const LOW_CREDITS = 10;
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
  initialTryOn: TryOnView | null;
};

export function ItemView({ item, hasPhoto, initialTryOn }: Props) {
  const [tryOn, setTryOn] = useState<TryOnView | null>(initialTryOn);
  const [showOriginal, setShowOriginal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const pollStarted = useRef<number | null>(null);
  const [summary, setSummary] = useState<CreditSummary | null>(null);

  // Credits left and spending, loaded on open and after each finished run.
  const completedKey = tryOn?.status === "completed" ? tryOn.resultUrl : null;
  useEffect(() => {
    let cancelled = false;
    fetch("/api/credits", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<CreditSummary>) : null))
      .then((data) => {
        if (!cancelled && data) setSummary(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [completedKey]);
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
          <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-tide shadow">
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
        {resultUrl ? (
          <button
            type="button"
            disabled={working}
            onClick={() => void start(true)}
            className="flex-1 rounded-full bg-sunshine px-6 py-3 text-base font-semibold text-tide shadow-sm transition active:scale-[0.98] disabled:opacity-60"
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
            className="flex-1 rounded-full bg-sunshine px-6 py-3 text-base font-semibold text-tide shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          >
            Try On
          </button>
        )}
        <a
          href={item.productUrl}
          target="_blank"
          rel="noopener"
          className="flex-1 rounded-full bg-seaglass px-6 py-3 text-center text-base font-semibold text-tide shadow-sm transition active:scale-[0.98]"
        >
          Shop
        </a>
      </div>

      {summary && <CreditLine summary={summary} />}
    </div>
  );
}

function CreditLine({ summary }: { summary: CreditSummary }) {
  const { credits, tryOns, spent } = summary;
  const low = credits !== null && credits < LOW_CREDITS;
  const creditsText =
    credits === null
      ? null
      : credits <= 0
        ? "Out of credits"
        : low
          ? `Only ${credits} ${credits === 1 ? "credit" : "credits"} left`
          : `${credits} credits left`;
  return (
    <p className="text-center text-xs text-seaglass-deep">
      {creditsText && (
        <>
          <span className={low ? "font-semibold text-coral-orange" : ""}>
            {creditsText}
          </span>
          {" · "}
        </>
      )}
      {tryOns} {tryOns === 1 ? "try-on" : "try-ons"} · {spent} spent
    </p>
  );
}
