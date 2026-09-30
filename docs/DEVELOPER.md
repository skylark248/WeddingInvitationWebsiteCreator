# Developer guide — Wedding Invitation Website Creator

This turns a designer's Figma designs into themed, phone-first wedding invitation websites, checks them, and publishes each one on its own subdomain (e.g. `https://priyaarjun.rivaahdesigns.com`).

It's built so a **designer who doesn't code** can make invites by talking to Claude Code in the Claude desktop app:

- Everything that must be right every time (share previews, time zones, RSVP storage, phone quirks) lives in a tested **engine** and in **scripts**.
- The creative work (layout, artwork, effects) lives in each invite's **theme**.
- A `.claude/` setup (instructions, skills, review agents, guard hooks) keeps Claude on the rails.

> **Designer?** The [README](../README.md) is your guide. This page is for whoever maintains the tool kit.

---

## Public tool kit, private work

This repository is **public**. Nothing confidential is ever committed to it:

| What | Where it lives | In this public repo? |
|---|---|---|
| Engine, scripts, template, Claude setup, docs | this repo | ✅ yes |
| Example designs | `examples/` | ✅ yes, but with **placeholder** artwork, music and fonts |
| **Client work**: every couple's names, family details, designs, artwork, RSVP settings | `invites/`, which is **its own git repository** (local only, or a private GitHub repo) | ❌ never (git-ignored) |
| **Real versions** of example files (designer artwork, bought fonts, music) | `private/`, a mirror of the repo paths | ❌ never (git-ignored) |
| Example design sources (designer PDFs, extracted frames/notes) | `examples/*/design/` | ❌ never (git-ignored) |
| Private keys (Figma token) | `.env` | ❌ never (git-ignored) |

Several independent layers keep it that way:

1. **`.gitignore`** excludes all of the above.
2. **Pre-commit check** (`.githooks/pre-commit` → `npm run check-public`), installed automatically by `npm install`. It refuses a commit that contains:
   - anything from `invites/` or `private/`
   - a file byte-identical to one of the real files in `private/`
   - text containing a client's family lines or family name (read from `invites/*/invite.config.json`)
3. **Claude's guard hook**: on the designer's computer, Claude can't commit to this repo at all. All saving goes to `invites/` with `git -C invites …`, and this repo only receives updates (`git pull`).

### Placeholders and real files

Files that can't be public are replaced in the repo by **placeholders of the same size**:

- simple drawn shapes for artwork
- 2 seconds of silence for music
- Great Vibes (SIL OFL) for a commercial script font

Each design lists its private files in `private-files.json`.

- **Real copies** go in `private/<same path>`, for example `private/examples/shiv-parvati/theme/assets/images/moon.png`. The build **automatically uses the real file** when there is one, so placeholders never show up as "modified" in git and can't be committed by mistake.
- **Check what's real:** `npm run private-files -- shiv-parvati`
- **Restore from originals:** `npm run private-files -- shiv-parvati --from "D:\path\to\original\website"`. It copies each file from where it lived in the original site into `private/`. Design PDFs go into the example's git-ignored `design/` folder.

Without the real files, everything still builds, passes its checks and tests; it just looks plain.

---

## Setup

### Once, by the maintainer

1. **Decide where client work is kept.** `invites/` is always its own git repository, separate from this public one:
   - **Local only** (`npm run private-repo -- --local`): full history and undo on the designer's computer, but **no backup** and no remote help.
   - **Private GitHub repository**, recommended once possible: create an empty repo such as `rivaah-invites` set to **Private**, give both of you access, and run `npm run private-repo -- <url>`. A local-only setup can be connected later, and all history is uploaded.
2. **(Optional) Set up the RSVP Google Sheet** in the studio's Google account: [rsvp/SETUP.md](../rsvp/SETUP.md). This can also wait until the first invite goes live; the `/publish` skill walks through it.
3. **Your own machine:**
   ```bash
   git clone https://github.com/skylark248/WeddingInvitationWebsiteCreator.git
   cd WeddingInvitationWebsiteCreator
   npm install                                   # also installs the pre-commit check
   npx playwright install webkit
   npm run private-repo -- --local            # client work → invites/ (or pass a private repo URL)
   npm run private-files -- shiv-parvati --from "<original site folder>"   # optional: real example art
   ```
   To lift Claude's file guards on your machine (for engine work), create `.claude/settings.local.json`:
   ```json
   { "env": { "INVITE_MAINTAINER": "1" } }
   ```
   The `.env` guard and the pre-commit check stay on.

