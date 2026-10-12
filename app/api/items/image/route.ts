import { safeFetch, SafeFetchError } from "@/lib/safe-fetch";
import { getSignedInUser } from "@/lib/supabase/require-user";

// POST { url } → the product image bytes. Store images usually can't be
// read by the browser directly, so the server fetches them (with the same
// safety checks as the preview) and the browser resizes and saves them.
export async function POST(request: Request) {
  if (!(await getSignedInUser())) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const { url } = (await request.json().catch(() => ({}))) as { url?: unknown };
  if (typeof url !== "string") {
    return Response.json({ error: "Missing image link" }, { status: 400 });
  }

  try {
    const image = await safeFetch(url, {
      maxBytes: 10 * 1024 * 1024,
      timeoutMs: 8000,
      maxRedirects: 3,
      truncate: false,
      accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
    });
    const type = image.contentType.split(";")[0].trim().toLowerCase();
    if (image.status >= 400 || !type.startsWith("image/") || type === "image/svg+xml") {
      return Response.json({ error: "Not a usable image" }, { status: 502 });
    }
    return new Response(new Uint8Array(image.body), {
      headers: { "content-type": type, "cache-control": "private, no-store" },
    });
  } catch (err) {
    const message =
      err instanceof SafeFetchError ? err.message : "Couldn't get the image";
    return Response.json({ error: message }, { status: 502 });
  }
}
