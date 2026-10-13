import { getCredits } from "@/lib/fashn";
import { summarize } from "@/lib/spending";
import { getSignedInUser } from "@/lib/supabase/require-user";

// GET → credits left on Greg's FASHN account, plus this account's own
// tally of completed try-on runs (Redos included) and what they cost,
// counting each "Cut me out" as one more credit.
export async function GET() {
  const user = await getSignedInUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const [credits, runs, cutouts] = await Promise.all([
    getCredits(),
    user.supabase.from("tryons").select("completed_runs"),
    user.supabase
      .from("person_photos")
      .select("id", { count: "exact", head: true })
      .not("cutout_path", "is", null),
  ]);
  const tryOns = (runs.data ?? []).reduce(
    (sum, r) => sum + r.completed_runs,
    0,
  );
  return Response.json(summarize(credits, tryOns, cutouts.count ?? 0), {
    headers: { "cache-control": "private, no-store" },
  });
}
