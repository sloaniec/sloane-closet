# Try-On Closet

Sloane's virtual closet. She saves clothes from any online store, sees herself wearing them, and taps through to buy.

## People

- **Sloane** is the owner and decides how the app looks and behaves. Ask her before choosing anything about look, feel, or wording. Explain each change in plain language, because she is learning how this works.
- **Greg** (her dad) is a collaborator. He owns the FASHN account that pays for try-ons.

## Stack

- Next.js (latest stable), App Router, TypeScript, Tailwind CSS.
- Supabase for the database, sign-in, and photo storage. Use `@supabase/ssr` and `@supabase/supabase-js`.
- FASHN Virtual Try-On v1.6 API for try-on images.
- Vercel Hobby for hosting. It deploys from this public GitHub repo.
- Mobile-first web app that can be added to the iPhone home screen (web manifest, apple-touch-icon, `display: standalone`).

## Environment variables

There are exactly three. They live in Vercel's project settings and never in this repo.

| Name | Used in |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser and server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser and server (starts with `sb_publishable_`) |
| `FASHN_API_KEY` | server only. Never add a `NEXT_PUBLIC_` prefix. |

- Don't use a Supabase secret key (`sb_secret_…`) or the legacy `anon` / `service_role` keys. Server code acts as the signed-in user, so row-level security always applies.
- Commit `.env.example` with the three names and empty values. Commit no other env file.

## Rules

1. **No keys in the repo.** Never ask anyone to paste a key into chat, and never write a key into a file.
2. **Pre-commit guard.** Set up husky with a pre-commit hook that runs secretlint (`@secretlint/secretlint-rule-preset-recommend`) on staged files. The hook also rejects any staged file named `.env*` other than `.env.example`.
3. **Sloane's photos are private.** Use one private Storage bucket, and show images only through signed URLs. Never create a public URL.
4. **Spend credits only when Sloane taps Try On** (including tapping a piece on the closet rail) **or Cut me out.** Never call FASHN from tests, scripts, seed data, or retry loops. `num_samples` is always 1. If a completed try-on exists for the same item and photo, show it again instead of generating a new one. The only exception is when she taps Redo and confirms.
5. **Row-level security on every table**, with explicit grants to `authenticated`.

## Data

### Storage

Use one private bucket named `closet`. Every object path starts with the owner's user id:

- `{user_id}/person/{uuid}.jpg`: her full-body photos.
- `{user_id}/items/{uuid}.jpg`: product images, copied in when the item is saved so a dead store link doesn't break the closet.
- `{user_id}/tryons/{tryon_id}.jpg`: try-on results.

Add policies on `storage.objects` for bucket `closet`. Signed-in users can select, insert, update, and delete only objects where `(storage.foldername(name))[1] = auth.uid()::text`.

### Tables (schema `public`)

