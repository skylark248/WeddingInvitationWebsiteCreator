---
name: build-section
description: Build the next part of an invite's page from the design, check it against the designer's frame, show it and save it once approved. Use when the person says "build it", "next section", "let's do the events part", or asks for a visual change to a section.
---

# Build a section

One section per round: build → compare with the design → show → approve → save.

## Before the first section of a session

- Read `invites/<id>/PROGRESS.md` and the design notes, and look at the frame pictures in `design/frames/`.
- Read `engine/README.md` if you haven't yet in this conversation.
- Check the preview is running (**preview** skill). If not, start it.

## The very first build of a new invite: foundations

Do this as its own step before any section:

- In `theme.css`, set up the design tokens:
  - colours as CSS variables
  - fonts: the Google Fonts link in `index.njk`, or `@font-face` for font files in `theme/assets/fonts/`
  - the engine variables (`--invite-bg`, `--invite-text`, `--invite-accent`, `--gate-*`)
- Build the page skeleton in `index.njk`:
  - `head.njk`
  - the gate: the engine one, or the theme's own `gate.njk` if the design has a special opening
  - `audio.njk`, if there's music
  - `<main class="invite">` with one empty `<section data-section="…">` per frame
  - `scripts.njk`

## Each section

1. Say which section you're building, in one line.
2. Build it:
   - **Layout** goes in `theme/index.njk`. Use the engine partials where they fit (countdown, venue, rsvp, the event macro). Otherwise write the markup yourself with the data (`events`, `invite.content`…).
   - **Look** goes in `theme.css`. Scale the frame measurements to 390 px using the multiplier in the notes.
   - **Content** comes from `invite.config.json`, never typed into the template. Design-specific content goes under `content`.
   - **Movement** from the designer's notes: `data-reveal` for fade-ins, engine effects (river, starfield, petals), CSS animations, or `theme.js` for anything special.
3. Compare before showing:
   - Run `npm run screens -- <id> --sections --widths 390 --browsers chrome`.
   - Read the section's screenshot next to its frame picture.
   - Fix clear differences in position, size, spacing, colour, font and artwork. Do at most two rounds.
4. Show it: make sure the preview has refreshed, and point them to the section. Ask: *"How does this compare with your design?"* with the choices **Looks right** / **Small changes** / **Not right**.
5. Changes: make them one at a time and show each. If you're not sure which element they mean, say which one you think it is before changing it.
6. When approved:
   - Commit: `git -C invites add <id>` then `git -C invites commit -m "<id>: <section> built"`.
   - Update `PROGRESS.md`: tick the section and write "Next step:".
   - Suggest continuing. After 2–3 sections, suggest a fresh conversation (type /continue there).

## When every section is built

- Run `npm run screens -- <id> --sections` (Chrome and WebKit, at 360/390/430).
- Look for text overflowing, overlapping artwork, anything cut off at 360 px, and differences between Chrome and WebKit. Fix them, then suggest **/check-invite**.

## If you get stuck

- The same fix has failed twice, or the engine can't do what the design needs even with the theme → **/stuck**.
- Never edit engine or script files. The hooks will block it anyway.
