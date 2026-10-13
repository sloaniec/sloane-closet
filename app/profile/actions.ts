"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new Error("Not signed in");
  return { supabase, userId };
}

// Saves a photo row after the browser has uploaded the file to Storage.
// The first photo becomes the active one automatically. A green-screen
// photo (made from "Cut me out") becomes active right away.
export async function addPhoto(
  storagePath: string,
  options: { greenScreen?: boolean } = {},
) {
  const { supabase, userId } = await requireUser();
  if (!storagePath.startsWith(`${userId}/person/`)) {
    throw new Error("Invalid photo path");
  }
  const greenScreen = options.greenScreen === true;

  if (greenScreen) {
    const cleared = await supabase
      .from("person_photos")
      .update({ is_active: false })
      .eq("is_active", true);
    if (cleared.error) throw new Error(cleared.error.message);
  }
  const { count } = await supabase
    .from("person_photos")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const { error } = await supabase.from("person_photos").insert({
    storage_path: storagePath,
    is_active: !count,
    green_screen: greenScreen,
  });
  if (error) throw new Error(error.message);
  refresh();
}

// Makes one photo the active one. Clear the old one first so the
// one-active-photo index never sees two at once.
export async function setActivePhoto(photoId: string) {
  const { supabase } = await requireUser();

  const cleared = await supabase
    .from("person_photos")
    .update({ is_active: false })
    .eq("is_active", true)
    .neq("id", photoId);
  if (cleared.error) throw new Error(cleared.error.message);

  const set = await supabase
    .from("person_photos")
    .update({ is_active: true })
    .eq("id", photoId);
  if (set.error) throw new Error(set.error.message);
  refresh();
}

// Deletes a photo and its file. If it was the active one, the newest
// remaining photo becomes active.
export async function deletePhoto(photoId: string) {
  const { supabase } = await requireUser();

  const { data: photo, error } = await supabase
    .from("person_photos")
    .delete()
    .eq("id", photoId)
    .select("storage_path, is_active")
    .single();
  if (error) throw new Error(error.message);

  await supabase.storage.from("closet").remove([photo.storage_path]);

  if (photo.is_active) {
    const { data: next } = await supabase
      .from("person_photos")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase
        .from("person_photos")
        .update({ is_active: true })
        .eq("id", next.id);
    }
  }
  refresh();
}
