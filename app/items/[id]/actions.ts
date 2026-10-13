"use server";

import { refresh } from "next/cache";
import { getSignedInUser } from "@/lib/supabase/require-user";

// Makes this item the outfit the closet scene starts in. Clears the old one
// first so the one-starting-outfit rule never sees two at once.
export async function setStartingOutfit(itemId: string) {
  const user = await getSignedInUser();
  if (!user) throw new Error("Not signed in");
  const cleared = await user.supabase
    .from("closet_items")
    .update({ is_starting_outfit: false })
    .eq("is_starting_outfit", true)
    .neq("id", itemId);
  if (cleared.error) throw new Error(cleared.error.message);
  const set = await user.supabase
    .from("closet_items")
    .update({ is_starting_outfit: true })
    .eq("id", itemId);
  if (set.error) throw new Error(set.error.message);
  refresh();
}
