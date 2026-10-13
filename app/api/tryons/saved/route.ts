import { getSignedInUser } from "@/lib/supabase/require-user";
import { savedLooksOn } from "@/lib/tryons";

// GET ?base=<tryon id> (or none) → saved looks she can switch to for free
// from that look. Never calls FASHN.
export async function GET(request: Request) {
  const user = await getSignedInUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const base = new URL(request.url).searchParams.get("base");
  const looks = await savedLooksOn(user.supabase, base || null);
  return Response.json(looks, {
    headers: { "cache-control": "private, no-store" },
  });
}
