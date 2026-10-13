"use client";

import { useState } from "react";
import { KINDS, type Kind } from "@/lib/kinds";
import { resizeToJpeg } from "@/lib/resize-image";
import { createClient } from "@/lib/supabase/client";
import { saveItem } from "./actions";

type Step = "link" | "looking" | "details";

// Pulls the first web link out of whatever was pasted (iPhone "Share"
// often adds the product name before the link), adding https:// if needed.
function extractLink(text: string): string | null {
  const found = text.match(/https?:\/\/\S+/i)?.[0] ?? text.trim();
  if (!found || /\s/.test(found)) return null;
  const withScheme = /^https?:\/\//i.test(found) ? found : `https://${found}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

const inputClass =
  "w-full rounded-xl border border-seaglass bg-shell px-4 py-3 text-base outline-none focus:border-seaglass-deep focus:ring-2 focus:ring-seaglass";

export function AddItemForm() {
  const [step, setStep] = useState<Step>("link");
  const [link, setLink] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [title, setTitle] = useState("");
  const [store, setStore] = useState<string | null>(null);
  const [priceText, setPriceText] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>("top");
  const [picture, setPicture] = useState<{ blob: Blob; src: string } | null>(
    null,
  );
  const [needsScreenshot, setNeedsScreenshot] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const image = picture?.blob ?? null;

  // Keeps the on-screen preview in step with the chosen picture, and frees
  // the old preview's memory.
  function setImage(blob: Blob | null) {
    setPicture((old) => {
      if (old) URL.revokeObjectURL(old.src);
      return blob ? { blob, src: URL.createObjectURL(blob) } : null;
    });
  }

  async function lookUp() {
    const url = extractLink(link);
    if (!url) {
      setError(
        "That doesn't look like a link. Copy it from the store and paste it here.",
      );
      return;
    }
    setError(null);
    setProductUrl(url);
    setStep("looking");

    let blob: Blob | null = null;
    try {
      const res = await fetch("/api/items/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const preview = (await res.json()) as {
          title: string | null;
          store: string | null;
          priceText: string | null;
          imageUrl: string | null;
        };
        setTitle(preview.title ?? "");
        setStore(preview.store);
        setPriceText(preview.priceText);
        if (preview.imageUrl) {
          const img = await fetch("/api/items/image", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ url: preview.imageUrl }),
          });
          if (img.ok) blob = await img.blob();
        }
      }
    } catch {
      // Fall through to the screenshot option.
    }
    setImage(blob);
    setNeedsScreenshot(!blob);
    setStep("details");
  }

  // Reads a picture copied in Safari (press and hold, Copy). iPhone shows a
  // small "Paste" bubble to confirm.
  async function pastePicture() {
    setError(null);
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) {
          setImage(await item.getType(type));
          return;
        }
      }
    } catch {
      // No clipboard access, or nothing pasteable: same message below.
    }
    setError(
      "No picture to paste. In Safari, press and hold the product photo, tap Copy, and try again.",
    );
  }

  async function save() {
    if (!image) {
      setError("Paste a picture or upload a screenshot of the item first.");
      return;
    }
    if (!title.trim()) {
      setError("Add a name for this item.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      const userId = data?.claims?.sub;
      if (!userId) throw new Error("signed out");

      const jpeg = await resizeToJpeg(image);
      const path = `${userId}/items/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("closet")
        .upload(path, jpeg, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const result = await saveItem({
        productUrl,
        title,
        store,
        priceText,
        kind,
        imagePath: path,
      });
      // saveItem redirects to the closet on success.
      setError(result.error);
    } catch {
      setError("Something went wrong saving. Please try again.");
    }
    setSaving(false);
  }

  if (step !== "details") {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void lookUp();
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          Product link
          <input
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            placeholder="Paste a link from any store"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className={inputClass}
          />
        </label>
        {error && <ErrorText text={error} />}
        <button
          type="submit"
          disabled={step === "looking" || !link.trim()}
          className="rounded-full bg-sunshine px-6 py-3 text-base font-semibold text-tide shadow-sm transition active:scale-[0.98] disabled:opacity-60"
        >
          {step === "looking" ? "Looking it up…" : "Preview"}
        </button>
      </form>
    );
  }

  return (
    <div
      className="flex flex-col gap-5"
      onPaste={(e) => {
        const file = Array.from(e.clipboardData.files).find((f) =>
          f.type.startsWith("image/"),
        );
        if (file && needsScreenshot) {
          e.preventDefault();
          setError(null);
          setImage(file);
        }
      }}
    >
      {needsScreenshot && (
        <p className="rounded-2xl bg-sunshine/40 p-4 text-sm">
          This store didn&apos;t share a picture. Paste or upload one instead.
        </p>
      )}

      {picture ? (
        // eslint-disable-next-line @next/next/no-img-element -- local preview
        <img
          src={picture.src}
          alt=""
          className="mx-auto max-h-96 w-auto rounded-2xl object-contain shadow-sm ring-1 ring-seaglass"
        />
      ) : null}

      {needsScreenshot && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => void pastePicture()}
              className="rounded-full bg-sunshine px-5 py-3 text-base font-semibold text-tide shadow-sm transition active:scale-[0.98]"
            >
              Paste picture
            </button>
            <label className="cursor-pointer rounded-full bg-seaglass px-5 py-3 text-base font-semibold text-tide shadow-sm transition active:scale-[0.98]">
              {image ? "Choose a different screenshot" : "Upload a screenshot"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) setImage(file);
                }}
              />
            </label>
          </div>
          <p className="text-center text-xs">
            To paste: in Safari, press and hold the product photo, tap Copy,
            then come back and tap Paste picture.
          </p>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Name
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What is it?"
          className={inputClass}
        />
      </label>

      {(store || priceText) && (
        <p className="text-sm">
          {[store, priceText].filter(Boolean).join(" · ")}
        </p>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Type of clothing</legend>
        <div className="grid grid-cols-3 gap-2">
          {KINDS.map((c) => (
            <label
              key={c.value}
              className={`cursor-pointer rounded-xl px-3 py-3 text-center text-sm font-medium ring-1 transition ${
                kind === c.value
                  ? "bg-seaglass ring-seaglass-deep"
                  : "bg-shell ring-seaglass"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={c.value}
                checked={kind === c.value}
                onChange={() => setKind(c.value)}
                className="sr-only"
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <ErrorText text={error} />}

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="rounded-full bg-sunshine px-6 py-3 text-base font-semibold text-tide shadow-sm transition active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save to closet"}
      </button>
      <button
        type="button"
        onClick={() => {
          setStep("link");
          setImage(null);
          setNeedsScreenshot(false);
          setError(null);
        }}
        className="text-sm font-medium text-seaglass-deep"
      >
        Start over
      </button>
    </div>
  );
}

function ErrorText({ text }: { text: string }) {
  return (
    <p role="alert" className="text-sm font-medium text-coral-orange">
      {text}
    </p>
  );
}
