# Backlog

Every to-do, bug, or idea gets a numbered line. When one is done, mark it with the PR number. Never delete a line.

1. ~~Feature 1: Foundation (app, Tailwind, Supabase clients, sign-in, empty closet, manifest, `.env.example`, husky + secretlint, `0001_init.sql`)~~ Done in PR 1.
2. Feature 2: My photo
3. Feature 3: Add an item
4. Feature 4: Try it on
5. Feature 5: Credits
6. Design the real app icon (placeholder until then)
7. ~~Check: newer Next.js renamed `middleware.ts` to `proxy.ts`. Confirm which name the current version uses when building #1.~~ Done in PR 1: Next.js 16 uses `proxy.ts`.
8. ~~Before first deploy: create Sloane's and Greg's accounts with "Auto Confirm User", then turn off "Allow new users to sign up".~~ Done by Sloane in the Supabase dashboard on 2026-10-12 (no PR, dashboard-only).
9. ~~Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor (Sloane).~~ Done by Sloane on 2026-10-12 ("Success. No rows returned"), for PR 1.
10. ~~After #1 merges: import the repo into Vercel and add the three environment variables on the import screen (Sloane).~~ Done by Sloane on 2026-10-12; sign-in works on the live site.
11. Idea: dark mode. The app is light-only for now so the beachy colors look the same everywhere.
12. Idea: a special font for the "Sloane's Closet" title (currently the same clean font as everything else).
13. ~~Bug: `0001_init.sql` failed in the Supabase SQL editor ("syntax error at or near loop"). Replaced the loop with plain statements.~~ Done in PR 1.
