---
name: preview
description: Show the invite as it looks right now — on this computer and on the person's phone over the same Wi-Fi. Use when the person says "show me", "let me see", "open it", "on my phone".
---

# Preview

1. Check whether the preview is already running: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/`. A `200` means it is.
   - If a different invite is running there, tell them you're switching. Stop that background task and start the right one.
2. If it's not running, start it **in the background**: `npm run serve -- <id> --lan`. Wait a few seconds, then read its output for the phone link (`http://192.168.x.x:5173/`).
3. Show it on this computer:
   - In the desktop app's built-in browser pane if available. Load the built-in browser skill first.
   - Otherwise run `start http://127.0.0.1:5173/`.
4. On their phone: give the LAN link and say:
   - *"Your phone must be on the same Wi-Fi as this computer."*
   - *"If Windows asks whether to allow Node.js, choose 'Private networks' and Allow."*
   - *"This link only works at home. For the couple I'll make a proper preview link with /publish."*
5. Tips they may like:
   - Adding `?static` to the address skips the opening screen and animations, which is useful for checking the layout.
   - The page refreshes by itself whenever something changes.
