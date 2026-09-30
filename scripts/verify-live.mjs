// npm run verify -- <invite> [--url https://preview.invite-x.pages.dev/]
// Checks the site as guests see it on the internet: address works, WhatsApp preview is right,
// every file loads, and the RSVP sheet accepts this invite.
import dns from 'node:dns/promises';
import { resolveInvite, parseArgs, run, loadConfig } from './lib/invite.mjs';

run(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const { dir, id } = resolveInvite(positional[0]);
  const config = loadConfig(dir);
  const siteUrl = `https://${config.site.subdomain}.${config.site.domain}/`;
  const url = typeof flags.url === 'string' ? flags.url.replace(/\/?$/, '/') : siteUrl;
  const bad = [];
  const good = [];

  console.log(`\nVerifying ${url}\n`);

  // DNS (only for the real subdomain)
  if (url === siteUrl) {
    const host = new URL(url).hostname;
    try {
      const cname = await dns.resolveCname(host);
      if (cname.some((c) => c.endsWith('.pages.dev'))) good.push(`${host} points to Cloudflare (${cname.join(', ')})`);
      else bad.push(`${host} points to ${cname.join(', ')} instead of the Cloudflare project (*.pages.dev).`);
    } catch {
      try {
        const ips = await dns.resolve4(host);
        bad.push(`${host} points straight to ${ips.join(', ')} (an old A record?) instead of a CNAME to *.pages.dev. Delete that record in Hostinger and add the CNAME.`);
      } catch {
        bad.push(`${host} does not exist yet. Add the CNAME in Hostinger, then wait 5–30 minutes.`);
      }
    }
  }

  // Page
  let html = '';
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (res.ok) {
      html = await res.text();
      good.push(`Page loads (${res.status})`);
    } else bad.push(`The page returned ${res.status}.`);
  } catch (err) {
    bad.push(`Could not open the page: ${err.cause ? err.cause.code || err.cause.message : err.message}`);
  }

  if (html) {
    const og = (p) => (new RegExp(`<meta[^>]+property="og:${p}"[^>]*content="([^"]*)"`, 'i').exec(html) || [])[1];
    if (og('url') === siteUrl) good.push('Share link address is correct');
    else bad.push(`og:url is "${og('url')}", expected ${siteUrl}`);

    const img = og('image');
    try {
      const r = await fetch(img);
      const type = r.headers.get('content-type') || '';
      const size = Number(r.headers.get('content-length') || 0) || (await r.arrayBuffer()).byteLength;
      if (r.ok && type.startsWith('image/')) {
        good.push(`WhatsApp preview image loads (${Math.round(size / 1024)} KB)`);
        if (size > 300 * 1024) bad.push('The preview image is over 300 KB — WhatsApp may not show it.');
      } else bad.push(`The WhatsApp preview image (${img}) returned ${r.status} ${type}.`);
    } catch {
      bad.push(`The WhatsApp preview image (${img}) could not be loaded.`);
    }

    const refs = new Set();
    for (const m of html.matchAll(/\s(?:src|href|data-[a-z-]*src)="([^"]+)"/gi)) {
      if (!/^(https?:|data:|mailto:|tel:|#|\/__)/i.test(m[1])) refs.add(m[1]);
    }
    const failed = [];
    await Promise.all([...refs].map(async (ref) => {
      try {
        const r = await fetch(new URL(ref, url), { method: 'HEAD' });
        if (!r.ok) failed.push(`${ref} (${r.status})`);
      } catch {
        failed.push(ref);
      }
    }));
    if (failed.length) bad.push(`These files did not load: ${failed.join(', ')}`);
    else good.push(`All ${refs.size} linked files load`);
  }

  // RSVP sheet
  const rsvp = config.rsvp || {};
  if (rsvp.enabled !== false) {
    if (!rsvp.endpoint || rsvp.endpoint === 'local') {
      bad.push('RSVP is still in test mode ("local") — guests\' answers would be lost.');
    } else {
      try {
        const r = await fetch(`${rsvp.endpoint}?invite=${encodeURIComponent(config.id)}`, { redirect: 'follow' });
        const data = await r.json();
        if (data.accepting) good.push('RSVP sheet accepts this invite');
        else bad.push(`The RSVP sheet does not accept "${config.id}" yet — add it to the Invites tab with "yes".`);
      } catch {
        bad.push('Could not reach the RSVP sheet web app. Check rsvp.endpoint and that it is deployed for "Anyone".');
      }
    }
  }

  for (const g of good) console.log(`  ✔ ${g}`);
  for (const b of bad) console.log(`  ✖ ${b}`);
  console.log(bad.length ? `\n${bad.length} problem(s) to fix.\n` : `\n✔ "${id}" looks right for guests. Now do the real-phone test (see the handbook).\n`);
  process.exitCode = bad.length ? 1 : 0;
});
