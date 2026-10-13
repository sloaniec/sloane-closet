"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { categoryForKind, isKind } from "@/lib/kinds";
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

// Changes what kind of clothing this is (which closet section it's in).
export async function setItemKind(itemId: string, kind: string) {
  if (!isKind(kind)) throw new Error("Unknown kind");
  const user = await getSignedInUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await user.supabase
    .from("closet_items")
    .update({ kind, category: categoryForKind(kind) })
    .eq("id", itemId);
  if (error) throw new Error(error.message);
  refresh();
}

// "Remove from closet": hides the item. Its photo and saved try-ons stay in
// the database, just out of sight.
export async function removeItem(itemId: string) {
  const user = await getSignedInUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await user.supabase
    .from("closet_items")
    .update({
      archived_at: new Date().toISOString(),
      is_starting_outfit: false,
    })
    .eq("id", itemId);
  if (error) throw new Error(error.message);
  redirect("/");
}
