---
name: import-design
description: Bring the designer's design into an invite from a Figma link, a PDF exported from Figma, or both — frame pictures, text with fonts and sizes, colours and artwork. Use when the person shares a Figma link or PDF, says "the design is ready", or "I changed the design".
---

# Import the design

## 1. Which invite, and which source?

- If it's not obvious which invite this is for, ask.
- Ask: *"Do you have a Figma link, a PDF, or both?"* Offer those three choices plus "only pictures". Both is best.

## 2a. Figma link

1. Check the key: run `npm run doctor`. If Figma isn't connected, do "Connect Figma" from the **setup** skill first.
2. Ask them to paste the link. In Figma that's **Share → Copy link**. Or right-click the page or frame that holds the website → **Copy link to selection**.
3. Run `npm run figma -- <id> "<link>"`.
   - After the designer changes the file, run it again with `--refresh`.
   - **"Limit reached":** don't retry. Explain that Figma limits free accounts, and switch to the PDF route. Nothing is lost.
   - **Wrong key / can't open the file:** the key must belong to the Figma account that can see the file. Redo "Connect Figma".
   - **A Figma *Site* link:** ask for the link of the *Design* file instead.

## 2b. PDF

1. Ask where they saved it. If they're not sure, look in the likely places and list the newest few PDFs:
   `ls -t "$USERPROFILE/Downloads"/*.pdf "$USERPROFILE/Desktop"/*.pdf 2>/dev/null | head -5`
   Confirm the right file with them.
2. Copy it in: `cp "<path>" invites/<id>/design/`
3. Run `npm run design -- <id>`.
4. In Figma, the PDF comes from: select the frames → **Export** (right panel) → choose **PDF** → Export. Keep the text as real text, not outlined.

## 2c. Only pictures

Copy them into `invites/<id>/design/`. You'll work from the pictures. Ask for the exact wording (or use the couple's details) and for each artwork piece as a transparent PNG.

## 3. Understand it, and tell the designer what you see

1. Read the notes (`design/figma-notes.md` and/or `design/pdf-notes.md`). Look at every frame picture in `design/frames/` and every artwork file in `design/extracted/`.
2. Give a short summary in design language:
   - the frames, and what each one is (hero, invitation, events…)
   - the fonts: on Google Fonts or not. Flag "Personal use" or "Demo" fonts.
   - the main colours
   - the artwork found, and what's missing (e.g. *"the Nandi in the PDF is line art — is there a coloured version?"*)
3. Ask about anything unclear. Read their notes in the design as requirements: what moves, what's tapped, what floats, what opens. Ask one question at a time.
4. If Figma and PDF disagree, ask which is newer.

## 4. Artwork into the theme

- Agree with them which extracted file is which.
- Copy each one into `invites/<id>/theme/assets/images/` with a plain name, e.g. `cp invites/<id>/design/extracted/pdf-frame-3-art-1.png invites/<id>/theme/assets/images/nandi.png`.
- Missing pieces: ask them to export those layers from Figma (select the layer → Export → + → PNG, 2x) and tell you where they saved them.
- A 1200 × 630 share card: if the design has none, ask for one, or offer to make a simple one from the design's artwork and colours for their approval.

## 5. Save

- Record decisions and open questions in `PROGRESS.md`.
- Tick step 2, set "Next step:", then `git -C invites add <id>` and `git -C invites commit -m "<id>: design imported"`.

## When the design changes later

Import again (`--refresh` for Figma, or the new PDF). Compare the new frame pictures with the old ones, tell them what changed, and update only the affected sections, with their approval.
