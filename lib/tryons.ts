import type { SupabaseClient } from "@supabase/supabase-js";
import { checkTryOn, getCredits, randomSeed, runTryOn } from "./fashn";

// A run with no answer after this long is treated as failed, so the
// Try On button works again.
const STALE_MS = 10 * 60 * 1000;
const SIGNED_URL_SECONDS = 60 * 60;
const FASHN_INPUT_URL_SECONDS = 10 * 60;

export type TryOnRow = {
  id: string;
  user_id: string;
  item_id: string;
  person_photo_id: string;
  base_tryon_id: string | null;
  status: "pending" | "completed" | "failed";
  fashn_id: string | null;
  result_path: string | null;
  error: string | null;
  started_at: string | null;
  completed_runs: number;
};

// What the browser sees.
export type TryOnView = {
  id: string;
  itemId: string;
  baseTryOnId: string | null;
  status: TryOnRow["status"];
  resultUrl: string | null;
  error: "pose" | "other" | null;
};

const COLUMNS =
  "id, user_id, item_id, person_photo_id, base_tryon_id, status, fashn_id, result_path, error, started_at, completed_runs";

export async function toView(
  supabase: SupabaseClient,
  row: TryOnRow,
): Promise<TryOnView> {
  let resultUrl: string | null = null;
  if (row.result_path) {
    const { data } = await supabase.storage
      .from("closet")
      .createSignedUrl(row.result_path, SIGNED_URL_SECONDS);
    resultUrl = data?.signedUrl ?? null;
  }
  return {
    id: row.id,
    itemId: row.item_id,
    baseTryOnId: row.base_tryon_id,
    status: row.status,
    resultUrl,
    error:
      row.status !== "failed"
        ? null
        : row.error?.includes("PoseError")
          ? "pose"
          : "other",
  };
}

function isStale(row: TryOnRow) {
  return !row.started_at || Date.now() - Date.parse(row.started_at) > STALE_MS;
}

export async function getTryOn(supabase: SupabaseClient, id: string) {
  const { data } = await supabase
    .from("tryons")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle<TryOnRow>();
  return data;
}

// Moves a pending row on by asking FASHN once. Safe to call from several
// requests at once: each change only applies if the row is still in the
// state this request saw.
export async function refreshTryOn(
  supabase: SupabaseClient,
  row: TryOnRow,
): Promise<TryOnRow> {
  if (row.status !== "pending") return row;

  if (!row.fashn_id) {
    return isStale(row)
      ? await markFailed(supabase, row, "Try-on never started")
      : row;
  }

  let status;
  try {
    status = await checkTryOn(row.fashn_id);
  } catch {
    return row; // Couldn't reach FASHN this time; the browser asks again.
  }

  if (status.state === "pending") {
    return isStale(row)
      ? await markFailed(supabase, row, "Try-on timed out")
      : row;
  }
  if (status.state === "failed") {
    return await markFailed(supabase, row, status.error);
  }

  const path = `${row.user_id}/tryons/${row.id}.jpg`;
  const upload = await supabase.storage
    .from("closet")
    .upload(path, status.image, {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "60",
    });
  if (upload.error) return row;

  const { data } = await supabase
    .from("tryons")
    .update({
      status: "completed",
      result_path: path,
      error: null,
      completed_at: new Date().toISOString(),
      completed_runs: row.completed_runs + 1,
    })
    .eq("id", row.id)
    .eq("status", "pending")
    .eq("fashn_id", row.fashn_id)
    .select(COLUMNS)
    .maybeSingle<TryOnRow>();
  return data ?? (await getTryOn(supabase, row.id)) ?? row;
}

async function markFailed(
  supabase: SupabaseClient,
  row: TryOnRow,
  error: string,
): Promise<TryOnRow> {
  let query = supabase
    .from("tryons")
    .update({ status: "failed", error: error.slice(0, 500) })
    .eq("id", row.id)
    .eq("status", "pending");
  query = row.fashn_id
    ? query.eq("fashn_id", row.fashn_id)
    : query.is("fashn_id", null);
  const { data } = await query.select(COLUMNS).maybeSingle<TryOnRow>();
  return data ?? (await getTryOn(supabase, row.id)) ?? row;
}

export type StartResult =
  | { ok: true; row: TryOnRow }
  | {
      ok: false;
      reason: "no_item" | "no_photo" | "no_credits" | "bad_base";
    };

