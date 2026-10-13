"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resizeToJpeg } from "@/lib/resize-image";
import { addPhoto } from "./actions";

export function UploadPhotos() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = status !== null;

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    setError(null);

    const supabase = createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (!userId) {
      setError("You're signed out. Sign in again and retry.");
      return;
    }

    try {
      for (const [i, file] of files.entries()) {
        setStatus(
          files.length > 1
            ? `Uploading ${i + 1} of ${files.length}…`
            : "Uploading…",
        );
        const jpeg = await resizeToJpeg(file);
        const path = `${userId}/person/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("closet")
          .upload(path, jpeg, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        await addPhoto(path);
      }
    } catch {
      setError("Something went wrong uploading. Please try again.");
    } finally {
      setStatus(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <label
        className={`btn cursor-pointer px-6 py-3 text-lg ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        {status ?? "Upload my photos"}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void handleFiles(files);
          }}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-coral-orange">
          {error}
        </p>
      )}
    </div>
  );
}
