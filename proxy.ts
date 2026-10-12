import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Every path except Next.js internals, the web manifest, and image files,
    // so the home-screen icon and styles load before sign-in.
    "/((?!_next/static|_next/image|manifest\\.webmanifest|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)",
  ],
};
