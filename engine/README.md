# Invite engine reference

The engine is the shared, tested part of every invite: opening screen, music, countdown, RSVP, venue link, share preview, reveal animations and optional effects (river, starfield, petals). A **theme** (`invites/<id>/theme/`) decides layout and looks, and includes engine pieces where it wants them.

**Every piece is optional.** A design with no gate, no music, no countdown or no effects simply leaves those parts out. The two examples share nothing visual:

- `examples/shiv-parvati`: night sky, moon, a river through the page, a slide-to-open moon, music.
- `examples/marigold`: cream and maroon, an envelope you tap open, a rose-petal shower, event cards written in the theme, 12-hour times, no music, extra content.

Neither is a starting point for a new design. The designer's frames are.

**Rules**

- Never edit engine files inside an invite (`invites/<id>/engine/`). Each invite has a frozen copy so later engine changes can't break it. If an invite needs something the engine can't do, write it in the theme (`theme.css` / `theme.js`) or override a partial (below). Real engine changes happen in the root `engine/` folder and must pass `npm run test:engine`.
- Content (names, dates, venues, wording) lives in `invite.config.json`, never hard-coded in the theme.

## Page skeleton (`theme/index.njk`)

```njk
{% from "event.njk" import event %}
<!DOCTYPE html>
<html lang="{{ invite.lang or 'en' }}">
<head>
  {% include "head.njk" %}              {# meta, share preview, favicons, engine.css — always first #}
  <link rel="stylesheet" href="theme.css">
</head>
<body>
  {% include "gate.njk" %}              {# slide-to-open overlay (config: gate) #}
  {% include "audio.njk" %}             {# music + floating button (config: music) #}
  <main class="invite">
    … sections …
  </main>
  {% include "scripts.njk" %}           {# engine JS (+ theme.js if it exists) — always last #}
</body>
</html>
```

The page wrapper must be `<main class="invite">`. It's phone-shaped (max 460 px), centred on desktop, and clips sideways overflow.

## Template data

| Name | What it is |
|---|---|
| `invite` | the whole `invite.config.json` |
| `invite.couple[0]`, `invite.couple[1]` | `{ name, lineage: [lines] }` in display order |
| `invite.content.*` | **anything design-specific**: a story, a quote, a hashtag, travel notes, family contacts, gallery captions… any shape. The theme reads it; the TODO check covers it too |
| `events` | config events plus `e.date`, worked out from `start` in the invite's time zone (below) |
| `countdown` | `{ target, title, doneText, units }` |
| `site` | `{ url, shareImageUrl, rsvpEndpoint, gateEnabled, … }` |

`e.date` has every common way to show a date, so each design can lay dates out its own way. For `2026-12-11T20:00:00+05:30`:

| Field | Example | Field | Example |
|---|---|---|---|
| `day` | 11 | `weekday` | Friday |
| `dayOrdinal` | 11th | `weekdayShort` | Fri |
| `month` | December | `time` | 20:00, or 8:00 PM with `"timeFormat": "12h"` |
| `monthShort` | Dec | `long` | Friday, 11 December 2026 |
| `monthNumber` | 12 | `year` | 2026 |

Set `"dateLocale": "hi-IN"` in the config for Hindi month and weekday names (default `en-GB`).

Filters:

- `{{ lines_array | lines }}` joins lines with `<br>`, safely escaped.
- `events | find('mehendi')` gets one event by id. It fails the build if the id doesn't exist.
- `name | first` gets the first letter (for monograms).

Nunjucks is the template language (Jinja-style: `{% for %}`, `{% if %}`, `{% set %}`, macros). A theme may split its page into its own partials (`theme/_hero.njk`, then `{% include "_hero.njk" %}`).

## Partials

| Include | Shows | Config |
|---|---|---|
| `head.njk` | meta tags, WhatsApp/Instagram preview, favicons | `share`, `icon` |
| `gate.njk` | slide-to-open overlay | `gate: { enabled, label, handleImage, logo, title, hint }` |
| `audio.njk` | `<audio>` + play/pause button | `music: { src }` |
| `countdown.njk` | days / hours / mins / secs, then `doneText` once passed | `countdown: { event, title, doneText, labels }` |
| `venue.njk` | venue name, address, map link | `venue: { name, address, mapUrl, linkLabel }` |
| `rsvp.njk` | RSVP form → Google Sheet | `rsvp` (see below) |
| `event.njk` | macro: `{{ event(e) }}` renders date row, name, tagline, divider, venue, attire, note | per-event fields |
| `scripts.njk` | engine JS | — |

