---
name: publish
description: Put an invite on the internet — a private preview link plus a proof sheet for the couple to approve, or the live site on its rivaahdesigns.com address, including the RSVP sheet and the one-time domain setup. Use when the person says "send it to the couple", "preview link", "make it live", "publish", or "update the live site".
---

# Publish

First ask which one they want, unless it's already clear:

- **Preview for the couple:** a private link to approve.
- **Go live:** the real address.
- **Update the live site:** after a change.

## Preview for the couple

1. Check Cloudflare with `npm run doctor`. If it isn't connected, do "Connect Cloudflare" from the **setup** skill.
2. Run `npm run deploy -- <id> --preview`. It runs every check first. If something must be fixed, explain it plainly, fix it, and try again.
3. Run `npm run proof -- <id>` and show them the text.
4. Tell them to send the couple **both** on WhatsApp:
   - the preview link (`https://preview.invite-<id>.pages.dev/`)
   - the proof text
   Ask the couple to reply **OK** or send corrections.
5. Record it in `PROGRESS.md`: tick step 6, and add a row to Deploys with the date, "preview" and the link. Then commit (`git -C invites add <id>`, then `git -C invites commit -m "<id>: preview sent"`), and `git -C invites push` if it has an online backup.
6. Corrections come back → change the config or theme → preview again. Each new preview replaces the old one at the same link.

## Go live

1. **Ask:** *"Has the couple approved the preview and the details?"* Only continue on a clear yes. Write who approved and when in `PROGRESS.md`, step 7.
2. **RSVP sheet.** `rsvp.endpoint` in the config must be the Google Sheet web-app address, not `"local"`.
   - Look for an existing address in another invite's config: `grep -h script.google.com invites/*/invite.config.json`. It's the same for every invite.
   - If there isn't one yet, the one-time sheet setup in `rsvp/SETUP.md` hasn't been done. Walk them through it step by step. It takes about 10 minutes, in the studio's own Google account (the business Gmail).
   - Ask them to add this invite to the **Invites** tab of the sheet: `<id>`, `yes`, the couple's names.
3. Run `npm run deploy -- <id> --live`, then walk them through the steps it prints, one click at a time, waiting for "done" after each:
   - **Cloudflare:** add the custom domain (skipped if it was done automatically).
   - **Hostinger:** in hPanel → Domains → rivaahdesigns.com → DNS, add **one CNAME record**.
     - Warn them first: *"Don't change or delete any other records — they run your main website."*
     - Only delete an existing record with the same name as the subdomain, if the instructions say so.
4. **Verify:** run `npm run verify -- <id>`. If the address isn't found yet, explain that the internet takes 5–30 minutes to learn a new address. Offer to check again later; don't loop.
5. **Real-phone test** (README Part 7.5) together with them, on an iPhone **and** an Android:
   - open the link, open the gate
   - music plays; lock the phone, the music stops; unlock, it comes back
   - scroll everything, send a test RSVP
   - send the link to themselves on WhatsApp to see the preview card
   Afterwards, delete the test RSVP row from the sheet.
6. Tick steps 8–10 in `PROGRESS.md` and add a Deploys row. Commit, and push if it has an online backup. Congratulate them.

## Update the live site

Make the change → `npm run check -- <id> --live` → `npm run deploy -- <id> --live`. The address stays the same, and there's no DNS step. Tell them WhatsApp may keep showing the old preview card for a while, which is normal.
