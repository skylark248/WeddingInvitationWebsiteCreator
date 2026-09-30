# Invite Studio — your handbook

You design the invitation in Figma. Claude turns it into a website that guests open on their phones, and you approve every step. When the couple is happy, it goes live at an address like **priyaarjun.rivaahdesigns.com**.

You never need to write code or type commands. Just talk to Claude in the Claude app, the way you'd brief an assistant.

---

## 1. One-time setup (do this together with your developer friend)

**Accounts** (all with your studio's business email):

- **Claude Pro**, for the Claude desktop app
- **GitHub** (free, optional for now). It will keep an online backup of your work later.
- **Cloudflare** (free). This puts the websites on the internet.
- **Figma**: you already have it. You'll make a free "key" once.

**On your computer (Windows):**

1. Install **Node.js LTS** (nodejs.org), **Git for Windows** (git-scm.com), **Google Chrome**, and the **Claude desktop app**.
2. Your friend downloads the **tool kit** into a folder like `C:\Rivaah\invite-studio`. Open the Claude app → **Code** → choose that folder.
3. Type: **"Set up my computer"**. Claude checks everything and walks you through what's missing: your client-work folder, connecting Figma, and connecting Cloudflare.

**Your work stays private.** The tool kit is shared publicly so it can be improved, but **your couples' details and designs are never part of it**. They're saved in the `invites` folder on your computer, with every step kept, so anything can be undone. Claude always saves there, and safety locks stop anything personal from going anywhere else.

For now that folder exists **only on your computer**. Until your friend sets up an online backup, don't delete it, and keep your computer safe. Adding the backup later keeps all your history.

**Example designs** in the tool kit show simple placeholder pictures instead of real artwork. That's on purpose. If you have the original files, Claude can put them back for you, on your computer only.

---

## 2. Making an invite, start to finish

| Step | You | Say to Claude |
|---|---|---|
| 1 | Send the couple the questions in `docs/couple-questions.md` (Claude can show them to you). | "Show me the questions for the couple" |
| 2 | Design the invite in Figma (see section 3). | — |
| 3 | Start the invite. | "New invite for Priya and Arjun" |
| 4 | Paste the couple's answers. | (paste them) |
| 5 | Give the design: a Figma link, a PDF, or both. | "Here's the Figma link: …" |
| 6 | Claude builds one part at a time and shows you each. Say what to change, or share a screenshot with circles on it. | "Build the next section" / "Make the names bigger" |
| 7 | Look at it yourself, on the computer and on your phone. | "Show me on my phone" |
| 8 | Let Claude check everything. | "Is it ready?" |
| 9 | Send the couple a preview link and the details to check. | "Send a preview to the couple" |
| 10 | Make their corrections. | "Change the Haldi time to 11:30" |
| 11 | When the couple says OK, put it live. Claude guides you through a few clicks in Cloudflare and Hostinger. | "Make it live" |
| 12 | Do the real-phone test (section 5). | "Let's do the phone test" |

Same design for another couple? Say **"New invite, same design as Priya and Arjun"**. Only the details change.

---

## 3. Preparing your Figma design

- Make **one frame per part of the page**, top to bottom. Keep all frames the same width (390 px or 1080 px are both fine).
- **Keep text as real text**, not outlined, so Claude gets the exact words, fonts and sizes.
- **Mark your artwork for export:** select the layer → Export → **+** → PNG, **2x**. Placed pictures are picked up automatically.
- **Add notes** (a "Notes" frame or sticky notes) for anything that moves: *"water falls from the moon"*, *"petals fall when it opens"*, *"tap the seal to open"*.
- **Make a share card:** a **1200 × 630** frame. This is the picture WhatsApp shows with the link.
- **Name your layers** (`moon`, `nandi`, `garland`).
- **Check font licences.** "Personal use" or "Demo" fonts usually can't be used for paid work.
- To give Claude the design:
  - **Figma link:** right-click the page or frame → **Copy link to selection**
  - **PDF:** select the frames → Export → **PDF**

---

## 4. Golden rules

1. **Real details only.** Names and dates always come from the couple's own message. Claude will ask rather than guess.
2. **Nothing reaches the couple without a check,** and nothing goes live without the couple's OK.
3. **Look at it on a real phone.** The screen on your computer isn't enough (see section 5).
4. **One conversation per invite, and start fresh often.** After each finished part, or when Claude seems confused, start a new conversation and type **/continue**. Nothing is lost; your progress is saved.
5. **If Claude tries the same fix twice, say "I'm stuck".** Claude sends a help note to your developer friend.
6. **Never paste passwords or keys into the chat.** When a key is needed, Claude opens Notepad and you paste it there.

---

## 5. The real-phone test (before telling everyone)

Test on **an iPhone and an Android**. Borrow one if needed.

- ☐ Open the link. The opening screen appears and opens when you slide or tap it.
- ☐ Music starts. **Lock the phone**: the music stops. Unlock: it comes back.
- ☐ Scroll the whole page. Nothing is cut off, overlapping or hard to read.
- ☐ Tap the map link. Google Maps opens at the right place.
- ☐ Send a test RSVP. It shows up in the Google Sheet. Then delete your test row.
- ☐ Send the link to yourself on **WhatsApp**. The preview shows the right picture and title.
- ☐ Ask someone older to open it. Can they read everything?

---

## 6. When something goes wrong

| Situation | What to do |
|---|---|
| Didn't like a change | "Undo that" or "Go back to how it was" |
| Claude seems confused or repeats itself | Start a new conversation → **/continue** |
| Same problem twice / it's not working | "I'm stuck". Claude writes a note; WhatsApp your friend the file name. |
| Claude says "usage limit" | That's the Claude Pro limit. Nothing is lost: come back later and type **/continue**. |
| Claude says it's "not allowed" to change something | That's a safety lock on the shared tool kit. Say "I'm stuck" so your friend can do it properly. |
| The couple wants a change after it's live | "Update the live site: …". Same address, no extra steps. |
| Your friend says there's a new version of the tool kit | "Update the tool kit". Your invites aren't affected. |
| Your friend gives you a backup address | "Set up my online backup: <address>". All your saved work is uploaded, privately. |

---

## 7. Words you'll hear

| Web word | In Figma terms |
|---|---|
| Section | A frame |
| CSS / `theme.css` | The design panel: colours, fonts, spacing |
| Flexbox | Auto layout |
| z-index | Layer order |
| Partial / engine part | A component that every invite reuses |
| Config (`invite.config.json`) | The content: names, dates, venues |
| Preview | A private link to show the couple |
| Deploy / publish | Putting the website on the internet |
| Commit | A saved version, like Figma's version history |
| DNS / CNAME | The address-book entry that points priyaarjun.rivaahdesigns.com at the website |

---

## 8. Shortcuts (optional)

You can talk normally, but these shortcuts also work if you type them:

`/setup` · `/start-invite` · `/import-design` · `/build-section` · `/continue` · `/preview` · `/check-invite` · `/publish` · `/undo` · `/stuck` · `/learn`

Curious how something works? Say **"Teach me how the countdown works"** (or anything else). Claude explains it in design terms and can let you try a small change yourself.
