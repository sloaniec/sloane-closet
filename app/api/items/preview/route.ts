import { parseProductPage } from "@/lib/preview/parse";
import { safeFetch, SafeFetchError } from "@/lib/safe-fetch";
import { getSignedInUser } from "@/lib/supabase/require-user";

// POST { url } → product title, store, price, and image URL read from the
// store page. Fails cleanly when the store blocks us; the app then offers
// a screenshot upload instead.
export async function POST(request: Request) {
  if (!(await getSignedInUser())) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const { url } = (await request.json().catch(() => ({}))) as { url?: unknown };
  if (typeof url !== "string") {
    return Response.json({ error: "Missing link" }, { status: 400 });
  }

  try {
    const page = await safeFetch(url, {
      maxBytes: 3 * 1024 * 1024,
      timeoutMs: 8000,
      maxRedirects: 3,
      truncate: true,
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    });
    if (page.status >= 400) {
      return Response.json({ error: `Store answered ${page.status}` }, { status: 502 });
    }
    const preview = parseProductPage(page.body.toString("utf8"), page.url);
    return Response.json(preview);
  } catch (err) {
    const message =
      err instanceof SafeFetchError ? err.message : "Couldn't reach the store";
    return Response.json({ error: message }, { status: 502 });
  }
}
