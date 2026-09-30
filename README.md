# Invite Studio

### Make wedding invitation websites from your own designs — no coding needed

You design the invitation in **Figma**. **Claude** (an AI assistant) turns it into a website that guests open on their phones. You check every step and ask for changes in plain words. When the couple is happy, the invitation goes live at its own address, like **priyaarjun.rivaahdesigns.com**.

This guide takes you from an empty computer to your first live invitation, one small step at a time. You never write code, and you never need to understand it.

> 🔖 **Bookmark this page.** It's your guide whenever you need it.

> **What you need**
> - A **Windows** computer and internet
> - A **Claude Pro** subscription (claude.ai, paid monthly)
> - **Figma** (the free plan is fine)
> - Your **Hostinger** login (where rivaahdesigns.com is managed)
> - About **1 hour** for the first-time setup. After that, each invitation takes as long as the design needs.
>
> Everything else used here is **free**.

---

## Contents

1. [Install the apps](#part-1--install-the-apps-one-time-about-30-minutes) *(once)*
2. [Get Invite Studio onto your computer](#part-2--get-invite-studio-onto-your-computer-once-about-5-minutes) *(once)*
3. [Let Claude set everything up](#part-3--let-claude-set-everything-up-once-about-15-minutes) *(once)*
4. [See it working](#part-4--see-it-working-5-minutes)
5. [Prepare your design](#part-5--prepare-your-design)
6. [Make your first invitation](#part-6--make-your-first-invitation)
7. [Put it on the internet](#part-7--put-it-on-the-internet)
8. [Everyday use and help](#part-8--everyday-use-and-help)

---

## Part 1 — Install the apps *(one time, about 30 minutes)*

Install these four apps in this order. For each one you'll download a file, open it and click through. When Windows asks *"Do you want to allow this app to make changes to your device?"*, click **Yes**.

### 1.1 The Claude app

1. Go to **[claude.ai/download](https://claude.ai/download)** and click **Download for Windows**.
2. Open the downloaded file. The app installs by itself.
3. Sign in with your Claude account. You need the **Pro** plan: if you don't have it yet, go to claude.ai → your name → **Upgrade**.

✅ **Done when** the Claude app opens and shows your name.

### 1.2 Node.js (runs the website tools in the background)

1. Go to **[nodejs.org](https://nodejs.org)** and click the big **Download Node.js (LTS)** button.
2. Open the downloaded file and click **Next** on each screen, then **Install**, then **Finish**.
   - Tick *"I accept"* when it shows the licence.
   - If you see a box about *"Automatically install the necessary tools"*, **leave it empty**.

### 1.3 Git (keeps a history of every change, so anything can be undone)

1. Go to **[git-scm.com/download/win](https://git-scm.com/download/win)** and click **Click here to download**.
2. Open the file. The installer shows **many** screens. **Don't change anything**: just keep clicking **Next**, then **Install**, then **Finish**.

### 1.4 Google Chrome

If you don't already have it: **[google.com/chrome](https://www.google.com/chrome)**, then download and open the file.

### 1.5 Restart your computer

This makes sure everything you installed is ready to use.

✅ **Part 1 is done.**

---

## Part 2 — Get Invite Studio onto your computer *(once, about 5 minutes)*

> **Why this step is needed:** Invite Studio lives on GitHub, the website you may be reading this on. It only works once it's **copied onto your computer with Git**. That copying is called **cloning**. Claude does it for you in step 2.3.
>
> ⚠️ **Don't use GitHub's green "Code → Download ZIP" button.** A ZIP copy can't receive updates, and parts of the setup won't work. Always follow step 2.3.

### 2.1 Make a folder for it

1. Open **File Explorer** (the yellow folder icon), then click **This PC** → **Local Disk (C:)**.
2. Right-click an empty area → **New** → **Folder**, and name it **`Rivaah`**.
   Use exactly this name, with **no spaces**.

### 2.2 Open Claude in "Code" mode on that folder

1. Open the Claude app and click **Code** (in the menu on the left).
   If you don't see it, update the app from its menu (**Check for updates**) and restart it.
2. When it asks for a folder, choose **`C:\Rivaah`**.
3. If it asks whether you **trust** this folder, say **yes**.

### 2.3 Ask Claude to clone (download) Invite Studio

Type this message and press Enter:

> Clone the Invite Studio tool kit with git from https://github.com/skylark248/WeddingInvitationWebsiteCreator into a folder called invite-studio here.

Claude will ask permission to run a command. Click **Allow**. After a minute you'll have the folder **`C:\Rivaah\invite-studio`**.

<details>
<summary>If Claude can't do it, do it yourself instead (one line)</summary>

1. Click **Start** and type **PowerShell**, then open **Windows PowerShell**.
2. Paste this line (right-click pastes) and press Enter:

   ```
   git clone https://github.com/skylark248/WeddingInvitationWebsiteCreator.git C:\Rivaah\invite-studio
   ```
3. Close the window when it finishes.

</details>

### 2.4 Open Invite Studio itself

This step matters: Claude only learns how Invite Studio works when **this exact folder** is open.

1. In the Claude app's **Code** area, start a **new session**.
2. Choose the folder **`C:\Rivaah\invite-studio`**. Trust it if asked.
3. To check, ask:

   > What can you help me with here?

✅ **Done when** Claude talks about wedding invitations: starting a new invite, previewing, publishing.

> **About "Allow" requests:** while working, Claude sometimes asks permission to run something. For Invite Studio tasks it's safe to click **Allow**. If it offers *"always allow for this project"*, that's fine too. Anything risky is blocked by built-in safety locks anyway. If a request looks strange, click **Deny** and ask Claude what it wanted to do.

---

## Part 3 — Let Claude set everything up *(once, about 15 minutes)*

In the Invite Studio session, type:

> Set up my computer

Claude goes through a checklist with you and explains each item. Here's what to expect:

| Claude will… | What you do |
|---|---|
| Install the website tools (a few minutes; they download once) | Click **Allow** if asked, then wait |
| Install a test browser that behaves like an iPhone | Wait |
| Ask your name and email, which label your saved work | Type them |
| Create your private **`invites`** folder, where all your couples' work is kept | Nothing |
| Connect **Figma**, so you can simply share Figma links | Copy a key from Figma and paste it **into the Notepad window Claude opens**, never into the chat. Claude shows you where to click in Figma. |
| Connect **Cloudflare** (for publishing) | This can wait until [Part 7](#part-7--put-it-on-the-internet) |

✅ **Done when** Claude says everything is ready.

> 🔒 **Your work stays private.** Invite Studio itself is shared publicly on the internet, but **your couples' names, family details and designs are never part of it**. They live only in `C:\Rivaah\invite-studio\invites` on your computer. Safety locks stop Claude from putting anything personal anywhere else.
>
> For now there's **no online backup** of that folder: **don't delete it**, and keep your computer safe. Your friend can add a private online backup later, and all your history is kept.

---

## Part 4 — See it working *(5 minutes)*

Before making your own, look at the two sample invitations. Say:

> Show me the Marigold example

The sample invitation opens, either in a panel inside the Claude app or in your browser. **Tap the wax seal** to open it, then scroll through.

Then try:

> Show me the Shiv–Parvati example

This one shows **plain placeholder pictures on purpose**, because the real artwork isn't shared publicly. If you have the original website files on your computer, say *"Restore the real example files from D:\Wedding Site"* (use wherever your files are) to see it with the real artwork. That stays on your computer only.

**On your phone:** say

> Show me on my phone

Claude gives you a link like `http://192.168.1.5:5173`.

- Open it on your phone. The phone must be on the **same Wi-Fi** as the computer.
- If Windows asks whether to allow **Node.js**, tick **Private networks** and click **Allow**.

> ⚠️ This link is **only for you**. It works only on your Wi-Fi, and only while your computer is on and Claude is open. **Don't send it to couples.** They get a proper link in [Part 7](#part-7--put-it-on-the-internet).

This is how you'll look at every invitation while you make it. The page **updates by itself** whenever something changes.

✅ **Done when** you've opened the Marigold invitation on your computer and on your phone.

---

## Part 5 — Prepare your design

### 5.1 Get the couple's details

Say:

> Show me the questions for the couple

Copy the message and send it to the couple on WhatsApp, or make a Google Form with the same questions. Claude only ever uses names and dates **exactly as the couple wrote them**, so ask them to type carefully.

### 5.2 Design in Figma, the way that works best

- Make **one frame per part of the page**, top to bottom: opening screen, main picture, invitation, events, RSVP, closing. Keep all frames the **same width** (390 px or 1080 px are both fine).
- **Keep text as real text**, not outlined, so Claude reads the exact words, fonts and sizes.
- **Mark your artwork for export:** select the layer → **Export** (right panel) → **+** → **PNG** at **2x**. Pictures you placed into Figma are picked up automatically.
- **Write notes** (a "Notes" frame or sticky notes) for anything that moves or needs explaining, e.g. *"water falls from the moon"*, *"petals fall when it opens"*, *"tap the seal to open"*.
- **Make a share card:** a **1200 × 630** frame. This is the picture WhatsApp shows when the link is shared.
- **Name your layers** (`moon`, `nandi`, `garland`). It helps Claude, and you.
- **Check font licences.** Fonts labelled *"Personal use"* or *"Demo"* usually can't be used for paid work.

### 5.3 Two ways to give Claude the design (both together is best)

- **Figma link:** right-click the page or frame → **Copy link to selection**, then paste it into the chat.
- **PDF:** select all the website frames → **Export** → **PDF** → **Export**. Then tell Claude where you saved it (usually **Downloads**). Claude finds it.

---

## Part 6 — Make your first invitation

Start with:

> New invite for Priya and Arjun

(use your couple's names). Then just follow along. Claude asks for one thing at a time.

| Step | What happens | You say, for example |
|---|---|---|
| 1 | Claude suggests a web address, like `priyaarjun.rivaahdesigns.com` | "Yes, that's good" |
| 2 | You give the couple's details | *(paste their answers)* |
| 3 | You give the design | "Here's the Figma link: …" / "The PDF is in my Downloads" |
| 4 | Claude tells you what it found (frames, fonts, artwork) and asks about anything unclear | Answer its questions |
| 5 | Claude builds **one part at a time** and shows it to you | "Looks right" / "Make the names bigger" / "Move the moon up a little" |
| 6 | Repeat for each part | "Build the next section" |
| 7 | Look at it on your phone | "Show me on my phone" |
| 8 | Claude checks everything thoroughly (phone sizes, spelling against the couple's details, readability) | "Is it ready?" |

**Tips**

- You can **send a screenshot** with circles or arrows drawn on it. Claude understands pictures.
- Changed your mind? **"Undo that"** goes back safely.
- After finishing a few parts, start a **new session** and say **"Where were we?"** Claude remembers exactly where you stopped.
- Working on **several couples**? Say which one: *"Let's continue Priya and Arjun"*.
- Same design for another couple? Say **"New invite, same design as Priya and Arjun"**.

✅ **Done when** Claude says the invitation is ready to send to the couple.

---

## Part 7 — Put it on the internet

### 7.1 Make a free Cloudflare account *(once)*

Cloudflare is the free service that puts your invitations on the internet.

1. Go to **[dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)** and sign up with your studio email. Confirm the email they send you.
2. In Claude, say **"Connect Cloudflare"**. A browser window opens. Click **Allow**, then go back to Claude.

### 7.2 Send a private preview to the couple

> Send a preview to the couple

Claude gives you:

- a **preview link**: it isn't listed anywhere, so only people you send it to will see it
- a **proof text** listing every name, date, time and venue

Send **both** on WhatsApp and ask the couple to reply **OK** or send corrections. For corrections, just tell Claude (*"Change the Haldi time to 11:30"*) and send a fresh preview.

### 7.3 Set up the RSVP sheet *(once, about 10 minutes)*

Guests' RSVPs go into a **Google Sheet** in your business Google account, with one tab per couple. The first time you go live, Claude walks you through creating it, click by click. After that, each new couple is just one line in the sheet.

To send the list to a couple, open their tab → **File → Download → PDF** (or Excel), then send it on WhatsApp.

### 7.4 Go live on your own address

When the couple says OK:

> Make it live

Claude uploads the website, then guides you through **two short sets of clicks** (it tells you the exact words to type):

**In Cloudflare:** open your project → **Custom domains** → **Set up a custom domain** → type the address (e.g. `priyaarjun.rivaahdesigns.com`) → **Continue**. Then follow what the screen says; Claude helps if the buttons look different.

**In Hostinger:**

1. Go to **[hpanel.hostinger.com](https://hpanel.hostinger.com)** → **Domains** → **rivaahdesigns.com** → **DNS / Nameservers**.
2. Add **one record**:

   | Type | Name | Points to |
   |---|---|---|
   | **CNAME** | `priyaarjun` | `invite-priya-arjun.pages.dev` |

   These are only examples. **Copy the exact values Claude gives you.** Cloudflare sometimes adds a few letters to the "Points to" address.
3. Leave the other settings as they are and click **Add record**.

> ⚠️ **Don't change or delete any other records** in Hostinger. They run your main website and email. Claude tells you if one specific record ever needs removing.

Then **wait 5–30 minutes** (the internet needs time to learn the new address) and ask:

> Is my site live?

### 7.5 Test on real phones *(before telling everyone)*

Check on **an iPhone and an Android**. Borrow one if needed.

- ☐ Open the link. The opening screen appears and opens when you slide or tap it.
- ☐ The music starts. **Lock the phone**: the music stops. Unlock: it comes back.
- ☐ Scroll the whole page. Nothing is cut off, overlapping or hard to read.
- ☐ Tap the map link. Google Maps opens at the right place.
- ☐ Send a test RSVP. It appears in the Google Sheet (then delete your test row).
- ☐ Send the link to yourself on **WhatsApp**. The preview shows the right picture and title.
- ☐ Ask someone older to read it. Can they read everything easily?

🎉 **Your invitation is live.** Share the link with the couple.

**Changes after it's live?** Say *"Update the live site: …"*. The address stays the same. (WhatsApp may show the old preview picture for a while; that's normal.)

---

## Part 8 — Everyday use and help

### Starting a work session

Open the Claude app → **Code** → folder **`C:\Rivaah\invite-studio`**, and say **"Where were we?"**

You can **close the Claude app any time**. Your work is saved after every step you approve.

### Things you can say

You can talk normally. These all work:

| To… | Say | Shortcut |
|---|---|---|
| Start a new invitation | "New invite for …" | `/start-invite` |
| Give or update the design | "Here's the Figma link / PDF" / "I changed the design" | `/import-design` |
| Build the next part | "Build the next section" | `/build-section` |
| Pick up where you left off | "Where were we?" | `/continue` |
| See it | "Show me" / "Show me on my phone" | `/preview` |
| Check everything | "Is it ready?" | `/check-invite` |
| Preview, go live, update | "Send a preview to the couple" / "Make it live" | `/publish` |
| Undo | "Undo that" / "Go back to how it was" | `/undo` |
| Get help | "I'm stuck" | `/stuck` |
| Learn how something works | "Teach me how the countdown works" | `/learn` |
| Fix your setup or get updates | "Set up my computer" / "Update the tool kit" | `/setup` |

### Golden rules

1. **Real details only.** Names and dates always come from the couple's own message. Claude asks rather than guesses.
2. **Nothing reaches the couple without a check,** and nothing goes live without the couple's OK.
3. **Always test on a real phone** before telling everyone.
4. **Start fresh sessions often.** After each finished part, or when Claude seems confused, start a new session and say "Where were we?" Nothing is lost.
5. **If Claude tries the same fix twice, say "I'm stuck".**
6. **Never paste passwords or keys into the chat.** When a key is needed, Claude opens Notepad for you.
7. **Don't delete or move the `invites` folder.** It's all your work.

### When something goes wrong

| What you see | What to do |
|---|---|
| You don't like a change | "Undo that" |
| Claude seems confused or repeats itself | Start a new session → "Where were we?" |
| Something keeps failing | "I'm stuck". Claude writes a note; send it to your friend on WhatsApp. |
| Claude mentions a **usage limit** | That's the Claude Pro limit. Nothing is lost: come back later and say "Where were we?" |
| Claude says it's **not allowed** to change something | A safety lock protects the shared tool kit. Say "I'm stuck" so your friend can do it properly. |
| "npm is not recognized" or "node is not recognized" | Node.js isn't installed, or the computer wasn't restarted. Redo [1.2](#12-nodejs-runs-the-website-tools-in-the-background) and [1.5](#15-restart-your-computer). |
| "git is not recognized" | Git isn't installed, or the computer wasn't restarted. Redo [1.3](#13-git-keeps-a-history-of-every-change-so-anything-can-be-undone) and [1.5](#15-restart-your-computer). |
| Claude says the tool kit was **downloaded as a ZIP** | Delete that folder and do [Part 2](#part-2--get-invite-studio-onto-your-computer-once-about-5-minutes) again (clone it). Move any `invites` folder you already made into the new copy. |
| Your phone can't open the preview link | Same Wi-Fi as the computer? Allow **Node.js** in the Windows firewall message (Private networks). |
| The live address doesn't open yet | Wait up to 30 minutes after adding the Hostinger record, then ask "Is my site live?" |
| Your friend says there's a new version | "Update the tool kit". Your invitations aren't affected. |
| Your friend gives you a backup address | "Set up my online backup: <address>". Your work is copied there privately, with all its history. |

### Where your things are

| Folder in `C:\Rivaah\invite-studio` | What it is |
|---|---|
| **`invites`** | **All your work.** One folder per couple. Private. Don't delete. |
| `examples` | The two sample invitations |
| `docs` | The questions for couples |
| everything else | The tool kit itself. Leave it to Claude. |

### Words you'll hear

| Word | Meaning, in Figma terms where possible |
|---|---|
| Session | One conversation with Claude. Starting a new one never loses work. |
| Tool kit | Invite Studio itself: the part everyone shares, not your work |
| Clone | Copying the tool kit onto your computer with Git (Part 2) |
| Placeholder | A plain stand-in picture where real artwork isn't shared |
| Section | A frame |
| CSS | The design panel: colours, fonts, spacing |
| Flexbox | Auto layout |
| z-index | Layer order |
| Partial / engine part | A component every invite reuses |
| Config | The content: names, dates, venues |
| Preview | A private link to show the couple |
| Deploy / publish | Putting the website on the internet |
| Commit / save | A saved version, like Figma's version history |
| DNS / CNAME | The address-book entry that points your address at the website |

### What it costs

- **Claude Pro:** your monthly subscription. It has a usage limit; if you reach it, wait and continue later. If you hit the limit often, the bigger **Max** plan gives more room.
- **Cloudflare, Git, Node.js, Chrome:** free.
- **Figma:** the free plan works. Figma limits how often free accounts can share designs with apps. If Claude says the limit is reached, export a PDF instead.
- **Hostinger:** your existing plan. Nothing changes there except one address record per invitation.

---

<sub>For the developer who maintains Invite Studio: see [docs/DEVELOPER.md](docs/DEVELOPER.md).</sub>
