# Design files for this invite

Claude builds the website from your design. You can give it **a Figma link, a PDF, or both**. Both is best. You don't need to put files here yourself: tell Claude where they are and it copies them in.

## Option 1: Figma link (easiest)

1. In Figma, open the design file.
2. Right-click the page or frame that holds the website → **Copy link to selection**. **Share → Copy link** also works.
3. Paste the link to Claude.

The first time, Claude helps you connect Figma. That's a one-time key, and it's free.

## Option 2: PDF

In Figma, select all the website frames → **Export** (right panel) → **PDF** → **Export**. Then tell Claude where you saved it.

## Also useful

| What | How |
|---|---|
| **Artwork** that's drawn in Figma (not a placed picture) | Select the layer → **Export** → **+** → **PNG, 2x**. From a Figma link, Claude picks these up automatically. From a PDF, only placed pictures can be pulled out. |
| **Share card**: the picture WhatsApp shows | A **1200 × 630** frame, exported as **JPG** |
| **Fonts** you bought or downloaded | The font files (.ttf / .otf) |
| **Music** | An MP3, ideally under 3 MB |
| **The couple's details** | Paste their answers to Claude. It saves them here as `couple-details.md`. |

## Designing so the website comes out right

- **Frame width:** any width is fine (390 px is a phone; 1080 px is fine too). Keep all frames the same width.
- **One frame per part of the page**, top to bottom: opening screen, hero, invitation, events, RSVP…
- **Keep text as real text**, not outlined, so the exact words, fonts and sizes come through.
- **A "Notes" frame or sticky notes** for anything that moves or needs explaining, e.g. "water falls from the moon", "2 lotus diyas float down the river", "tap the seal to open".
- **Name your layers** (`nandi`, `moon`, `garland`). It helps Claude and you.
- **Use the couple's real details**, not placeholders.
- **Check font licences.** Fonts marked "Personal use" or "Demo" usually can't be used in paid work.

## What Claude creates here

`frames/` (a picture of each frame), `extracted/` (artwork found in the design), `figma-notes.md` / `pdf-notes.md` (text, fonts, sizes, colours), `couple-details.md`. You can look at these, but you don't need to.
