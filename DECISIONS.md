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

## 2026-10-12: Claude merges when Sloane says "merge it"
- **What:** After checking the preview, Sloane can tell Claude "merge it", and Claude merges the pull request.
- **Why:** Saves her opening GitHub, and keeps her preview check before anything reaches the live app.
- **Rejected:** GitHub auto-merge. There are no automatic checks yet, so it would merge before she has seen the preview, and before a needed migration has run.

## 2026-10-12: Adding an item
- **What:** A round yellow + button at the bottom right of the closet opens "Add an item". She pastes a link and taps "Preview". The app shows the picture, name, store, and price, she picks a type, and taps "Save to closet". The closet shows items two across, with name, store, and price.
- **Type labels:** "Let the app guess", "Top", "Bottom", "Dress or one-piece" (FASHN's `auto`, `tops`, `bottoms`, `one-pieces`).
- **When a store blocks the preview:** "This store didn't share a picture. Upload a screenshot of the item instead."
- **Why:** Sloane chose the button, layout, labels, and message.
- **Rejected:** A "+ Add item" button under the title; three across with pictures only; FASHN's plain category names; a shorter fallback message.

## 2026-10-12: Store images go through the server, then get shrunk in the browser
- **What:** `/api/items/image` fetches the store's picture with the same safety checks as the preview. The browser shrinks it to at most 1600 px as JPEG and saves it to `{user_id}/items/{uuid}.jpg`.
- **Why:** Browsers usually can't read other sites' images directly. Shrinking in the browser reuses the photo code and needs no new library.
- **Rejected:** Server-side image conversion (would need a new library such as sharp).

## 2026-10-12: Safety checks happen when the connection is made
- **What:** The server's store fetcher checks that every address a store name points to is public, at the moment it connects, using Node's own `http`/`https` with a custom address lookup.
- **Why:** Checking first and connecting later lets a tricky site switch its address in between ("DNS rebinding") and reach private machines.
- **Rejected:** Checking the address and then using `fetch`; adding the `undici` library.

## 2026-10-12: "Paste picture" for stores that block the preview
- **What:** When a store blocks the preview, a yellow **Paste picture** button sits next to a sea-glass **Upload a screenshot** button. She copies the product photo in Safari (press and hold, then Copy) and pastes it. On a Mac, Cmd+V works too.
- **Why:** Sloane asked for it. A copied product photo is cleaner than a screenshot, which may help try-ons.
- **Rejected:** Pretending to be Facebook's or Apple's link-preview robots to get past store blocks (impersonation). A Shortcut-based approach is saved as backlog #23.

## 2026-10-12: Blocked-store message mentions pasting
- **What:** "This store didn't share a picture. Paste or upload one instead."
- **Why:** Sloane asked for it once Paste picture was added.
- **Rejected:** The earlier "Upload a screenshot of the item instead."

## 2026-10-13: Trying it on
- **What:** Tapping a closet item opens it. **Try On** is yellow and **Shop** is sea-glass. While FASHN works, the picture shows "Getting you dressed…". When it's done, the try-on shows with an "On me" label, and tapping the picture flips to the store photo ("Original"). **Redo** replaces Try On and asks "Uses 1 credit." first. Closet cards show the try-on photo once there is one.
- **Why:** Sloane chose the waiting message, tap-to-flip, try-on photos in the closet, and the button colors.
- **Rejected:** "Trying it on…"; On me/Original tabs; product photos with a gold dot in the closet; two yellow buttons.

## 2026-10-13: Try-on runs can't double-spend
- **What:** Only one run per item and photo can be in progress. The database's unique (item, photo) rule and status-checked updates stop two quick taps from starting two runs. A finished try-on is reused unless she taps Redo. A run with no answer after 10 minutes counts as failed, so Try On works again.
- **Why:** Every run costs Greg's credits (CLAUDE.md rule 4).
- **Rejected:** Starting a run on every tap; retrying failed runs automatically.

## 2026-10-13: Count completed runs in `tryons.completed_runs`
- **What:** Migration 0002 adds `started_at` and `completed_runs`. Each completed run (first try or Redo) adds 1.
- **Why:** Redo reuses the row, so counting rows would miss Redos. The spending tally in #5 adds these up.
- **Rejected:** A separate table with one row per run (more than needed for now).

## 2026-10-13: Credits line on the item screen
- **What:** Under Try On and Shop: "42 credits left · 23 try-ons · $1.73 spent". Below 10 credits the first part turns orange: "Only 8 credits left". At 0 it reads "Out of credits", and tapping Try On or Redo says "Out of credits." and sends nothing to FASHN. The server checks too, before starting any new run. If FASHN's balance can't be reached, the try-on goes ahead and FASHN decides.
- **Why:** Sloane chose the item screen (seen right before spending), the plain orange number, and stopping at zero.
- **Rejected:** The Profile page or under the closet title; "Running low on credits — ask Dad to top up."; letting FASHN refuse at zero.

## 2026-10-13: Spending counts this account's completed runs
- **What:** "try-ons" is the sum of `tryons.completed_runs` for the signed-in account, Redos included. "spent" is that number × $0.075, worked out in tenths of a cent so it rounds right (23 → $1.73). "credits left" is Greg's shared FASHN balance.
- **Why:** FASHN has no spending history. Each account sees only its own rows, so a brother's or boyfriend's try-ons show on their own screen, not Sloane's.

## 2026-10-13: The closet scene is the home screen
- **What:**
  - **The scene:** a drawn closet (no photos), with Sloane standing in it. A rail of her clothes runs along the bottom: tap to put on and layer, press and hold for details and Shop. **+** and a Profile icon sit in the corners.
  - **Buttons:** "Back to PJs" returns to her starting outfit, and Redo asks "Uses 1 credit." first.
  - **Backgrounds:** each account picks one in Profile.
- **Why:** Sloane wants to start in her closet with an ocean view, wearing her Victoria's Secret PJs, and get dressed from there. She chose drawn art, tap-to-add, a "Back to PJs" button, and icons on the scene.
- **Rejected:** A real or stock photo background; building a whole outfit and then trying it on; an undo-one-layer button; keeping the old closet grid as home.

## 2026-10-13: Layering means trying the next piece on the last picture
- **What:** Each piece is tried on the picture of her already wearing the earlier pieces, at 1 credit per piece. Every combination is saved and free to see again.
- **Why:** FASHN v1.6 dresses one piece at a time.
- **Limit:** FASHN swaps by type, so a new top replaces the top. Jackets over tops aren't guaranteed.

## 2026-10-13: Green screen, so the clothes stick to her and the background can change
- **What:** "Cut me out" (FASHN Background Remove, 1 credit, once per photo) → the cut-out goes on solid green (#00b140) → saved as a new active photo. Try-ons keep the green, and the app removes it for free in the browser, unmixing green from edge pixels.
- **Why:** Sloane wants the background changeable, with her cut out once instead of on every look.
- **Rejected:** Paying 1 credit to cut out every look; Google MediaPipe in the browser (a new library, with softer edges).
- **Risks:** green clothes; slight edge tint. Both can be tuned in code without spending credits.

## 2026-10-13: Brother's background
- **What:** "City & ocean closet": modern greys, dark shelves, a black-framed window onto a city skyline and the ocean.
- **Why:** Sloane asked for a more masculine, modern closet for her older brother.
- **Where it's saved:** each person's choice is on their own account (Supabase user metadata), so his account opens in his scene.

## 2026-10-13: Closets drawn like an interior designer's marker sketch
- **What:** Both backgrounds are one-point-perspective rooms with thin ink lines over soft marker washes (`components/sketch-room.tsx`). Each has a hanging rail on the left, drawers with knobs and cubbies on the right, a runner rug, and a light fixture. Sloane's ocean closet has white built-ins, sea-glass and sand washes, gold knobs, a palm-leaf chandelier, and an arched ocean window. Her brother's city closet has greys, dark ink, a linear light, and a gridded city-and-ocean window.
- **Why:** Sloane shared a hand-drawn walk-in closet sketch she loves, and asked for that style with the beachy sea-glass colors kept.
- **Rejected:** The earlier flat, front-on drawings.

## 2026-10-13: Backgrounds are Sloane's own pictures, not drawn in code
- **What:** The two backgrounds are illustrations Sloane made with an image tool (`public/scenes/ocean-closet.webp`, `public/scenes/city-closet.webp`). The code-drawn sketch rooms are removed.
- **Why:** Drawings made in code looked too flat next to the style she wanted. Pictures she makes herself have real depth and texture, and they're hers to use. They're kept in the public repo, which is fine because they contain nothing personal.
- **Rejected:** More code drawing; using someone else's artwork (not ours to publish).

## 2026-10-13: The clothes area is the inside of a closet
- **What:** Under the scene, her clothes hang on hangers from a rod in a wood cabinet with a warm strip light and a shelf. The colors follow the background: cream wood with a gold rod for the ocean closet, grey wood with a nickel rod for the city closet. The scene is a little shorter so the closet fits on a phone screen.
- **Why:** Sloane asked for the clothes selection area to look like the inside of a closet.

## 2026-10-13: Clothes hang in Sloane's closet-shelf pictures
- **What:** The hanging area is Sloane's shelf illustration, cropped to the bay with the gold rod. Her clothes hang from that rod on hangers and scroll sideways. Profile → Background has a second row, "Closet shelves", so each account can mix and match. By default the shelves follow the background: "Cream & gold" with the ocean closet, "Grey & brass" with the city closet.
- **Why:** Sloane asked for the clothes area to look like her shelf pictures, with an option to change it, where the cream set goes with her closet and the greyer set with her brother's.
- **Rejected:** The wood cabinet built in code; showing the whole two-bay picture (too small on a phone to hang clothes in).

## 2026-10-13: Read background choices fresh, not from the sign-in token
- **What:** `lib/preferences.ts` reads choices with `supabase.auth.getUser()`. Saving a choice also renews the sign-in.
- **Why:** The sign-in token carries a copy of the account's settings that only updates when it renews, so a new choice didn't show up.

## 2026-10-13: Clothes are sorted into closet sections by kind
- **What:** Each item has a kind: Top, Bottom, Dress, Outerwear, Shoes, or Hat. It's picked when adding, and can be changed on the item screen. The closet shows sections made from parts of Sloane's cabinet picture: Hats on the top shelf, Tops and Dresses & outerwear on the hanging rod, Bottoms on the folded shelf, Shoes on the lower shelf. Existing items were sorted from their old FASHN category, and "Let the app guess" items became Tops.
- **Why:** Sloane wants each kind of clothing in its own part of the closet, like a real one.
- **Rejected:** Keeping FASHN's "Let the app guess" category (the kind now decides the category).

## 2026-10-13: Arrows browse; only "Put on" spends
- **What:** Arrows beside her step through tops (upper) and bottoms (lower) and show a card with the piece and **Put on**. Browsing never calls FASHN.
- **Why:** Sloane wanted arrows to rotate through her clothes. Putting on every piece as she flips would spend a credit per new combination. (She asked how this works; it's built this way pending her confirmation.)
- **Rejected:** Putting on each piece as she browses.

## 2026-10-13: Shoes and hats are look-and-shop only
- **What:** Shoes and hats sit on their shelves. Tapping one opens it (with Shop). Try On is hidden, and the server refuses (`not_wearable`).
- **Why:** FASHN v1.6 only dresses tops, bottoms, and one-pieces. Sloane chose to store and shop them for now.
- **Rejected:** Try-On Max for shoes and hats (backlog #43, ask Greg).

## 2026-10-13: "Remove from closet" hides an item
- **What:** It sets `archived_at` and clears the starting outfit. The photo and try-ons stay.
- **Why:** Sloane chose hiding over deleting, so it's safer if she taps it by mistake.
- **Rejected:** Deleting the item, its photo, and its try-ons for good.

## 2026-10-13: Later pieces replace earlier ones of the same type
- **What:** "Wearing" (gold ring, the arrow card) shows only what's actually on: the last top or outerwear, the last bottom, or a dress (which replaces both). Switching back to a piece she just had returns to its saved look for free, as long as only that same slot changed since. Otherwise the piece is tried on top of the current look (1 credit).
- **Why:** Sloane found that after putting on a black shirt, the replaced tank still counted as "Wearing" and couldn't be put back on.
- **Rejected:** Treating every piece ever put on as still worn.

## 2026-10-13: Saved combinations go straight on; swaps replace the last piece
- **What:** When the arrows land on a piece that's already been made in this combination, it goes on immediately, with no "Put on" and no credit. New combinations still show **Put on**. A new piece of the same type as the last one (top after top) is tried on the look before that piece, instead of on top of it.
- **Why:** Sloane didn't want to tap Put on for things she'd already paid for, and switching was slow. Swapping from the earlier look matches what FASHN does anyway, reuses more saved looks, and avoids stacking generations (sharper pictures).
- **Rejected:** Always showing Put on; stacking every new piece on the latest look.

## 2026-10-13: Free mix-and-match of paid pieces
- **What:** Each piece costs 1 credit the first time it's tried on. After that, any outfit made only of tried-on pieces shows for free: a saved picture of exactly that outfit if one exists, otherwise a picture the browser puts together from each piece's own try-on (it copies the part of each picture that changed when the piece went on, bottoms first, tops over them). Mixed outfits get a small "Mixed" tag and a **Make it exact** button, which shows how many credits it uses ("Uses N credits.") before running FASHN, reusing any steps already saved. Redo is hidden on a mixed outfit. A mixed outfit's link is `/?mix=<item ids>`. Replaces the 2026-10-13 rule that a new combination always needs Put on, and `GET /api/tryons/saved` became `GET /api/tryons/looks` (all finished looks at once).
- **Why:** Sloane was charged again for a shirt she'd already paid for, just because she'd changed her bottoms. She chose free mixing with an optional exact version.
- **Rejected:** Charging for every new combination (the old way); always running FASHN for exact pictures.

## 2026-10-13: Sloane's logo
- **What:** Sloane made the logo with her image tool: a cream wood plaque with a gold script "S" and hibiscus (app icon, cropped square; iPhone rounds the corners) and a matching "Sloane's Closet" sign (`public/brand/sign.webp`, background made see-through). The sign replaces the text title on the sign-in page and hangs at the top of the closet scene. To make room, her mirror starts a little lower and her standing figure is a little smaller.
- **Why:** Replaces the placeholder icon (backlog #6) with Sloane's own design.
- **Rejected:** Claude's four drawn logo sketches (gold hanger, gold mirror, beach day, boutique).
