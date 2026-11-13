# Homepage Card Wall: Development Hand-off

Nov 12, 2026

## Summary

This plan covers rebuilding the uselessachievements.com homepage around a moving wall of achievement cards that sits behind the whole page. A visitor can steer the wall with the mouse or a finger, and click any card to zoom it to the center.

**Files in this folder**

- `HANDOFF.md`: this plan.
- `achievement-catalog.json`: the starter catalog the wall reads from (11 achievements).
- `design-reference/homepage-card-wall.dc.html`: the source of the approved design. It is written for a design tool, not for the site, so treat it as a working reference for behavior and styling, not as code to copy in. Its image URLs (`/_blob/...`) only load inside that tool; use the app's own icon files instead. The useful parts are the CSS (card styles, rarity colors, locked look) and the script (tiling, motion and zoom logic).

**Already built in the app, to be reused as is:**

- The unlock rules (which achievements a user has unlocked).
- The one-achievement-a-day claim.
- Native sharing of an unlocked achievement.

**New work:**

1. An achievement catalog the wall reads from.
2. The wall layer and its motion.
3. The zoom interaction.
4. The locked and unlocked display on the homepage.
5. The new centered homepage layout.

The numbers in this plan (sizes, speeds, timings) are the ones used in the design. Treat them as starting values to tune on real devices.

## 1. Achievement catalog

The wall renders from one list of achievements. Adding or removing an entry must change the wall with no code change.

**Fields per entry**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable slug, e.g. `mouse-mileage`. Must match the id the unlock system uses. |
| `title` | string | Shown on the card. |
| `rarity` | `common`, `rare`, `epic` or `legendary` | Drives card colors. |
| `description` | string | The joke line. Hidden on wall cards on phones, shown when zoomed. |
| `icon` | string | Icon file name or URL. Serve a small version on the wall (see Performance). |

`achievement-catalog.json` holds the 11 achievements used in the design. Three entries have an empty `icon` because the matching file name wasn't confirmed.

**Where it lives.** Two workable options; pick one:

- **A JSON file in the repo.** Simplest. Adding an achievement to the wall is a one-line content change.
- **The existing achievements table**, with a flag such as `show_on_wall`. Better if titles and descriptions already live there, since nothing is duplicated.

**How many.** With 11 entries the wall visibly repeats. Aim for 30 to 40 or more.

**Unlock state is separate.** The catalog says what exists. The existing unlock system says which ids the current user has unlocked. The wall takes both: `catalog` and `unlockedIds`.

## 2. Wall layer

### Structure

- One layer of cards behind all page content.
- Page content sits above it in a centered column. The content wrapper ignores pointer events and only real panels, buttons and links accept them, so cards in the gaps stay clickable.
- In production, make the wall a fixed, viewport-sized layer. The design uses a full-page layer only because of how the design tool displays tall pages. A viewport-sized layer needs far fewer cards in the page.

### Tiling

The wall is a repeating grid, so it can scroll forever in any direction.

- Lay the catalog out in a block of `P` columns by `Q` rows, where `P` is the square root of the entry count rounded up to an even number and `Q` is the count divided by `P`, rounded up.
- Repeat that block across a grid that covers the viewport plus one extra block in each direction.
- Shift every second column down by half a cell for a staggered look. This is why `P` must be even.
- Spread entries through the block with a step that shares no factor with the entry count, so the same card doesn't sit next to itself.

|  | Desktop | Phone (720px wide and under) |
| --- | --- | --- |
| Cell | 310 × 390 px | 196 × 268 px |
| Card | 190 × 256 px | 140 × 196 px |
| Icon | 96 px | 68 px |
| Description on wall | Shown | Hidden |

### Motion

Move the whole layer with a single transform, wrapped by the block size. Do not move cards individually.

| Input | Behavior |
| --- | --- |
| Nothing happening | Slow drift: about 0.35 px per frame sideways and 0.18 px down. |
| Mouse moving | Wall pans away from the cursor. Target speed scales with cursor distance from the screen center, up to about 6 px per frame sideways and 4.5 px vertically. |
| Mouse still for 2.5 seconds | Eases back to the slow drift. |
| Finger drag | Wall follows the drag: about 0.9× sideways and 0.35× vertically, then coasts. Vertical swipes still scroll the page. |
| Page scroll | Wall shifts at about a quarter of the scroll distance, so it appears further away than the content. |

