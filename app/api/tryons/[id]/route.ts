import { getSignedInUser } from "@/lib/supabase/require-user";
import { getTryOn, refreshTryOn, toView } from "@/lib/tryons";

// GET → the try-on's current state. If it's still running, asks FASHN once
// and saves the picture when it's ready.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/tryons/[id]">,
) {
  const user = await getSignedInUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await ctx.params;
  const row = await getTryOn(user.supabase, id);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const fresh = await refreshTryOn(user.supabase, row);
  return Response.json(await toView(user.supabase, fresh));
}
