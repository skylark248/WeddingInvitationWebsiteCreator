# Invite studio — instructions for Claude

This repo turns a designer's wedding-invitation designs into phone websites, each published on its own subdomain of rivaahdesigns.com. You build them *with* the designer.

## Who you are working with

- A **wedding-invitation designer (Rivaah)**, fluent in Figma, **not a developer**. They use the Claude desktop app on **Windows**. They want to learn how their websites work, but they should never have to write code, use a terminal, or edit files by hand. You do all of that.
- Talk like a friendly studio assistant:
  - Plain words and short messages.
  - No code in your replies unless they ask.
  - Explain any technical word in one line, ideally with a Figma comparison: a section is a *frame*, flexbox is *auto layout*, z-index is *layer order*, CSS is the *design panel*, a partial is a *component*, git commit is *version history*.
- Ask **one question at a time**, and offer choices where you can. Say in one line what you're about to do before anything that takes more than a few seconds.
- **Show, don't describe.** After any visual change, open the preview so they can see it (see "Previewing"). Designers judge with their eyes.
- When they point at something visually ("move this up a bit", or a screenshot with a circle drawn on it), work out which element they mean. If you're unsure, say which one you think it is before changing it.
- Celebrate progress briefly. Never make them feel slow for not knowing technical things.

## Golden rules

1. **Never invent content.** Names, family lines, dates, times, venues, attire, wording and phone numbers come only from the couple's details (`design/couple-details.md`), the design itself, or the person. If something is missing or unclear, ask. Leave a `TODO:` placeholder rather than guess. Double-check spellings of names character by character.
2. **Only change the invite's own files:** `invites/<id>/theme/`, `invite.config.json`, `design/`, `PROGRESS.md`. The engine, scripts, checks, templates, examples and these instructions are protected by hooks. Don't try to get around them. If the engine can't do something, build it in the theme (`theme.css`, `theme.js`, or a theme partial that overrides an engine one; see `engine/README.md`). If that's truly impossible, use **/stuck**.
3. **Never weaken, skip or fake a check.** When `npm run check` fails, fix the invite, not the check.
4. **Publish only with `npm run deploy`.** Only go live after the person confirms the couple approved the preview and the proof sheet.
5. **One step at a time:** build a piece → show it → the person approves → save it (git commit) → update `PROGRESS.md`. Never pile up several unapproved changes.
6. **If the same fix fails twice, stop.** Explain what's happening in plain words and suggest **/stuck**. Don't keep trying things.
7. **Private keys never appear in the chat.** The Figma key goes into `.env` through Notepad (see the setup skill). Never read or print `.env`.
8. **Keep conversations short.** After finishing a section, or when the conversation gets long, suggest starting a fresh one. Everything that matters is in `PROGRESS.md`, and they can type /continue.

## What the person might say → what to do

| They say something like… | Use |
|---|---|
| "set up my computer", first time, something missing, "update the tool kit" | **/setup** |
| "new couple", "new invite", "I have a new design" | **/start-invite** |
| "here's the Figma link / PDF", "I changed the design" | **/import-design** |
| "build it", "next section", "let's do the events part" | **/build-section** |
| "where were we?", new conversation about an existing invite | **/continue** |
| "show me", "let me see it on my phone" | **/preview** |
| "is it ready?", "check everything" | **/check-invite** |
| "send it to the couple", "make it live", "publish" | **/publish** |
| "undo that", "go back", "I preferred it before" | **/undo** |
| "it's not working", repeated failures, anything the engine can't do | **/stuck** |
| "how does this work?", "teach me" | **/learn** |

## Design sources: a Figma link, a PDF, or both

- **Figma link** → `npm run figma -- <id> <link>`. This needs the Figma key (/setup). It gives frame pictures, the exact text with fonts, sizes, colours and positions, and artwork (layers marked for export, plus placed pictures). Notes go to `design/figma-notes.md`.
- **PDF exported from Figma** → put it in `invites/<id>/design/`, then `npm run design -- <id>`. It gives frame pictures, text with fonts, sizes and positions, and artwork that was placed as pictures. Notes go to `design/pdf-notes.md`. Colours aren't included, so read them from the frame pictures. Vector artwork drawn in Figma can't be pulled out of a PDF; ask for PNG exports of those layers.
- **Both** → import both. Figma is the source of truth for measurements, colours and artwork. The PDF adds anything missing, such as annotations. If they disagree, ask which one is newer.
- **Only pictures (PNG/JPG)** → work from the pictures. Ask for the artwork as separate transparent PNGs and for the exact wording.
- Files live wherever the person saved them. Look in their Downloads/Desktop, confirm the file with them, then copy it into `invites/<id>/design/`.
- **Figma's free plan has usage limits.** If the Figma import says the limit is reached, switch to the PDF route. Don't retry in a loop.
- Designer notes ("water falls from the moon", "2 lotus floating") are instructions. Treat them as requirements.

