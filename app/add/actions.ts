"use server";

import { redirect } from "next/navigation";
import { isCategory } from "@/lib/categories";
import { parseHttpUrl } from "@/lib/safe-fetch";
import { getSignedInUser } from "@/lib/supabase/require-user";

export type NewItem = {
  productUrl: string;
  title: string;
  store: string | null;
  priceText: string | null;
  category: string;
  imagePath: string;
};

// Saves an item after the browser has uploaded its image to Storage.
export async function saveItem(item: NewItem): Promise<{ error: string }> {
  const user = await getSignedInUser();
  if (!user) return { error: "You're signed out. Sign in again and retry." };
  const { supabase, userId } = user;

  try {
    parseHttpUrl(item.productUrl);
  } catch {
    return { error: "That link doesn't look right." };
  }
  if (!item.imagePath.startsWith(`${userId}/items/`)) {
    return { error: "Something went wrong saving the picture." };
  }
  const title = item.title.trim();
  if (!title) return { error: "Add a name for this item." };

  const { error } = await supabase.from("closet_items").insert({
    product_url: item.productUrl,
    title: title.slice(0, 300),
    store: item.store?.slice(0, 200) || null,
    price_text: item.priceText?.slice(0, 50) || null,
    category: isCategory(item.category) ? item.category : "auto",
    image_path: item.imagePath,
  });
  if (error) return { error: "Couldn't save. Please try again." };

  redirect("/");
}
