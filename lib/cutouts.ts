import type { SupabaseClient } from "@supabase/supabase-js";
import { checkPrediction, getCredits, runBackgroundRemove } from "./fashn";

const SIGNED_URL_SECONDS = 60 * 60;
const FASHN_INPUT_URL_SECONDS = 10 * 60;
const STALE_CLAIM_MS = 2 * 60 * 1000;

type PhotoRow = {
  id: string;
  user_id: string;
  storage_path: string;
  cutout_fashn_id: string | null;
  cutout_path: string | null;
};

const COLUMNS = "id, user_id, storage_path, cutout_fashn_id, cutout_path";

export type CutoutView =
  | { status: "none" }
  | { status: "pending" }
  | { status: "completed"; cutoutUrl: string }
  | { status: "failed" }
  | { status: "no_credits" };

async function getPhoto(supabase: SupabaseClient, id: string) {
  const { data } = await supabase
    .from("person_photos")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle<PhotoRow>();
  return data;
}

async function completed(
  supabase: SupabaseClient,
  path: string,
): Promise<CutoutView> {
  const { data } = await supabase.storage
    .from("closet")
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  return data?.signedUrl
    ? { status: "completed", cutoutUrl: data.signedUrl }
    : { status: "failed" };
}

// "Cut me out": asks FASHN to cut her out of one photo. Reuses a finished
// or running cut-out, so the credit is only spent once per photo.
export async function startCutout(
  supabase: SupabaseClient,
  photoId: string,
): Promise<CutoutView | null> {
  const photo = await getPhoto(supabase, photoId);
  if (!photo) return null;
  if (photo.cutout_path) return completed(supabase, photo.cutout_path);
  if (photo.cutout_fashn_id) {
    const current = await refreshCutout(supabase, photoId);
    // Still running or done: nothing new to start.
    if (current?.status !== "none" && current?.status !== "failed") {
      return current;
    }
  }

  const credits = await getCredits();
  if (credits !== null && credits <= 0) return { status: "no_credits" };

  // Claim the photo so two taps can't start two cut-outs.
  const claim = `claim:${Date.now()}:${crypto.randomUUID()}`;
  const { data: claimed } = await supabase
    .from("person_photos")
    .update({ cutout_fashn_id: claim })
    .eq("id", photo.id)
    .is("cutout_fashn_id", null)
    .is("cutout_path", null)
    .select("id")
    .maybeSingle();
  if (!claimed) return { status: "pending" };

  const { data: link } = await supabase.storage
    .from("closet")
    .createSignedUrl(photo.storage_path, FASHN_INPUT_URL_SECONDS);
  try {
    if (!link?.signedUrl) throw new Error("Couldn't read the photo");
    const fashnId = await runBackgroundRemove(link.signedUrl);
    await supabase
      .from("person_photos")
      .update({ cutout_fashn_id: fashnId })
      .eq("id", photo.id)
      .eq("cutout_fashn_id", claim);
    return { status: "pending" };
  } catch {
    await supabase
      .from("person_photos")
      .update({ cutout_fashn_id: null })
      .eq("id", photo.id)
      .eq("cutout_fashn_id", claim);
    return { status: "failed" };
  }
}

// Checks a running cut-out once, and saves the PNG when it's ready.
export async function refreshCutout(
  supabase: SupabaseClient,
  photoId: string,
): Promise<CutoutView | null> {
  const photo = await getPhoto(supabase, photoId);
  if (!photo) return null;
  if (photo.cutout_path) return completed(supabase, photo.cutout_path);
  const fashnId = photo.cutout_fashn_id;
  if (!fashnId) return { status: "none" };
  if (fashnId.startsWith("claim:")) {
    // A start that never reached FASHN (the request died): let it go.
    const claimedAt = Number(fashnId.split(":")[1]);
    if (Date.now() - claimedAt < STALE_CLAIM_MS) return { status: "pending" };
    await supabase
      .from("person_photos")
      .update({ cutout_fashn_id: null })
      .eq("id", photo.id)
      .eq("cutout_fashn_id", fashnId);
    return { status: "none" };
  }

  let status;
  try {
    status = await checkPrediction(fashnId);
  } catch {
    return { status: "pending" };
  }
  if (status.state === "pending") return { status: "pending" };
  if (status.state === "failed") {
    await supabase
      .from("person_photos")
      .update({ cutout_fashn_id: null })
      .eq("id", photo.id)
      .eq("cutout_fashn_id", fashnId);
    return { status: "failed" };
  }

  const path = `${photo.user_id}/person/${photo.id}-cutout.png`;
  const upload = await supabase.storage
    .from("closet")
    .upload(path, status.image, { contentType: "image/png", upsert: true });
  if (upload.error) return { status: "pending" };
  await supabase
    .from("person_photos")
    .update({ cutout_path: path })
    .eq("id", photo.id)
    .eq("cutout_fashn_id", fashnId);
  return completed(supabase, path);
}
