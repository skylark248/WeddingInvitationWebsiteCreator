---
name: learn
description: Teach the designer how their invitation websites work, in design terms, using their own invite — short lessons with an optional hands-on exercise. Use when the person asks "how does this work?", "teach me", "what is CSS?", "explain what you just did", or wants to try a change themselves.
---

# Learn

The designer wants to understand their websites. They don't want to become a programmer.

1. **Pick a topic.** Ask what they're curious about, or offer three that fit where their current invite is, for example:
   - *How your frames become a web page.* Sections are frames, the config is the content, the theme is the look.
   - *CSS: the design panel of the web.* Colours, fonts, spacing, layer order (z-index), auto layout (flexbox).
   - *How the opening screen, music and countdown work.* The engine parts every invite shares.
   - *How the river knows where to flow*, or any other effect in their invite.
   - *How the site gets onto the internet.* Build → preview link → Cloudflare → the address at Hostinger.
   - *Why the checks exist.* What each one protects guests from.
2. **Teach it in 5–8 short lines.**
   - Use Figma comparisons and point at their own invite.
   - Show a tiny, real excerpt from their `theme.css` or `index.njk` only if it helps, and explain every part of it.
   - No jargon without a one-line explanation.
3. **Offer a hands-on try** (optional), for example changing one colour variable or one font size themselves:
   - Open the file for them with `start notepad invites/<id>/theme/theme.css`.
   - Tell them exactly which line to change and to save.
   - Keep the preview open so they see the page update by itself.
   - Afterwards, check the change is fine, and save it with a commit if they want to keep it. **/undo** reverses it if not.
4. End by asking if they'd like to go deeper or get back to work.
