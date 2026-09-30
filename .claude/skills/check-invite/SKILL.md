---
name: check-invite
description: Check an invite thoroughly before it goes to the couple or goes live — automatic checks, screenshots in two browsers at three phone sizes, a design review and a guest review — and report in plain language. Use when the person asks "is it ready?", "check everything", or before any publish.
---

# Check the invite

1. **Automatic checks:** run `npm run check -- <id>`. If they're about to go live, also run `npm run check -- <id> --live`.
2. **Screenshots:** run `npm run screens -- <id> --sections --gate` (Chrome and WebKit at 360, 390 and 430 px).
3. **Reviews:** start both agents **at the same time**, giving each the invite id:
   - **design-reviewer**: the page compared with the designer's frames.
   - **guest-tester**: the invite as guests experience it, with every detail checked against the couple's details.
4. **Report** in plain words, grouped as:
   - **Must fix before sending**, each with what a guest or the couple would notice
   - **Worth a look**
   - **All good**, a short list, so they know what was checked
5. Offer to fix the must-fix items one at a time. Show each visible change before saving it.
6. Once nothing is left to fix, tick step 5 in `PROGRESS.md`, commit, and suggest **/publish** (preview for the couple).

Honest note for them: the screenshots approximate iPhone and Android, and the real-phone test after going live is still needed.