### The designer's computer (Windows)

Do it together the first time:

1. **Install:**
   - **Node.js LTS** (nodejs.org)
   - **Git for Windows** (git-scm.com). Claude Code on Windows needs it.
   - **Google Chrome**
   - the **Claude desktop app**, signed in with Claude Pro
2. **Get the tool kit.** Clone `https://github.com/skylark248/WeddingInvitationWebsiteCreator.git` into a folder **without spaces**, e.g. `C:\Rivaah\invite-studio`, then open that folder in the Claude app's **Code** tab.
3. **Say "Set up my computer".** The `/setup` skill runs `npm run doctor` and fixes each missing item with them, in plain language:
   - `npm install` and `npx playwright install webkit`
   - their Git name
   - **Client work:** `npm run private-repo -- --local`, or with the private repo URL once one exists.
   - **Connect Figma:** a personal access token from Figma → Settings → Security, scope *File content: read-only*. It's pasted into `.env` through Notepad, never the chat.
   - **Connect Cloudflare:** `npx wrangler login`, with the studio's email. This can wait until the first publish.
   - optionally, the real example files
4. Check that `npm run doctor` is all ✔.

### Updating the designer's tool kit

- **You:** change the tool kit → `npm run test:engine` → bump `engine/VERSION` if the engine changed → commit and push. The pre-commit check runs.
- **Them:** "Update the tool kit". Claude runs `git pull` and `npm install`.
- Existing invites keep their frozen copy of the engine. Only new invites pick up engine changes.

---

## How an invite is made

The designer's side is in the [README](../README.md):

1. The couple fills in [docs/couple-questions.md](couple-questions.md).
2. The designer makes the design in Figma.
3. Claude:
   - imports it (**a Figma link, a PDF, or both**)
   - builds it section by section, with the designer's approval each time
   - checks it with scripts, screenshots and two review agents
   - publishes a preview with a proof sheet for the couple
   - after the couple approves, goes live with the real-phone test

Everything for a couple lives in `invites/<id>/`:

```
invites/<id>/
  invite.config.json   content: names, events, venue, RSVP, share preview, extra content
  theme/               index.njk (page), theme.css, theme.js, assets/ (artwork, fonts, music)
  design/              couple-details.md, frame pictures, extracted artwork, figma-notes.md / pdf-notes.md
  engine/              frozen copy of engine/ from when the invite was created
  PROGRESS.md          where this invite stands (read at the start of every Claude session)
```

## Commands