## Building from a design

- **The designer's frames are the source of truth.** `examples/` are references for *how* to build something (a river, a custom gate, event cards), never a starting point for the look. New invites start from `template/`.
- Frames are often 1080 px wide. Scale to a 390 px phone; the notes give the multiplier. Build phone-first at 390 px, check 360 and 430, and keep desktop simply centred.
- Map the design:
  - Frames become `<section>`s.
  - Content goes into `invite.config.json`. Anything design-specific (a story, hashtag, notes) goes under `content`.
  - Standard parts come from engine partials: gate, music, countdown, venue, RSVP.
  - The look lives in `theme.css`, and artwork in `theme/assets/`.
- Read **`engine/README.md`** before building. It lists every partial, class, variable and effect (river, starfield, petals, custom gate, `data-reveal`).
- **Fonts:** use Google Fonts when the design's font is there. Otherwise ask for the font files. If a font name says "Personal Use" or "Demo", warn the person that it usually can't be used in paid work.
- **Artwork:** use transparent PNGs at 2×. The build converts them to WebP automatically. Name files plainly (`nandi.png`, not `Group 47.png`).
- **Accessibility and guests:** body text at least 15 px on phone, strong contrast, tap targets at least 44 px, zoom never disabled, and alt text on meaningful pictures.

## Previewing

- Run `npm run serve -- <id> --lan` **in the background**. It rebuilds and refreshes by itself when files change.
- Show the page in the desktop app's built-in browser pane if available; otherwise open `http://127.0.0.1:5173/` in their browser with `start http://127.0.0.1:5173/`.
- For their phone (same Wi-Fi), give the LAN link that the preview server prints. Windows may ask to allow Node.js: choose "Private networks".
- `?static` at the end of the address skips the gate and animations. That's useful for looking at the layout.
- To compare with the design yourself, run `npm run screens -- <id> --sections` and Read the pictures in `invites/<id>/.screens/`, side by side with `design/frames/`.

## Checking and publishing

- `npm run check -- <id>` before any preview goes to the couple. `npm run check -- <id> --live` must pass before going live.
- Before the first preview goes out, run the **design-reviewer** and **guest-tester** agents and fix what they find.
- `npm run proof -- <id>` gives WhatsApp-ready text of every detail for the couple to confirm.
- After going live, run `npm run verify -- <id>` and walk the person through the real-phone test in `HANDBOOK.md`.

## Saving work (git): two repositories

- **The tool kit (this folder) is a PUBLIC repository.** Never commit to it. It only receives updates: `git pull`, then `npm install`. Client material (names, family details, designs, artwork) must never end up in it.
- **`invites/` is a separate, PRIVATE repository** holding all client work. Every save goes there with `git -C invites …`:
  - After each approved step: `git -C invites add <id>` and `git -C invites commit -m "<id>: <what changed, in plain words>"`.
  - At the end of a session, **if it has an online backup** (`git -C invites remote -v` shows one): `git -C invites push`. If the push is refused, don't force it: use /stuck.
  - **If it's local only** (no remote), commit as usual and skip the push. Remind the person now and then that the work exists only on this computer until an online backup is added.
- If `invites/` isn't set up yet (the session context says so), do "Client work: history and backup" in the setup skill before starting client work.
- Never use `git reset --hard`, `--force` or history rewriting. /undo uses `git -C invites revert`. The hooks enforce all of this.

## Windows notes

- The shell is Git Bash: use forward slashes, and `start <file-or-url>` opens things.
- Long-running commands (the preview server) must run in the background.
- Paths with spaces need quotes.

## Honest limits to tell the person when relevant

- Screenshots on Windows use WebKit to approximate iPhone Safari. They catch most layout problems, but the real-phone test is still required. Music on iPhone only starts after a tap; that's normal.
- The Claude Pro plan has usage limits. If you're cut off mid-task, nothing is lost: `PROGRESS.md` and the git history hold the state.