Every table has these columns:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null default auth.uid() references auth.users on delete cascade`
- `created_at timestamptz not null default now()`

Row-level security: each user can select, insert, update, and delete only rows where `user_id = auth.uid()`.

- **`person_photos`**: `storage_path text not null`, `is_active boolean not null default false`. Add a partial unique index so each user has at most one active photo.
- **`closet_items`**: `product_url text not null`, `title text`, `store text`, `price_text text`, `image_path text not null`, `category text not null default 'auto'` (check: `auto`, `tops`, `bottoms`, `one-pieces`), `archived_at timestamptz`.
- **`tryons`**: `item_id` references `closet_items` (on delete cascade), `person_photo_id` references `person_photos` (on delete cascade), `status text not null` (check: `pending`, `completed`, `failed`), `fashn_id text`, `result_path text`, `error text`, `completed_at timestamptz`. Unique on (`item_id`, `person_photo_id`). Redo updates the existing row.

### meta.whoami()

Migration 0001 creates schema `meta` and a function `meta.whoami()` that returns `'Sloane Closet'`. Greg uses it to confirm which database he's connected to. Don't expose the `meta` schema through the Data API.

## Migrations

- Write each migration as a numbered SQL file in `supabase/migrations/` (`0001_init.sql`, `0002_<name>.sql`, …). Never edit a migration that has been applied. Write a new one instead.
- You can't reach the database from your session. After writing a migration, tell Sloane: "Open https://supabase.com/dashboard/project/_/sql/new, paste the contents of `supabase/migrations/000N_<name>.sql`, run it, and tell me what it says." Don't merge code that depends on the migration until she confirms it ran.

## Sign-in

- Sign-in is by email and password through Supabase Auth. The app has no sign-up screen.
- Sloane creates both accounts (hers and Greg's) at https://supabase.com/dashboard/project/_/auth/users with "Auto Confirm User" checked. Then she turns off "Allow new users to sign up" at https://supabase.com/dashboard/project/_/auth/providers. Remind her of both steps before the first deploy.
- Don't use magic links. A link opened from an email lands in Safari, not in the home-screen app, so the sign-in wouldn't carry over.
- The session stays signed in between launches. Every page except sign-in requires a session, and middleware redirects to sign-in when there isn't one.

## Features

Build these in order, with one pull request for each.

### 1. Foundation

Set up:

- the app and Tailwind
- the Supabase clients (browser, server, and middleware)
- the sign-in page and an empty closet screen
- the web manifest, with a placeholder icon until Sloane designs one
- `.env.example`
- husky and secretlint
- `0001_init.sql` with all tables, policies, the storage bucket, the storage policies, and `meta.whoami()`

After this merges, Sloane imports the repo into Vercel and adds the three environment variables on the import screen.

### 2. My photo

- Sloane uploads a full-body photo: front-facing, good light, simple background, fitted clothes.
- Before uploading, resize it in the browser so the long edge is at most 1600 px, and save it as JPEG. FASHN works at 864 × 1296, so anything larger is wasted.
- She can keep several photos and choose which one is active.

### 3. Add an item

- She pastes a product link. The server route `/api/items/preview` fetches the page and reads `og:image`, `og:title`, `og:site_name`, and a price from JSON-LD `Product` if one is there.
- The app shows a preview. She can edit the title and pick a category (default `auto`). On save, copy the image into Storage.
- The preview route:
  - requires a signed-in user
  - allows only http and https
  - refuses hosts that resolve to private, loopback, or link-local addresses
  - times out after 8 seconds
  - reads at most 3 MB
  - follows at most 3 redirects
- Many stores block automated fetches. When the preview fails, she can upload a screenshot or photo of the item instead. The pasted link is kept and she types the title.

### 4. Try it on

The item screen shows a large product image and two buttons:

- **Try On**
- **Shop**, which opens `product_url` in a new tab with `rel="noopener"`.

**Starting a try-on.** Try On calls `POST /api/tryons` (signed-in users only).

- If a completed try-on exists for this item and her active photo, return it.
- Otherwise, create a `pending` row and call FASHN, using signed URLs that expire after 10 minutes for both images:

```
POST https://api.fashn.ai/v1/run
Authorization: Bearer $FASHN_API_KEY
Content-Type: application/json

{
  "model_name": "tryon-v1.6",
  "inputs": {
    "model_image": "<signed URL of her active photo>",
    "garment_image": "<signed URL of the item image>",
    "category": "<item category>",
    "garment_photo_type": "auto",
    "mode": "balanced",
    "num_samples": 1,
    "output_format": "jpeg",
    "return_base64": true,
    "moderation_level": "permissive"
  }
}
```

Save the returned `id` in `fashn_id`.

**Checking on it.** The browser polls `GET /api/tryons/{id}` every 2 seconds, for up to 60 seconds. That route checks `GET https://api.fashn.ai/v1/status/{fashn_id}`.

- On `completed`, decode the base64 image, upload it to `{user_id}/tryons/{tryon_id}.jpg`, and mark the row completed.
- On `failed`, save the error and show a friendly message. A `PoseError` means "try a clearer full-body photo." Failed runs don't use credits.

Keep every route short. Never wait inside a single request for FASHN to finish.

**The result screen** shows the try-on image with a before/after toggle, plus **Shop** and **Redo**. Redo asks for confirmation first: "Uses 1 credit." Redo sends a new random `seed` (0 to 2^32 − 1) in `inputs`. FASHN defaults to `seed` 42, and the same seed with the same images returns the identical picture. A first try-on leaves `seed` out.

`return_base64` keeps the result off FASHN's servers: it is available there for 60 minutes instead of three days. Greg set `moderation_level` to `permissive`. Don't change it without asking him.

### 5. Credits

Show a small credit balance using a server route that calls `GET https://api.fashn.ai/v1/credits` (use `credits.total`). Warn when the balance drops below 10.

Next to it, show what try-ons have cost, for example "12 credits left · 23 try-ons · $1.73 spent". FASHN has no spending history, so count it ourselves: every completed run costs 1 credit ($0.075 on-demand), and failed runs cost nothing. Redo overwrites the `tryons` row, so counting rows misses Redos. Keep a running count of completed runs per try-on instead (a new migration).

### 6. Closet scene (home screen)

