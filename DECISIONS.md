# Decisions

Decisions that should outlive the task they came from. Each one has a date, the reason, and what was rejected.

## 2026-10-12: The app is called "Sloane's Closet"
- **Why:** Sloane chose it.
- **Rejected:** "Try-On Closet" (the working name in CLAUDE.md).

## 2026-10-12: Look and feel is beachy sea glass
- **What:** Soft, warm, bright sea-glass greens and sandy cream, with pops of yellow, orange, and gold. Colors live in `app/globals.css`.
- **Why:** Sloane chose this feel.
- **Rejected:** A dark mode for now, so the colors look the same on every phone (backlog #11).

## 2026-10-12: Screen wording
- **What:** The sign-in screen says "Sign In". The empty closet says "Add clothing item links to build the wardrobe."
- **Why:** Sloane chose the wording.

## 2026-10-12: Use `proxy.ts`, not `middleware.ts`
- **Why:** Next.js 16 renamed middleware to proxy. The old name still works but is deprecated.
- **Rejected:** `middleware.ts`.

## 2026-10-12: Try-ons can only use their owner's item and photo
- **What:** `tryons` links to `closet_items` and `person_photos` by both `id` and `user_id`.
- **Why:** Database links skip row-level security, so a plain link to `id` alone would let one account point a try-on at another account's item or photo.
- **Rejected:** Plain foreign keys on `id` only.

## 2026-10-12: Photos live on a Profile page
- **What:** A "Profile" link at the top right of the closet opens a page with her try-on photos: a short "Best results" tips list, an "Upload my photos" button (several at once), and the photos in a grid. The active one has a gold border and a "Using this one" label. Others have "Use this one" and "Remove".
- **Why:** Sloane chose the Profile link, button wording, tips, and gold border. "Sign out" moved from the closet header to the bottom of Profile to keep the header to one link.
- **Rejected:** A bottom tab bar; a checkmark badge for the active photo.

## 2026-10-12: Photos are shrunk in the browser before upload
- **What:** Long edge at most 1600 px, saved as JPEG at 90% quality.
- **Why:** FASHN works at 864 × 1296, so bigger files just upload slower and take more storage.
- **Rejected:** Uploading the original phone photo.

## 2026-10-12: Start with FASHN Try-On v1.6 in balanced mode
- **What:** Try-ons use `tryon-v1.6` with `mode: "balanced"`, as in CLAUDE.md. FASHN's docs say this is 1 credit per image, and on-demand credits cost $0.075 each.
- **Why:** Sloane wants to start with the normal version and see how the results look.
- **Rejected for now:** `mode: "quality"` (same price, slower; backlog #16) and Try-On Max (sharper results, likely pricier; backlog #17).

## 2026-10-12: Redo uses a new random seed
- **What:** When Sloane taps Redo and confirms, the FASHN request includes a new random `seed`. The first try-on leaves it out.
- **Why:** FASHN defaults to seed 42, and the same seed with the same images gives back the identical picture. Without a new seed, Redo would spend a credit for nothing.
- **Rejected:** Leaving the seed at its default (Redo would repeat the same image).

## 2026-10-12: Show credits left and amount spent
- **What:** The credits feature (#5) shows the FASHN balance and the app's own tally of try-ons and dollars spent, for example "12 credits left · 23 try-ons · $1.73 spent".
- **Why:** Sloane wants both. FASHN's API only returns the balance, so the app counts completed runs itself (Redos included).
- **Rejected:** Showing the balance only.
