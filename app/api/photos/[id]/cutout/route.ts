import { refreshCutout, startCutout } from "@/lib/cutouts";
import { getSignedInUser } from "@/lib/supabase/require-user";

// POST → "Cut me out" for one photo (1 credit, once per photo).
// GET → how that cut-out is going. Neither waits for FASHN.
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/photos/[id]/cutout">,
) {
  const user = await getSignedInUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  const view = await startCutout(user.supabase, id);
  return view
    ? Response.json(view)
    : Response.json({ error: "Not found" }, { status: 404 });
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/photos/[id]/cutout">,
) {
  const user = await getSignedInUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  const view = await refreshCutout(user.supabase, id);
  return view
    ? Response.json(view)
    : Response.json({ error: "Not found" }, { status: 404 });
}