To **override** a partial for one invite, put a file with the same name in `theme/` (e.g. `theme/gate.njk`). The theme folder is searched first. The event macro is optional too: a theme can loop over `events` with its own markup (see marigold's event cards).

### The opening screen (gate)

`gate.enabled: false` means there's no opening screen. Otherwise:

- `gate.style: "slide"` (default) shows a drag handle on a track (`handleImage`, `label`, `logo`).
- `gate.style: "tap"` shows one button.
- **Any other design** (envelope, doors, curtain, wax seal, scratch card…) goes in the theme's own `theme/gate.njk`. It must have:
  - `data-gate` on the outer element, and give it the `gate` class to get the full-screen overlay
  - `data-gate-open` on whatever the guest taps (a `<button>`, so it works with the keyboard too)
  - optional timing, in ms: `data-gate-delay="1300"` is how long the opening animation plays before `.is-leaving`; `data-gate-leave="600"` is how long the leaving animation plays before the gate is removed
  - optionally, a `[data-gate-track]` + `[data-gate-handle]` pair to reuse the slider
- The engine adds `.is-opening` straight away and `.is-leaving` after the delay. Animate with those classes in `theme.css`. See `examples/marigold/theme/gate.njk`.
- Opening always happens inside the guest's tap, so music can start. The page can't scroll while the gate is up.

### Classes you can style

- **Gate:** `.gate .gate__content .gate__logo .gate__title .gate__track .gate__fill .gate__label .gate__handle .gate__hint`
- **Audio:** `.audio-btn` (`.is-visible`, `.is-playing`)
- **Countdown:** `.countdown .countdown__title .countdown__digits .countdown__unit .countdown__num .countdown__label .countdown__done` (`.is-done`)
- **Venue:** `.venue .venue__name .venue__address .venue__link`
- **RSVP:** `.rsvp .rsvp__title .rsvp__field .rsvp__label .rsvp__option .rsvp__events .rsvp__submit .rsvp__status` (`.is-error`, `.is-success`)
- **Event:** `.event .event__date .event__month .event__day .event__when .event__title .event__tagline .event__divider .event__venue .event__attire .event__note .event__map`

### CSS variables (set them in `:root` in `theme.css`)

```
--invite-max-width  --invite-bg  --invite-text  --invite-accent  --invite-accent-soft
--invite-font-body  --invite-font-ui
--gate-bg  --gate-accent  --gate-text  --gate-font  --gate-track-bg  --gate-track-width  --gate-handle-size
--audio-btn-bg  --audio-btn-fg
```

Background **images** must be set in `theme.css` with a normal rule, e.g. `.gate { background-image: url('assets/images/sky.jpg'); }`. A `url()` placed inside a CSS variable resolves relative to `engine.css` and breaks.

## Effects (add the markup, the engine does the rest)

**Reveal on scroll.** Add `data-reveal` (fade up) or `data-reveal="zoom"` to any element. When there's a gate, reveals wait until the guest opens it. They're switched off for guests who prefer reduced motion and in `?static` mode.

**River.** A page-tall canvas whose path follows the layout:

```html
<main class="invite">
  <canvas data-river data-river-diya-src="assets/images/lotus-diya.png" data-river-diyas="2" aria-hidden="true"></canvas>
  <div class="moon" data-river-start>…</div>              <!-- water starts at this element's centre -->
  <div class="hero-spacer" data-river-side="center"></div>
  <section data-river-side="left">…</section>              <!-- river runs down the left of this section -->
  <section data-river-side="right">…</section>
  <div class="mountain" data-river-end="0.3">…</div>       <!-- optional: stop 30% down this element -->
</main>
```

Options on the canvas:

- `data-river-width` (84)
- `data-river-left` (0.146 of the page width)
- `data-river-right` (0.854)
- `data-river-transition` (bend length, 260 px)
- `data-river-diyas` (5)
- `data-river-diya-size` (62)
- `data-river-speed` (1)

It sits at `z-index: 10`. Give artwork that should appear *in front of* the water a higher z-index. Put text on the side the river is not on.

**Starfield** (shooting stars). Use `<canvas data-starfield></canvas>` inside a positioned element such as a night-sky hero. It fills that element and pauses while scrolled out of view. Option: `data-starfield-interval="1800"`.

**Petals** shower when the gate opens:

```html
<div data-petals="assets/images/petals/1.png, assets/images/petals/2.png" data-petals-count="28" data-petals-seconds="5"></div>
```

## RSVP config

```json
"rsvp": {
  "enabled": true,
  "endpoint": "local",
  "title": "Will you be joining us?",
  "options": [
    { "value": "yes_all", "label": "Yes, all events!" },
    { "value": "yes_some", "label": "Only some events", "askEvents": true },
    { "value": "no", "label": "Sorry, can't make it", "attending": false }
  ],
  "askGuests": true, "maxGuests": 10, "askEvents": true, "askPhone": false, "askMessage": false,
  "submitLabel": "Send RSVP", "thanks": "…", "errorText": "…"
}
```

- `endpoint: "local"` saves test replies on this computer, in `<invite>/.rsvp-test.jsonl`, while previewing.
- For going live, use the Google Sheet web-app URL (see `rsvp/SETUP.md`).
- An option with `askEvents` shows event checkboxes.
- An option with `"attending": false` hides the guests count.

## JavaScript hooks (for `theme.js`)

- `window.Invite.onOpen(fn)` runs `fn` once the guest has opened the invitation, straight away if already open.
- `window.Invite.isStatic` is true in screenshot mode (`?static`).
- `window.Invite.reducedMotion` is true if the guest's phone asks for less motion.

## URL switches (for previews and screenshots)

- `?static` skips the gate and turns off reveal animations, petals and music. It's used by `npm run screens`.

## When a design needs something the engine doesn't have

Most of what makes each invite unique belongs in the theme:

- **Layout, artwork, animations:** `theme/index.njk` + `theme.css`. CSS animations and `data-reveal` cover most movement.
- **Custom interactions or effects** (parallax, scroll scenes, a scratch-to-reveal date, a photo carousel, Lottie animations): `theme/theme.js`. It can use `window.Invite.onOpen`, and it can load a library from a CDN with a `<script>` tag in `index.njk` (e.g. GSAP, Lottie, Swiper) or from `theme/assets/js/`.
- **Video:** put it in `theme/assets/` and use a normal `<video muted playsinline autoplay loop>`. Keep it short and small.

If the same custom piece turns up in several invites, the maintainer moves it into the engine as a new optional effect, adds it to `npm run test:engine`, and bumps `engine/VERSION`.

## Known quirks

- Playwright's WebKit on **Windows** can draw variable Google Fonts (e.g. Cinzel bold) lighter than a real iPhone does. Confirm on a real phone before changing CSS for it.
