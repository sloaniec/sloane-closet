// FASHN Virtual Try-On v1.6. Server only: uses FASHN_API_KEY.
// Every call here spends or checks Greg's credits, so only the Try On and
// Redo buttons may lead to runTryOn (see CLAUDE.md rule 4).

const API = "https://api.fashn.ai/v1";

export type TryOnInputs = {
  modelImageUrl: string;
  garmentImageUrl: string;
  category: string;
  // Only Redo sends a seed; FASHN's default (42) repeats the same picture.
  seed?: number;
};

export type FashnStatus =
  | { state: "pending" }
  | { state: "completed"; image: Buffer }
  | { state: "failed"; error: string };

function headers() {
  const key = process.env.FASHN_API_KEY;
  if (!key) throw new Error("FASHN_API_KEY is not set");
  return {
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
  };
}

export function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

// Starts a try-on and returns FASHN's prediction id. Throws on failure.
export async function runTryOn(inputs: TryOnInputs): Promise<string> {
  const res = await fetch(`${API}/run`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model_name: "tryon-v1.6",
      inputs: {
        model_image: inputs.modelImageUrl,
        garment_image: inputs.garmentImageUrl,
        category: inputs.category,
        garment_photo_type: "auto",
        mode: "balanced",
        num_samples: 1,
        output_format: "jpeg",
        return_base64: true,
        // Greg's choice. Don't change without asking him.
        moderation_level: "permissive",
        ...(inputs.seed === undefined ? {} : { seed: inputs.seed }),
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => null)) as {
    id?: string;
    error?: unknown;
  } | null;
  if (!res.ok || !body?.id || body.error) {
    throw new Error(describeError(body?.error) ?? `FASHN answered ${res.status}`);
  }
  return body.id;
}

// Checks a prediction once. Never waits for it to finish.
export async function checkTryOn(fashnId: string): Promise<FashnStatus> {
  const res = await fetch(`${API}/status/${encodeURIComponent(fashnId)}`, {
    headers: headers(),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) return { state: "pending" };
  return parseStatus(await res.json());
}

export function parseStatus(body: unknown): FashnStatus {
  const b = (body ?? {}) as { status?: string; output?: unknown; error?: unknown };
  if (b.status === "completed") {
    const first = Array.isArray(b.output) ? b.output[0] : null;
    const image = typeof first === "string" ? decodeDataUri(first) : null;
    return image
      ? { state: "completed", image }
      : { state: "failed", error: "FASHN returned no image" };
  }
  if (b.status === "failed" || b.status === "canceled") {
    return { state: "failed", error: describeError(b.error) ?? "Try-on failed" };
  }
  return { state: "pending" };
}

function decodeDataUri(value: string): Buffer | null {
  const m = value.match(/^data:image\/[a-z+]+;base64,(.+)$/i);
  if (!m) return null;
  const buf = Buffer.from(m[1], "base64");
  return buf.length > 0 ? buf : null;
}

// FASHN errors look like { name: "PoseError", message: "..." }.
function describeError(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  const e = error as { name?: unknown; message?: unknown };
  const parts = [e.name, e.message].filter((p) => typeof p === "string" && p);
  return parts.length ? parts.join(": ") : JSON.stringify(error);
}
