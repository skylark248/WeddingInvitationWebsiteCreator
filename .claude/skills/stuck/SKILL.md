---
name: stuck
description: Stop, write a clear help note for the maintainer and send it through GitHub, when something keeps failing, a check can't be satisfied, a command is refused, or the design needs something the tool kit can't do. Use when the same fix has failed twice, or the person says "it's not working", "I'm stuck", "ask for help".
---

# Stuck: ask the maintainer for help

1. **Stop trying fixes.** Tell the person in plain words what's happening and that you're writing a note for the maintainer.
2. **Write** `invites/help-requests/<YYYY-MM-DD>-<invite-id>-<short-topic>.md` (in the private repository, because it may mention client details) with:
   - **What the designer wanted** (1–2 lines)
   - **What happened**: the exact error message or behaviour (short excerpts, not whole logs)
   - **What was tried**: each attempt in one line, with the result
   - **Where**: the invite id, the files involved, and screenshots if relevant (paths in `invites/<id>/.screens/` or `design/frames/`)
   - **State**: the output of `git log --oneline -3` (tool kit) and `git -C invites log --oneline -3`, `cat engine/VERSION`, `node --version`
   - **What would help**: your best guess at the cause, and what the maintainer might need to change (engine, script or check)
3. **Save and send:** `git -C invites add help-requests <id>`, then `git -C invites commit -m "help: <short topic>"`.
   - With an online backup: `git -C invites push`.
   - Local only, or the push fails: the note stays on this computer. Open its folder for them with `start invites/help-requests`, and ask them to send the note file (and a screenshot if useful) to the maintainer on WhatsApp.
4. Tell them:
   - *"I've sent a help note. Send the maintainer a WhatsApp: 'Help request: <file name>'."*
   - What they can keep working on meanwhile (other sections, the couple's details), or that it's fine to wait.
