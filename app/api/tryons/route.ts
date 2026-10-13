import { getSignedInUser } from "@/lib/supabase/require-user";
import { startTryOn, toView } from "@/lib/tryons";

// POST { itemId, redo? } → starts a try-on for the item and the active
// photo, or returns the one that already exists. Never waits for FASHN.
export async function POST(request: Request) {
  const user = await getSignedInUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    itemId?: unknown;
    redo?: unknown;
  };
  if (typeof body.itemId !== "string") {
    return Response.json({ error: "Missing item" }, { status: 400 });
  }

  const result = await startTryOn(user.supabase, body.itemId, body.redo === true);
  if (!result.ok) {
    return Response.json(
      { error: result.reason },
      { status: result.reason === "no_item" ? 404 : 409 },
    );
  }
  return Response.json(await toView(user.supabase, result.row));
}