- Ease the actual speed toward the target each frame (factor about 0.06) so changes of direction feel smooth.
- Scale movement by frame time so speed is the same on 60 Hz and 120 Hz screens.
- Pause the wall while a card is zoomed and while the tab is hidden.
- With the reduced-motion setting on, the wall stays still and the zoom opens without animation.

## 3. Zoom

- Clicking a card grows it from its place on the wall to a large card in the center of the screen.
- The animation measures the wall card's position, starts the large card there at the same size, and animates it to the center. Opening takes 0.5 seconds; closing takes 0.4 seconds and returns to the same spot.
- While open: the wall is paused, the source card is hidden, and a light scrim covers the page.
- Closing: an X button in the card's top corner, or a click on the scrim. Add the Escape key too; the design leaves it out.
- After closing, the wall resumes from where it stopped.
- Move keyboard focus into the zoomed card when it opens and back to where it was when it closes.

## 4. Locked and unlocked display

The rules already exist in the app. This section only covers what the homepage shows.

| Situation | On the wall | When zoomed |
| --- | --- | --- |
| Logged out, card not claimed today | Full color | Locked look, no Share, a "Locked. Unlock it to share it." note |
| Logged out, the card claimed today | Full color | Full color, Share button |
| Logged in, locked card | Locked look | Locked look, no Share, the locked note |
| Logged in, unlocked card | Full color | Full color, Share button |

- **Locked look:** grey card and border, icon in greyscale and faded, and a round padlock badge. This matches the app's existing locked card; reuse that component's styling if possible.
- **Why logged-out visitors see color on the wall:** an all-grey wall would lose the visual appeal of the homepage. This was agreed with the owner.
- **Share** calls the existing native share for that achievement.

### Claim button

- Uses the existing claim flow. No rule changes.
- The reveal is the same zoom, starting from the button, with the heading "You unlocked this. Now tell everyone." and a "1 of 10 free" counter line.
- If today's achievement is already claimed, the button reopens that card.
- The claimed card becomes unlocked on the wall straight away.

## 5. Page layout

- **Header:** logo, Instagram link, Login, Sign Up, in a rounded bar.
- **Hero:** centered text only, no graphic. Eyebrow line, headline, one-line description, Claim button, and the free-limit line: "One new achievement a day. Your first 10 are free; Pro keeps them coming." A soft light glow behind the text keeps it readable over the wall.
- **Sections,** each a white panel with wide gaps between so the wall shows through: how it works, rarity tiers, games, Pro and the featured pack, final Claim prompt, footer.
- **Fonts:** the current site fonts. System font at heavy weight for headlines; Fredoka for card titles and Nunito for card descriptions.

## 6. Performance and accessibility

**Performance**

- Serve wall icons as WebP at about 200 px. The source PNGs are over 1 MB each and must not be loaded directly.
- Keep the card count to what covers the viewport plus one repeat block.
- Animate only the transform of the one wall layer.
- Stop the animation loop when the tab is hidden.
- Test on a mid-range Android phone before sign-off.

**Accessibility**

- Wall cards are real buttons with a label such as "Open Mouse Mileage", but are kept out of the tab order so keyboard users aren't forced through dozens of repeats.
- Because of that, give keyboard and screen-reader users another route to the same content, such as a link to a plain list of achievements.
- The zoomed card, X button and Share button must be reachable by keyboard.
- Keep text contrast at 4.5:1 or better, including on locked cards.

## 7. Suggested build order

1. Catalog: agree where it lives, load it on the homepage, pass in the unlocked ids.
2. Static wall: tiling and card styles for all four rarities and the locked look.
3. Motion: drift, mouse follow, finger drag, scroll shift, reduced motion.
4. Zoom: open, close, X, scrim, Escape, focus handling.
5. Wire Share and Claim to the existing app features.
6. New page layout over the wall.
7. Performance pass on phones, then accessibility checks.

## 8. Done when

- Adding an entry to the catalog adds a card to the wall with no code change.
- The wall never shows a gap or a jump when it wraps.
- A card zooms from its exact position and returns to it.
- Share appears only on unlocked cards, for both logged-out and logged-in users.
- A second Claim press on the same day reopens the claimed card.
- With reduced motion on, nothing moves on its own.
- The page stays smooth on a mid-range phone.

## Open questions

- Does the catalog live in a JSON file or in the existing achievements table?
- Which icon files belong to Process Supervisor, Cookie Policy Reader and Unintentional Beta Tester?
- Should seasonal or pack achievements appear on the wall?
- For logged-in users, should unlocked cards appear more often on the wall than locked ones?
