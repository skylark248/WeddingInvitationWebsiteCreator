// Validating invite.config.json and turning it into the data the templates use.
//
// Issue levels:
//   fatal — the site cannot be built at all
//   error — the site builds, but must not be shown to guests until fixed
//   warn  — worth a look; does not block anything
// Some problems are only errors when going live (mode "live"), e.g. a test RSVP endpoint.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ISO_WITH_OFFSET, isValidTimeZone, offsetAt, offsetOf, dateParts } from './dates.mjs';
import { withPrivateOverride } from './invite.mjs';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DNS_LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const APPS_SCRIPT_URL = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
const MAP_URL = /^https:\/\/(maps\.app\.goo\.gl\/.+|goo\.gl\/maps\/.+|(www\.)?google\.[a-z.]+\/maps\/.+|maps\.google\.[a-z.]+\/.*[?&](q|query|cid)=.+)$/;

const DEFAULT_UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'mins', label: 'Mins' },
  { key: 'secs', label: 'Secs' },
];

export async function validateConfig(config, inviteDir, { mode = 'preview' } = {}) {
  const issues = [];
  const live = mode === 'live';
  const add = (level, where, message, fix) => issues.push({ level, where, message, fix });
  const liveError = live ? 'error' : 'warn';
  const themeDir = path.join(inviteDir, 'theme');
  const fileExists = (rel) => rel && fs.existsSync(path.join(themeDir, rel));

  // Placeholder text left in anywhere
  walkStrings(config, (value, where) => {
    if (/\bTODO\b/i.test(value)) add('error', where, `Still has placeholder text: "${value}"`, 'Replace it with the real detail from the couple.');
  });

  if (!config.id || !SLUG.test(config.id)) {
    add('fatal', 'id', 'The invite id is missing or has capitals/spaces.', 'Use lowercase letters, numbers and dashes, e.g. "priya-arjun".');
  } else if (config.id !== path.basename(inviteDir)) {
    add('warn', 'id', `The id "${config.id}" is different from the folder name "${path.basename(inviteDir)}".`, 'Keep them the same to avoid confusion.');
  }

  const site = config.site || {};
  if (!site.subdomain || !DNS_LABEL.test(site.subdomain)) {
    add('error', 'site.subdomain', 'The subdomain is missing or not valid.', 'Use lowercase letters, numbers and dashes only, e.g. "priyaarjun".');
  }
  if (!site.domain) add('error', 'site.domain', 'The domain is missing.', 'Usually "rivaahdesigns.com".');

  if (!config.timezone || !isValidTimeZone(config.timezone)) {
    add('fatal', 'timezone', 'The time zone is missing or not recognised.', 'Use a name like "Asia/Kolkata".');
  }
  if (config.timeFormat && !['24h', '12h'].includes(config.timeFormat)) {
    add('error', 'timeFormat', 'timeFormat must be "24h" or "12h".');
  }
  if (config.dateLocale && !Intl.DateTimeFormat.supportedLocalesOf([config.dateLocale]).length) {
    add('error', 'dateLocale', `The date language "${config.dateLocale}" is not recognised.`, 'Use e.g. "en-GB" (English) or "hi-IN" (Hindi).');
  }
  if (config.content !== undefined && (typeof config.content !== 'object' || Array.isArray(config.content))) {
    add('fatal', 'content', '"content" must be a group of named items, e.g. { "story": [...], "hashtag": "…" }.');
  }

  const couple = config.couple;
  if (!Array.isArray(couple) || couple.length !== 2 || couple.some((p) => !p || !p.name)) {
    add('fatal', 'couple', 'The couple must be a list of exactly two people, each with a name.');
  }

  const events = Array.isArray(config.events) ? config.events : [];
  if (!events.length) add('fatal', 'events', 'There are no events.', 'Add at least one event with a name and start time.');
  const ids = new Set();
  events.forEach((e, i) => {
    const where = `events[${i}]${e && e.name ? ` (${e.name})` : ''}`;
    if (!e || !e.name) { add('fatal', where, 'An event has no name.'); return; }
    if (!e.id || !SLUG.test(e.id)) add('fatal', where, 'The event needs a short id like "mehendi".');
    else if (ids.has(e.id)) add('fatal', where, `Two events share the id "${e.id}".`);
    else ids.add(e.id);
    if (isPlaceholder(e.start)) {
      // Already reported by the TODO check; the page shows placeholders until it is filled in.
    } else if (!e.start || !ISO_WITH_OFFSET.test(e.start) || Number.isNaN(Date.parse(e.start))) {
      add('fatal', where, `The start time "${e.start}" is not in the right format.`, 'Write it like "2026-12-11T20:00:00+05:30" (date, T, time, then the time-zone offset).');
    } else if (config.timezone && isValidTimeZone(config.timezone)) {
      const expected = offsetAt(new Date(e.start), config.timezone);
      if (offsetOf(e.start) !== expected) {
        add('error', where, `The start time ends in ${offsetOf(e.start)} but ${config.timezone} is ${expected} on that date.`, `Change the end of the time to ${expected}.`);
      }
    }
    if (!e.venue) add('warn', where, 'No venue name for this event.');
    if (e.mapUrl && !MAP_URL.test(e.mapUrl)) add(liveError, where, 'The event map link does not look like a Google Maps link to a place.', 'Open the venue in Google Maps → Share → Copy link.');
  });
  const dated = events.filter((e) => e && hasValidStart(e));
  const sorted = [...dated].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  if (sorted.map((e) => e.id).join() !== dated.map((e) => e.id).join()) {
    add('warn', 'events', 'The events are not in date order.', 'Guests read them top to bottom, so date order is usually clearer.');
  }

  const cd = config.countdown;
  if (cd && cd.event && !ids.has(cd.event)) add('error', 'countdown.event', `The countdown points at "${cd.event}", which is not an event id.`);

  const venue = config.venue;
  if (!venue || !venue.mapUrl) {
    add(liveError, 'venue.mapUrl', 'There is no map link for the venue.', 'Open the venue in Google Maps → Share → Copy link, and paste it into venue.mapUrl.');
  } else if (!MAP_URL.test(venue.mapUrl)) {
    add(liveError, 'venue.mapUrl', `"${venue.mapUrl}" does not look like a Google Maps link to a place.`, 'Open the venue in Google Maps → Share → Copy link.');
  }

  const rsvp = config.rsvp;
  if (rsvp && rsvp.enabled !== false) {
    if (!rsvp.endpoint || rsvp.endpoint === 'local') {
      add(liveError, 'rsvp.endpoint', 'RSVP answers are only being saved on this computer (test mode).', 'Add the invite to the RSVP Google Sheet and paste its web-app URL into rsvp.endpoint (see rsvp/SETUP.md).');
    } else if (!APPS_SCRIPT_URL.test(rsvp.endpoint)) {
      add('error', 'rsvp.endpoint', 'The RSVP address is not a Google Apps Script web-app URL.', 'It should look like https://script.google.com/macros/s/…/exec');
    }
    const opts = Array.isArray(rsvp.options) ? rsvp.options : [];
    if (opts.length < 2 || opts.some((o) => !o.value || !o.label)) {
      add('fatal', 'rsvp.options', 'The RSVP needs at least two answers, each with a value and a label.');
    }
  }

  const share = config.share || {};
  if (!share.title) add('error', 'share.title', 'No title for the WhatsApp/Instagram preview.');
  if (!share.description) add('error', 'share.description', 'No description for the WhatsApp/Instagram preview.');
  if (!share.image) {
    add('error', 'share.image', 'No share image — links sent on WhatsApp will show no picture.', 'Export a 1200×630 JPG from Figma into theme/assets/images/.');
  } else if (!fileExists(share.image)) {
    add('error', 'share.image', `The share image "${share.image}" is not in the theme folder.`);
  } else {
    const file = withPrivateOverride(path.join(themeDir, share.image));
    try {
      const meta = await sharp(file).metadata();
      if (meta.width !== 1200 || meta.height !== 630) {
        add('error', 'share.image', `The share image is ${meta.width}×${meta.height}; it must be exactly 1200×630.`);
      }
      if (!['jpeg', 'png'].includes(meta.format)) add('error', 'share.image', 'The share image must be a JPG or PNG (WhatsApp is unreliable with other formats).');
      const kb = Math.round(fs.statSync(file).size / 1024);
      if (kb > 300) add('warn', 'share.image', `The share image is ${kb} KB; WhatsApp may skip images over ~300 KB.`, 'Export it as JPG at 80% quality.');
    } catch {
      add('error', 'share.image', 'The share image could not be read as a picture.');
    }
  }

  if (config.icon && !fileExists(config.icon)) add('error', 'icon', `The icon "${config.icon}" is not in the theme folder.`);
  if (!config.icon) add('warn', 'icon', 'No icon — the browser tab will show a blank icon.', 'Point "icon" at a square logo PNG.');

  if (config.music && config.music.src) {
    if (!fileExists(config.music.src)) add('error', 'music.src', `The music file "${config.music.src}" is not in the theme folder.`);
    else {
      const mb = fs.statSync(withPrivateOverride(path.join(themeDir, config.music.src))).size / 1048576;
      if (mb > 3) add('warn', 'music.src', `The music file is ${mb.toFixed(1)} MB; guests on mobile data will wait for it.`, 'Use a shorter clip or a 96–128 kbps MP3.');
    }
  }

  const gate = config.gate;
  if (gate && gate.enabled !== false) {
    for (const key of ['handleImage', 'logo']) {
      if (gate[key] && !fileExists(gate[key])) add('error', `gate.${key}`, `"${gate[key]}" is not in the theme folder.`);
    }
  }

  if (!fs.existsSync(path.join(themeDir, 'index.njk'))) {
    add('fatal', 'theme/index.njk', 'The theme has no index.njk page.');
  }

  return issues;
}