| Command | What it does |
|---|---|
| `npm run doctor` | Plain-language check that this computer has everything |
| `npm run private-repo [-- --local \| <url>]` | Status; set up `invites/` on this computer only; or connect it to a private GitHub repository (uploads all history) |
| `npm run private-files -- <design> [--from <folder>]` | Which example files are real vs placeholder; restore real ones into `private/` |
| `npm run new -- <id> [--from <design>]` | Create `invites/<id>` from the template, or reuse a finished design for another couple |
| `npm run figma -- <id> <link> [--refresh]` | Read a design from a Figma link (free plan, token in `.env`, ~3 API requests, cached): frame pictures, artwork, `figma-notes.md` |
| `npm run design -- <id>` | Read the PDF(s) in `design/`: frame pictures, embedded artwork, `pdf-notes.md` |
| `npm run serve -- <id> [--lan]` | Local preview with auto-refresh. `--lan` adds a link for a phone on the same Wi-Fi |
| `npm run build -- <id>` | Build into `invites/<id>/dist` |
| `npm run check -- <id> [--live]` | Build and run every check. `--live` is strict about RSVP, map link, etc. |
| `npm run screens -- <id> [--sections] [--gate]` | Screenshots at 360/390/430 px in Chrome and WebKit (Safari's engine) → `.screens/` |
| `npm run proof -- <id>` | WhatsApp-ready text of every detail for the couple to confirm |
| `npm run deploy -- <id> --preview` | Upload a private preview for the couple (Cloudflare Pages) |
| `npm run deploy -- <id> --live` | Upload the real site. Refuses unless `check --live` passes |
| `npm run verify -- <id> [--url …]` | Check the site on the internet: DNS, share preview, files, RSVP sheet |
| `npm run test:engine` | Drive every example in Chrome and WebKit: opening screen, music, petals, countdown, RSVP, river |
| `npm run check-public [-- --all]` | The public-repo leak check (runs automatically before each commit) |

`<id>` is a folder name in `invites/` or `examples/`.

## Repository layout

```
engine/            shared, tested parts: gate, music, countdown, RSVP, reveal, river, starfield, petals
  README.md        ← reference for building themes
template/          starter invite copied by `npm run new`
examples/          two finished designs that share nothing visual (references and engine tests)
  shiv-parvati/    night sky, moon, flowing river, slide-to-open, music   (placeholder art)
  marigold/        cream & maroon, tap-to-open envelope, petals, event cards, no music
scripts/           the commands above
rsvp/              Google Apps Script for the shared RSVP sheet + setup guide
CLAUDE.md          standing instructions for Claude (the designer is not a developer)
README.md          the designer's guide (install → first invite → live)
.claude/           skills, review agents, guard hooks, permissions
docs/              couple questionnaire, this developer guide
.githooks/         pre-commit leak check
invites/           (git-ignored) the private client-work repository
private/           (git-ignored) real versions of placeholder files
```

## Hosting

- **Cloudflare Pages** (free): one project per invite, named `invite-<id>`. Previews go to `https://preview.invite-<id>.pages.dev/`.
- **Domain:** DNS stays at Hostinger, so the main website and email are untouched. Each invite needs one CNAME record, `<subdomain> → invite-<id>.pages.dev`, plus the custom domain added in the Cloudflare project. `npm run deploy -- <id> --live` prints the exact steps.
- **Optional:** set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` so the deploy attaches the Cloudflare custom domain by itself.

## RSVPs

All invites post to one Google Sheet in the studio's Google account (one tab per invite) through an Apps Script web app. See [rsvp/SETUP.md](../rsvp/SETUP.md). While previewing, `"endpoint": "local"` stores test replies in `invites/<id>/.rsvp-test.jsonl`.

## Claude Code setup (the designer's assistant)

- **`CLAUDE.md`** sets how Claude talks (plain design language, one question at a time, show don't tell) and the golden rules:
  - never invent content
  - one approved step at a time
  - never weaken a check
  - publish only via `npm run deploy`
  - save client work only to the private repo
- **Skills** (`.claude/skills/`): `setup`, `start-invite`, `import-design`, `build-section`, `continue`, `preview`, `check-invite`, `publish`, `undo`, `stuck`, `learn`. They trigger from plain requests ("new couple", "here's the PDF", "send it to the couple") or as `/name`.
- **Agents** (`.claude/agents/`): `design-reviewer` compares screenshots with the design frames; `guest-tester` reviews as guests would and checks every detail against `couple-details.md`.
- **Hooks** (`.claude/hooks/`):
  - Edits are limited to an invite's `theme/`, `design/`, config and `PROGRESS.md`, plus `invites/help-requests/`.
  - Shell commands can't write elsewhere, call wrangler directly, force-push, reset, rewrite history, skip hooks, change packages, touch `.env`, or commit to the public repo.
  - At session start, Claude is told where each invite stands and whether client work is backed up.
- **Help requests:** `/stuck` writes a note to `invites/help-requests/`. With an online backup it's pushed for you; if local only, the designer sends it on WhatsApp.

## Changing the engine

1. Edit `engine/`, run `npm run test:engine` and `npm run screens -- shiv-parvati`, then bump `engine/VERSION`.
2. Existing invites keep their frozen copy. To upgrade one, copy the new `engine/` into `invites/<id>/engine/` and re-check it.

## Every design is different

- The engine holds only what nearly every invite needs: opening screen, music, countdown, RSVP, venue link, share preview, and the checks.
- The river, starfield and petals are optional effects that run only when a theme adds their markup.
- A theme is free-form HTML/CSS/JS. It can replace any engine partial (e.g. its own `gate.njk`), write its own event layout, keep design-specific content under `content` in the config, and bring its own libraries.
- See [engine/README.md](../engine/README.md).

## Licences and credits

- **Cormorant Garamond** and **Great Vibes** (the placeholder script font) are under the SIL Open Font License; the licence files sit next to the fonts.
- **Placeholders:** example artwork in this repo is simple placeholder drawing. The real Shiv–Parvati artwork, music and *Hello Bride Script* font belong to their owners and are **not** included.
- **Example content:** names and dates in the examples are fictional.
