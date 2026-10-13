import type { SupabaseClient } from "@supabase/supabase-js";

export type Preferences = { scene: string | null; shelves: string | null };

// Background and closet-shelf choices, saved on the account (Supabase user
// metadata). Read with getUser(), which asks Supabase for the latest copy:
// the sign-in token only picks up changes when it renews, so reading it
// showed the old choice after switching.
export async function getPreferences(
  supabase: SupabaseClient,
): Promise<Preferences> {
  const { data } = await supabase.auth.getUser();
  const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
  return {
    scene: typeof meta.scene === "string" ? meta.scene : null,
    shelves: typeof meta.shelves === "string" ? meta.shelves : null,
  };
}
