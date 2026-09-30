---
name: undo
description: Go back to how the invite looked before — undo the last change or an earlier saved step, safely and reversibly. Use when the person says "undo", "go back", "I preferred it before", "that broke it".
---

# Undo

Nothing is ever destroyed. Every undo can itself be undone.

1. **Unsaved changes?** Run `git -C invites status --short <id>`.
   - If there are changes since the last save and they want to drop them, run `git -C invites stash push -m "set aside <date>" -- <id>`.
   - Say: *"I've put those changes aside — I can bring them back if you change your mind."* To bring them back: `git -C invites stash pop`.
2. **An earlier saved step?** Run `git -C invites log --oneline -10 -- <id>` and show the list in plain words, e.g. *"1. Events section built (today 3:40pm) · 2. Hero built (today 2:15pm)"*.
   - Ask which to undo. The default is the most recent.
   - Run `git -C invites revert --no-edit <commit>`. This adds a new saved step that reverses it.
   - If the revert reports a conflict, run `git -C invites revert --abort` and use **/stuck**. Don't try to resolve it.
3. Let the preview refresh and show them the result.
4. Update `PROGRESS.md` if a step is no longer done.

Never use `git reset --hard`, `git checkout -- …`, force-push or history rewriting. The hooks block them anyway.
