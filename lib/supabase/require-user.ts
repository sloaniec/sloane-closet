import { createClient } from "./server";

// Returns a Supabase client and the signed-in user's id, or null when
// nobody is signed in.
export async function getSignedInUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return userId ? { supabase, userId } : null;
}
