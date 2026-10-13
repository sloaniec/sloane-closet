import { getSignedInUser } from "@/lib/supabase/require-user";
import { finishedLooks } from "@/lib/tryons";

// GET → every finished look of her active photo. Never calls FASHN.
export async function GET() {
  const user = await getSignedInUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const looks = await finishedLooks(user.supabase);
  return Response.json(looks, {
    headers: { "cache-control": "private, no-store" },
  });
}
