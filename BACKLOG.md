# Backlog

Every to-do, bug, or idea gets a numbered line. When one is done, mark it with the PR number. Never delete a line.

1. ~~Feature 1: Foundation (app, Tailwind, Supabase clients, sign-in, empty closet, manifest, `.env.example`, husky + secretlint, `0001_init.sql`)~~ Done in PR 1.
2. ~~Feature 2: My photo~~ Done in PR 2.
3. ~~Feature 3: Add an item~~ Done in PR 3.
4. ~~Feature 4: Try it on~~ Done in PR 4.
5. ~~Feature 5: Credits~~ Done in PR 5.
6. ~~Design the real app icon (placeholder until then)~~ Done in PR 7: Sloane's gold "S" plaque with hibiscus is the icon, and her "Sloane's Closet" sign is the title.
7. ~~Check: newer Next.js renamed `middleware.ts` to `proxy.ts`. Confirm which name the current version uses when building #1.~~ Done in PR 1: Next.js 16 uses `proxy.ts`.
8. ~~Before first deploy: create Sloane's and Greg's accounts with "Auto Confirm User", then turn off "Allow new users to sign up".~~ Done by Sloane in the Supabase dashboard on 2026-10-12 (no PR, dashboard-only).
9. ~~Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor (Sloane).~~ Done by Sloane on 2026-10-12 ("Success. No rows returned"), for PR 1.
10. ~~After #1 merges: import the repo into Vercel and add the three environment variables on the import screen (Sloane).~~ Done by Sloane on 2026-10-12; sign-in works on the live site.
11. Idea: dark mode. The app is light-only for now so the beachy colors look the same everywhere.
12. Idea: a special font for the "Sloane's Closet" title (currently the same clean font as everything else). 2026-10-13: the title is now Sloane's sign picture (see #6).
13. ~~Bug: `0001_init.sql` failed in the Supabase SQL editor ("syntax error at or near loop"). Replaced the loop with plain statements.~~ Done in PR 1.
14. ~~Idea: more realistic try-ons by sending FASHN several photos, or body measurements. Check FASHN's current docs; as far as we know, try-on v1.6 takes one person photo and no measurements.~~ Answered 2026-10-12 from FASHN's v1.6 docs: one `model_image` only, no measurement inputs. Not possible with v1.6.
15. ~~FASHN docs: `seed` defaults to 42, and the same seed with the same inputs reproduces the same image. Redo must send a new random seed, or it spends a credit on an identical result. Sloane approved 2026-10-12: Redo sends a new random seed. Build it in #4.~~ Done in PR 4.
16. Idea: use FASHN `mode: "quality"` instead of `"balanced"` (docs: same 1 credit, about 12–17 s instead of about 8 s). Sloane to decide. 2026-10-12: Sloane chose to start with the normal version (v1.6, balanced); revisit after trying it.
17. Idea: FASHN "Try-On Max" (docs: higher resolution, more item types, prompt-based customization). Different endpoint and likely a different price, so ask Greg. 2026-10-12: not now; start with v1.6 and see how it goes.
18. ~~Idea: show how much try-ons have cost, by counting completed try-ons in our own database (1 credit = $0.075 each). Could go with the credit balance in #5. FASHN's `GET /v1/credits` only returns the balance (`total`, `subscription`, `on_demand`), with no spending history, so our own count is the way. Sloane approved 2026-10-12: show both credits left and amount spent in #5.~~ Done in PR 5.
19. Idea: logins for Sloane's brothers and boyfriend, each with their own closet and try-ons. Already supported: create each account in Supabase like #8 (sign-ups stay off). Try-ons from every account spend credits from Greg's FASHN account, so check with him.
20. ~~Tapping an item in the closet opens nothing yet. The item screen comes with #4.~~ Done in PR 4.
21. Lululemon blocks the preview: its security service answers "Access Denied" to any automated visit, so the screenshot option is the way in. Tested 2026-10-12: Everlane works (picture, name, $24.00 price); Aritzia also blocks.
22. ~~Idea: a "Paste picture" button, so Sloane can copy a product photo in Safari (press and hold, then Copy) and paste it, instead of taking a screenshot.~~ Done in PR 3.
23. Idea: an iPhone Shortcut in Safari's Share menu ("Add to Sloane's Closet") that grabs the product photo from the page on her phone, like Messages does for link previews, so blocked stores still work without a screenshot.
24. ~~Run `supabase/migrations/0002_tryon_runs.sql` in the Supabase SQL editor before merging #4 (Sloane).~~ Done by Sloane on 2026-10-13 ("Success. No rows returned").
25. ~~Idea: a way to remove or archive items from the closet (`archived_at` is ready in the database).~~ Done in PR 7.
26. ~~New look: the home screen is a scene of Sloane in a clean, beachy closet with an ocean view.~~ Done in PR 6.
27. ~~Starting outfit: she starts the scene wearing the Victoria's Secret SoSoft Modal Short Pajama Set (Coconut White & Blue Stripes).~~ Done in PR 6.
28. ~~Layering: pick clothes from the closet and add them one on top of another on the same look.~~ Done in PR 6.
29. ~~Changeable backgrounds: the clothes stay on Sloane, and the scene behind her can change. Needs her cut out of each look.~~ Done in PR 6.
30. ~~A scene for her older brother: a more masculine, modern closet in greys, with a city and ocean view from the window.~~ Done in PR 6.
31. ~~Run `supabase/migrations/0003_layers_and_starting_outfit.sql` in the Supabase SQL editor before merging #26-#29 (Sloane).~~ Done by Sloane on 2026-10-13 ("Success").
32. ~~Test the green screen for real: "Cut me out" on a photo (1 credit), then put on one piece (1 credit). Check the edges, then tune `lib/green-screen.ts` if needed.~~ Done by Sloane on 2026-10-13: works, edges look good.
33. Green clothes would be partly erased by the green screen. If that happens, switch to a color clothes don't use.
34. ~~Redraw both closets in an interior-design sketch style (ink lines, soft marker washes, room in perspective), keeping the beachy sea-glass colors.~~ Done in PR 6, then replaced by #35.
35. ~~Use Sloane's own closet pictures (made with an image tool) as the two backgrounds, and make the clothes area look like the inside of a closet.~~ Done in PR 6.
36. Idea: let each person upload their own background picture in Profile.
37. ~~Bug: choosing "City & ocean closet" in Profile didn't switch. The choice was saved, but the app read it from the sign-in token, which keeps the old value until it renews (about an hour).~~ Done in PR 6: the app reads choices fresh and renews the sign-in after a change.
38. ~~Use Sloane's updated room pictures (island further back) and her closet-shelf pictures for the hanging area, with a separate shelves choice in Profile.~~ Done in PR 6.
39. ~~Sort clothes by kind (top, bottom, dress, outerwear, shoes, hat) into closet sections made from parts of the cabinet picture.~~ Done in PR 7.
40. ~~Arrows beside Sloane to browse tops (upper) and bottoms (lower); Put on spends, browsing is free.~~ Done in PR 7.
41. ~~Run `supabase/migrations/0004_item_kinds.sql` in the Supabase SQL editor before merging #39 (Sloane).~~ Done by Sloane on 2026-10-13.
42. ~~Idea: an "empty shelves" version of each cabinet picture (no bags, books, coral, or towels where clothes go), so her clothes don't sit on top of painted objects. See the image-tool prompt in PR 7.~~ Done in PR 7: Claude cleared the shelves by painting over objects with clean wall from the same picture.
43. Idea: try on shoes and hats with FASHN Try-On Max (likely costs more; ask Greg).
44. ~~Bug: after putting on a new top, the arrows still showed the replaced top as "Wearing" and wouldn't put it back on.~~ Done in PR 7: the app now works out what's actually worn (a new top replaces the old top, a new bottom the old bottom, a dress both), and switching back to a piece you just had reuses its saved picture for free.
45. ~~Switching to a saved look was slow (several database trips one after another, re-downloading the picture, removing the green on the phone each time, and an empty frame meanwhile).~~ Done in PR 7: lookups run together, saved looks nearby are fetched ahead, prepared pictures are kept, and the current picture stays up until the next is ready.
46. ~~Arrows: if a piece was already paid for in this combination, put it straight on (no "Put on").~~ Done in PR 7.
47. ~~Bug: arrows still showed "Put on" for a piece already paid for, when the outfit was built before swaps (piece added on top) or the piece was an earlier step.~~ Done in PR 7: arrows check every way a saved look can exist (earlier step, swap, added on top), ask the server if unsure, and show "…" while checking.
48. ~~Mixing pieces she already paid for shouldn't cost again (shirt 2 was charged again after changing bottoms).~~ Done in PR 7: each piece is paid once; any mix of paid pieces is put together in the browser for free ("Mixed" tag), with an optional **Make it exact** that shows its credit cost first.
49. Idea: if mixed outfits look off at the waist or sleeves on real photos, tune the mixing (lib/compose.ts) using her actual try-ons.