/** Data handed to the templates. */
export function buildContext(config, { mode, hasThemeJs, hasIcons }) {
  const tz = config.timezone;
  const events = config.events.map((e) => ({
    ...e,
    date: hasValidStart(e) ? dateParts(e.start, tz, config.timeFormat, config.dateLocale || 'en-GB') : PLACEHOLDER_DATE,
  }));
  const site = config.site || {};
  const url = `https://${site.subdomain}.${site.domain}/`;

  let countdown = null;
  if (!config.countdown || config.countdown.enabled !== false) {
    const cd = config.countdown || {};
    const dated = events.filter(hasValidStart);
    const target = cd.event ? dated.find((e) => e.id === cd.event) : dated[dated.length - 1];
    const labels = cd.labels || {};
    countdown = {
      target: target ? target.start : null,
      title: cd.title || 'Counting down to the big day',
      doneText: cd.doneText || 'The celebrations have begun!',
      units: DEFAULT_UNITS.map((u) => ({ key: u.key, label: labels[u.key] || u.label })),
    };
  }

  const rsvp = config.rsvp || {};
  return {
    invite: config,
    events,
    countdown,
    site: {
      url,
      mode,
      shareImageUrl: config.share && config.share.image ? url + config.share.image : '',
      rsvpEndpoint: !rsvp.endpoint || rsvp.endpoint === 'local' ? '/__rsvp' : rsvp.endpoint,
      gateEnabled: !!(config.gate && config.gate.enabled !== false),
      hasThemeJs,
      hasIcons,
    },
  };
}

const PLACEHOLDER_DATE = {
  day: '00', dayOrdinal: '00th', month: 'Month', monthShort: 'Mon', monthNumber: '00', year: 'Year',
  weekday: 'Day', weekdayShort: 'Day', time: '00:00', long: 'Day, 00 Month Year', iso: '',
};

function isPlaceholder(value) {
  return typeof value === 'string' && /\bTODO\b/i.test(value);
}

function hasValidStart(e) {
  return !!e.start && ISO_WITH_OFFSET.test(e.start) && !Number.isNaN(Date.parse(e.start));
}

function walkStrings(value, fn, where = '') {
  if (typeof value === 'string') fn(value, where || '(top level)');
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, fn, `${where}[${i}]`));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walkStrings(v, fn, where ? `${where}.${k}` : k);
  }
}