- The home screen is a scene: a background picture with Sloane standing in it. The backgrounds are illustrations Sloane made with an image tool, in `public/scenes/`. Each account picks one in Profile: "Ocean closet" (her bright beachy closet with an ocean view) or "City & ocean closet" (modern greys, for her older brother). The choice is saved in Supabase user metadata (`scene`).
- Her clothes hang on hangers from the gold rod in a "closet shelves" picture under the scene (also Sloane's illustrations, cropped to the hanging section, in `public/shelves/`). Each background has a matching set (ocean → cream & gold, city → grey & brass), and Profile lets each account pick a different set (`shelves` in user metadata).
- Read these choices with `getPreferences()` (`supabase.auth.getUser()`), not from the sign-in token's claims: the token only picks up metadata changes when it renews. Tap a piece to put it on, which layers it on top of the current look. Press and hold a piece to open its item screen.
- **Layering:** a try-on can sit on an earlier try-on (`tryons.base_tryon_id`). The earlier result becomes FASHN's `model_image`. Saved combinations are free to show again. FASHN swaps clothes by type, so a new top replaces the top rather than going over it.
- **Starting outfit:** one item per account (`closet_items.is_starting_outfit`), set from its item screen. The scene opens in it, and "Back to PJs" returns to it for free.
- **Green screen:** "Cut me out" on a Profile photo runs FASHN `background-remove` once (1 credit, transparent PNG). The browser puts the cut-out on solid green (#00b140) and saves it as a new active photo (`person_photos.green_screen`). Try-ons on that photo keep the green, and the browser removes it (`lib/green-screen.ts`), so she stands in the scene. Without a green-screen photo, she shows in a gold mirror instead.
- The current look is in the URL (`/?look=<tryon id>`, or `/?mix=<item ids>` for a mixed outfit).
- **Kinds and closet sections:** each item has a `kind` (`top`, `bottom`, `dress`, `outerwear`, `shoes`, `hat`; see `lib/kinds.ts`), which sets its closet section and its FASHN category. Top to bottom, the sections are: Hats (top shelf), Tops (hanging rod), Dresses & outerwear (hanging rod), Bottoms (folded shelf), and Shoes (lower shelf). Each is a part of Sloane's cabinet picture with the shelves emptied (`public/shelves/{set}-{hats,tops,bottoms,shoes}-empty.webp`). FASHN v1.6 can't put on shoes or hats, so they're for looking at and Shop only: tapping one opens it, and the server refuses to try it on (`not_wearable`).
- **What's worn:** `lib/outfit.ts` works out what's actually on from the pieces put on, in order: a new top or outerwear replaces the top, a new bottom replaces the bottom, and a dress replaces both.
- **Arrows:** two pairs beside her, at chest height for tops and lower for bottoms. They browse that section. A piece that's free to wear (see Mix and match) goes straight on. Otherwise a card shows it with **Put on**, and only Put on spends a credit.
- **Mix and match:** each piece costs 1 credit once. Any outfit made only of tried-on pieces is free: a saved try-on of exactly that outfit (`lib/mix.ts`), or else a picture the browser mixes from each piece's own try-on (`lib/compose.ts`: copies where the picture changed when the piece went on; bottoms first, tops over them). Mixed outfits show a "Mixed" tag and **Make it exact** (says "Uses N credits." first, reuses saved steps). Mixed links are `/?mix=<item ids>`. A new piece is tried on the saved look closest to the new outfit.
- **Speed:** `GET /api/tryons/looks` lists every finished look of her active photo once. The scene keeps prepared (green-removed) and mixed pictures in memory, gets the next arrow piece ready, and keeps the current picture up until the next is ready.
- **Remove from closet** (item screen) hides an item (`archived_at`). Its photo and try-ons stay in the database.

If anything in this file disagrees with FASHN's current docs (https://docs.fashn.ai/api-reference/tryon-v1-6), stop and tell Sloane what's different before changing the code.

## How we work

- Every change goes on its own branch with a pull request. Sloane checks the Vercel preview on her phone, then merges.
- Sloane can also say "merge it" in chat, and Claude merges the pull request for her. Only merge when she says so, never automatically. Never merge code that depends on a migration until she confirms the migration ran.
- `BACKLOG.md`: give every to-do, bug, or idea a numbered line as soon as it comes up. When one is done, mark it with the PR number. Never delete a line.
- `DECISIONS.md`: record every decision that should outlive the task it came from. Include the date, the reason, and what was rejected.
- Refer to backlog items by number in commits and pull requests ("#4").
- Ask Sloane before adding a library, a service, or anything that costs money.