// Try On (redo = false) or Redo (redo = true) for one item, either straight
// onto the active photo (baseTryOnId = null) or layered on top of an
// earlier finished try-on of that photo. Only spends a credit when there's
// no saved result for that exact combination yet, or on Redo.
export async function startTryOn(
  supabase: SupabaseClient,
  itemId: string,
  redo: boolean,
  baseTryOnId: string | null = null,
): Promise<StartResult> {
  const { data: item } = await supabase
    .from("closet_items")
    .select("id, image_path, category")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { ok: false, reason: "no_item" };

  const { data: photo } = await supabase
    .from("person_photos")
    .select("id, storage_path")
    .eq("is_active", true)
    .maybeSingle();
  if (!photo) return { ok: false, reason: "no_photo" };

  // Layering: dress the picture of her already wearing the earlier pieces.
  let modelPath = photo.storage_path;
  if (baseTryOnId) {
    const base = await getTryOn(supabase, baseTryOnId);
    if (
      !base ||
      base.status !== "completed" ||
      !base.result_path ||
      base.person_photo_id !== photo.id
    ) {
      return { ok: false, reason: "bad_base" };
    }
    modelPath = base.result_path;
  }

  const findExisting = () => {
    const query = supabase
      .from("tryons")
      .select(COLUMNS)
      .eq("item_id", item.id)
      .eq("person_photo_id", photo.id);
    return (
      baseTryOnId
        ? query.eq("base_tryon_id", baseTryOnId)
        : query.is("base_tryon_id", null)
    ).maybeSingle<TryOnRow>();
  };

  const { data: found } = await findExisting();
  let existing = found;
  if (existing?.status === "pending") {
    existing = await refreshTryOn(supabase, existing);
  }

  // Out of credits: don't send anything to FASHN. (If FASHN can't say,
  // carry on and let it decide.)
  const startsNewRun =
    !existing ||
    existing.status === "failed" ||
    (existing.status === "completed" && redo);
  const credits = startsNewRun ? await getCredits() : null;
  if (credits !== null && credits <= 0) {
    return { ok: false, reason: "no_credits" };
  }

  // Claim the row for a new run. The database's unique (item, photo, base) rule
  // and the status checks mean two quick taps can't start two runs.
  let claimed: TryOnRow | null = null;
  const startedAt = new Date().toISOString();
  if (!existing) {
    const { data, error } = await supabase
      .from("tryons")
      .insert({
        item_id: item.id,
        person_photo_id: photo.id,
        base_tryon_id: baseTryOnId,
        status: "pending",
        started_at: startedAt,
      })
      .select(COLUMNS)
      .single<TryOnRow>();
    if (error) {
      const again = await findExisting();
      return again.data
        ? { ok: true, row: again.data }
        : { ok: false, reason: "no_item" };
    }
    claimed = data;
  } else if (existing.status === "pending") {
    return { ok: true, row: existing };
  } else if (existing.status === "completed" && !redo) {
    return { ok: true, row: existing };
  } else {
    // Failed (try again) or completed with Redo.
    const { data } = await supabase
      .from("tryons")
      .update({
        status: "pending",
        fashn_id: null,
        error: null,
        started_at: startedAt,
      })
      .eq("id", existing.id)
      .eq("status", existing.status)
      .select(COLUMNS)
      .maybeSingle<TryOnRow>();
    if (!data) {
      const current = await getTryOn(supabase, existing.id);
      return current
        ? { ok: true, row: current }
        : { ok: false, reason: "no_item" };
    }
    claimed = data;
  }

  // Signed links FASHN can read for 10 minutes.
  const { data: links } = await supabase.storage
    .from("closet")
    .createSignedUrls(
      [modelPath, item.image_path],
      FASHN_INPUT_URL_SECONDS,
    );
  const modelImageUrl = links?.[0]?.signedUrl;
  const garmentImageUrl = links?.[1]?.signedUrl;
  if (!modelImageUrl || !garmentImageUrl) {
    return {
      ok: true,
      row: await markFailed(supabase, claimed, "Couldn't read the pictures"),
    };
  }

  try {
    const fashnId = await runTryOn({
      modelImageUrl,
      garmentImageUrl,
      category: item.category,
      seed: redo ? randomSeed() : undefined,
    });
    const { data } = await supabase
      .from("tryons")
      .update({ fashn_id: fashnId })
      .eq("id", claimed.id)
      .eq("status", "pending")
      .select(COLUMNS)
      .maybeSingle<TryOnRow>();
    return { ok: true, row: data ?? claimed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Try-on failed";
    return { ok: true, row: await markFailed(supabase, claimed, message) };
  }
}
