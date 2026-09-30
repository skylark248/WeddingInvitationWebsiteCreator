// npm run proof -- <invite>
// Writes <invite>/proof.txt: every name, date, time and venue on the invite as plain text,
// ready to paste into WhatsApp so the couple can check spellings before anything goes live.
import fs from 'node:fs';
import path from 'node:path';
import { resolveInvite, parseArgs, run, loadConfig } from './lib/invite.mjs';
import { buildContext } from './lib/config.mjs';

run(async () => {
  const { positional } = parseArgs(process.argv.slice(2));
  const { dir } = resolveInvite(positional[0]);
  const config = loadConfig(dir);
  const { events, countdown, site } = buildContext(config, { mode: 'preview', hasThemeJs: false, hasIcons: false });
  const lines = [];
  const add = (...l) => lines.push(...l);

  add('*Please check every detail below carefully* 🙏',
    'Reply "OK" if everything is right, or send the corrections.', '');

  add('*The couple*');
  for (const p of config.couple) {
    add(`• ${p.name}`);
    for (const l of p.lineage || []) add(`   ${l}`);
  }
  add('');

  if (config.invitation) {
    add('*Invitation wording*');
    for (const l of [...(config.invitation.blessing || []), ...(config.invitation.lines || [])]) add(l);
    add('');
  }

  add('*Events*');
  for (const e of events) {
    add(`• *${e.name}*${e.tagline ? ` — ${e.tagline}` : ''}`,
      `   ${e.date.weekday}, ${e.date.dayOrdinal} ${e.date.month} ${e.date.year} at ${e.date.time}`);
    if (e.venue) add(`   Venue: ${e.venue}`);
    if (e.attire) add(`   Attire: ${e.attire}`);
    if (e.note) add(`   Note: ${e.note}`);
  }
  add('');

  if (config.venue) {
    add('*Venue*', [config.venue.name, config.venue.address].filter(Boolean).join(', '));
    if (config.venue.mapUrl) add(`Map: ${config.venue.mapUrl}`);
    add('');
  }

  if (countdown && countdown.target) {
    const target = events.find((e) => e.start === countdown.target);
    if (target) add(`*Countdown* counts down to: ${target.name}`, '');
  }

  if (config.rsvp && config.rsvp.enabled !== false) {
    add('*RSVP*', config.rsvp.title || '', ...(config.rsvp.options || []).map((o) => `   ○ ${o.label}`), '');
  }

  if (config.closing) {
    add('*Closing*', ...(config.closing.lines || []), config.closing.family || '', '');
  }

  add('*When the link is shared on WhatsApp it will show:*', config.share.title, config.share.description, '');
  add(`Website address: ${site.url}`);

  const text = lines.join('\n');
  fs.writeFileSync(path.join(dir, 'proof.txt'), text + '\n');
  console.log(text);
  console.log(`\n(Saved to ${path.relative(process.cwd(), path.join(dir, 'proof.txt'))})`);
});
