---
name: continue
description: Pick up where the last conversation left off on an invite. Use at the start of a new conversation, or when the person asks "where were we?", "what's next?", or names an invite they were working on.
---

# Continue

1. The session context lists every invite with its progress. If more than one is in progress and it's not clear which they mean, ask.
2. Read `invites/<id>/PROGRESS.md`, and skim the last few saved steps with `git -C invites log --oneline -5 -- <id>`.
3. Tell them in 3–4 short lines:
   - what's done
   - what's next
   - anything waiting on the couple (the "Questions for the couple" list)
4. Ask whether to carry on with the next step. If it's building, start the preview (**preview** skill) and go to **build-section**.
