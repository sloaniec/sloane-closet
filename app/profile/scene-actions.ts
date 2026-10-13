"use server";

import { refresh } from "next/cache";
import { SCENES, SHELVES } from "@/components/scenes";
import { createClient } from "@/lib/supabase/server";

// Saves a choice on the account (Supabase user metadata), so each person
// keeps their own, then renews the sign-in so it carries the new choice.
async function savePreference(data: Record<string, string>) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data });
  if (error) throw new Error(error.message);
  await supabase.auth.refreshSession();
  refresh();
}

export async function chooseScene(sceneId: string) {
  if (!SCENES.some((s) => s.id === sceneId)) throw new Error("Unknown scene");
  await savePreference({ scene: sceneId });
}

export async function chooseShelves(shelvesId: string) {
  if (!SHELVES.some((s) => s.id === shelvesId)) {
    throw new Error("Unknown shelves");
  }
  await savePreference({ shelves: shelvesId });
}
