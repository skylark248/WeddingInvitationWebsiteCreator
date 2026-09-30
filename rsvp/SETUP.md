# RSVP Google Sheet

Every invite sends its RSVPs to **one** Google Sheet, owned by the studio's Google account (the business Gmail). Each couple gets their own tab. You set this up **once**; after that, adding a new invite takes one row.

## One-time setup (about 10 minutes)

1. Sign in to Google with the **studio's business account**.
2. Create a new Google Sheet and name it **Rivaah RSVPs**.
3. In the sheet, open **Extensions → Apps Script**.
4. Delete everything in the editor, then paste in all of [`Code.gs`](Code.gs) from this folder. Click **Save** (the disk icon).
5. In the function dropdown at the top, pick **setupSheet**, then click **Run**.
   - Google will ask for permission. Choose the studio account, then **Advanced → Go to … (unsafe) → Allow**.
   - The "unsafe" warning appears because Google hasn't reviewed your own private script. That's expected.
   - An **Invites** tab now appears in the sheet.
6. Click **Deploy → New deployment**.
   - Click the gear icon, then choose **Web app**.
   - Description: `RSVP`
   - Execute as: **Me**
   - Who has access: **Anyone**. Guests aren't signed in to Google, so this is required.
   - Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.
7. Keep that URL somewhere safe. It's the same for every invite, and it goes into each invite's `invite.config.json` as `rsvp.endpoint`.

## For each new invite

1. In the **Invites** tab, add a row:

   | Invite id | Accepting RSVPs (yes/no) | Couple | Notes |
   |---|---|---|---|
   | `priya-arjun` | yes | Priya & Arjun | Wedding 12 Dec 2026 |

   The invite id must match the invite's folder name exactly.
2. Put the web-app URL in the invite's config: `"rsvp": { "endpoint": "https://script.google.com/macros/s/…/exec", … }`
3. Run `npm run verify -- <invite>` after going live. It checks that the sheet accepts this invite.

The couple's tab is created automatically when the first guest replies.

## Sending the list to the couple

Open the couple's tab, then **File → Download → PDF** or **Microsoft Excel**, and send the file on WhatsApp.

To close RSVPs after the deadline, change their row in **Invites** to `no`.

## Changing the script later

Paste the new code, then go to **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.

Don't create a *new* deployment. That gives a different URL, and every live invite would stop saving RSVPs.

## How it works (for developers)

- `rsvp.js` POSTs JSON with `Content-Type: text/plain`. That's a "simple" request, so the browser skips the CORS preflight, which Apps Script can't answer. Apps Script replies with a redirect to `googleusercontent.com`, which serves the JSON with `Access-Control-Allow-Origin: *`.
- The hidden `website` field catches bots.
- Values beginning with `= + - @` are prefixed with `'` so they can't run as spreadsheet formulas.
- A script lock prevents two replies arriving at the same moment from overwriting each other.
- When `rsvp.endpoint` is `"local"`, the preview server stores replies in `<invite>/.rsvp-test.jsonl` instead.
