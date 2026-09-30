---
name: start-invite
description: Start a new wedding invitation website — for a new couple and design, or reusing an existing design for another couple. Use when the person says "new couple", "new invite", "new order", "I have a new design", or "same design for another couple".
---

# Start a new invite

Go step by step, one question at a time.

0. **Client-work folder first.** If the session context says `invites/` isn't set up, do "Client work: history and backup" in the **setup** skill before anything else. Local-only is fine. Client work goes to the private `invites/` repository, never the public tool kit.

1. **Name the invite.** Ask for the couple's first names. Suggest a folder name like `priya-arjun`, and the web address `https://priyaarjun.rivaahdesigns.com`. Ask if the address is OK or if they want another. Only lowercase letters, numbers and dashes are allowed; explain that briefly if needed.

2. **New design or reuse?** Ask: *"Is this a new design, or the same design as an earlier invite for a different couple?"* If reusing, list the designs in `invites/` and `examples/`.
   - New design: `npm run new -- <id>`
   - Reuse: `npm run new -- <id> --from <design>`. The artwork and layout come across; only the content changes.

3. **Set the subdomain.** If the address they chose differs from the default, set `site.subdomain` in `invites/<id>/invite.config.json`.

4. **The couple's details.** Ask them to paste the couple's answers: from the details form, WhatsApp, or typed out.
   - Save them **word for word** in `invites/<id>/design/couple-details.md`, with today's date at the top.
   - If they don't have the details yet, give them the questions from `docs/couple-questions.md` to send to the couple, and continue with the design meanwhile.

5. **Fill in `invite.config.json`** from the couple's details only:
   - Names and family lines exactly as written. Keep their spelling, capitals and punctuation.
   - Events: `start` in the form `2026-12-11T20:00:00+05:30`. Indian time is `+05:30`. If the wedding is abroad, ask for the country and set `timezone` to match.
   - Venue name, address, and the **Google Maps share link**. If there isn't one, ask them to open the venue in Google Maps → Share → Copy link.
   - RSVP question and deadline, closing family name.
   - Draft `share.title` and `share.description` (what WhatsApp shows under the link) and ask them to approve the wording.
   - Anything unknown stays as `TODO: …`. Never guess.

6. **Design.** Continue with **/import-design**, unless they reused a design, in which case skip to step 7.

7. **Save.** Tick the finished steps in `invites/<id>/PROGRESS.md` and write the "Next step:" line. Then run `git -C invites add <id>` and `git -C invites commit -m "<id>: started"`.

8. Tell them what's next in one line. It's usually building the first section (**/build-section**). For a reused design, it's checking the preview (**/preview**).
