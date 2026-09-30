---
name: setup
description: Get this computer ready, or fix what's missing — tools, the iPhone test browser, Git name, connecting Figma (for Figma links) and Cloudflare (for publishing). Use the first time, when the person says "set up", "connect Figma", "it says something is missing", or when another step reports a missing tool or login.
---

# Setup

Get the computer ready one item at a time. The person isn't technical: tell them what each step is for in one line, and do everything you can yourself.

1. Run `npm run doctor` and read the result.
   - If `npm` isn't found at all, Node.js is missing. Ask them to install **Node.js LTS** from https://nodejs.org (the big green button, default options), then fully quit and reopen the Claude app. Stop here until that's done.
2. Fix each ✖ in this order, re-running `npm run doctor` at the end.
   - **Project tools not installed:** run `npm install`, then `npx playwright install webkit`. Say it downloads a few hundred MB, once.
   - **Git name not set:** ask for their name and email (the email of their GitHub account, if they have one). Then run `git config --global user.name "…"` and `git config --global user.email "…"`.
   - **Google Chrome missing:** ask them to install it from https://www.google.com/chrome.
   - **WebKit missing:** run `npx playwright install webkit`.
   - **Figma not connected:** only needed if they'll give Figma links. See "Connect Figma" below.
   - **Cloudflare not connected:** only needed to publish. It can wait until the first publish. See "Connect Cloudflare" below.
3. Finish with a short summary: what's ready, and what's left for later.

## Connect Figma (free plan is fine)

The key must never be pasted into the chat.

1. If `.env` doesn't exist, run `cp .env.example .env`.
2. Tell them, one step per line:
   1. In Figma, click your profile picture (top-left) → **Settings** → **Security** tab.
   2. Under **Personal access tokens**, click **Generate new token**.
   3. Name it `Invite studio`. Choose the longest expiry offered. Under scopes, set **File content** to **Read-only** (nothing else is needed). Click **Generate token**.
   4. Click **Copy**. Figma only shows it once.
3. Run `start notepad .env` and say: *"A Notepad window has opened. Click right after `FIGMA_TOKEN=`, paste (Ctrl+V), then save (Ctrl+S) and close Notepad. Please don't paste the key here in the chat."*
4. When they say done, run `npm run doctor` and confirm "Figma connected". If they have a Figma link handy, offer to try it with /import-design.
5. If Figma later says the key is wrong or expired, repeat these steps. A new key replaces the old line.

## Connect Cloudflare (for publishing)

1. Explain: *"Cloudflare is the free service that puts the invitations on the internet. You'll sign in once in your browser."*
2. Run `npx wrangler login`. It opens the browser. They sign in or create a free account with the studio's business email, then click **Allow**. The command finishes by itself.
3. Run `npm run doctor` to confirm "Cloudflare connected".

## Client work: history and backup, before the first invite

The tool kit is public. All client work lives in `invites/`, its own separate repository, and never goes to the public tool kit.

1. Run `npm run private-repo` to see the current state.
2. **Not set up yet:**
   - If the maintainer has given a private GitHub address, run `npm run private-repo -- <address>`.
     - The first time, a GitHub sign-in window opens. They sign in with the GitHub account that has access to that repository.
     - If access is refused, ask the maintainer to add their GitHub account. Don't try anything else.
   - Otherwise, set it up **on this computer only** with `npm run private-repo -- --local`. Saving and undo work fully. Explain in one line that there's no online copy yet, so the maintainer should set up a backup soon.
3. **Local only, and an address arrives later:** run `npm run private-repo -- <address>`. It uploads everything, including all history. Nothing is redone.
4. Run `npm run doctor` to confirm.

## Real files for the examples (optional)

The examples in `examples/` have placeholder artwork in the public repo. To see them with the real artwork, run `npm run private-files -- shiv-parvati --from "<folder with the original website>"`. The real files go into `private/`, which is never uploaded. Only do this if they have those originals.

## Updating the tool kit

When the maintainer says there's an update (or they ask to "update the tool kit"):

1. Run `git pull`, then `npm install`.
2. Mention that existing invites keep their frozen engine. Only new invites get engine changes.
3. If `git pull` complains about local changes, stop and use /stuck.
