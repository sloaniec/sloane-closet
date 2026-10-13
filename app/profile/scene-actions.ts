"use server";

import { refresh } from "next/cache";
import { SCENES } from "@/components/scenes";
import { createClient } from "@/lib/supabase/server";

// Saves which background this account stands in. It lives on the account
// (Supabase user metadata), so each person keeps their own.
export async function chooseScene(sceneId: string) {
  if (!SCENES.some((s) => s.id === sceneId)) throw new Error("Unknown scene");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { scene: sceneId } });
  if (error) throw new Error(error.message);
  refresh();
}
