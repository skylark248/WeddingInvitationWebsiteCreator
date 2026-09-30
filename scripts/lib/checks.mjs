// Quality checks on a built invite. Returns issues in the same shape as config validation:
// { level: 'error' | 'warn', where, message, fix }
import fs from 'node:fs';
import path from 'node:path';
import { build, walk, toPosix } from './build.mjs';
import { UserError } from './invite.mjs';

const TEXT_EXT = new Set(['.html', '.css', '.js']);
const IMAGE_EXT = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg']);
const SKIP_UNUSED = new Set(['index.html', 'robots.txt', '_headers', 'favicon-32.png', 'apple-touch-icon.png']);

export function checkDist(distDir, context) {
  const issues = [];
  const add = (level, where, message, fix) => issues.push({ level, where, message, fix });
  const files = [...walk(distDir)];
  const rel = (f) => toPosix(path.relative(distDir, f));
  const icon = context.invite.icon;
  const skipUnused = new Set(SKIP_UNUSED);
  if (icon) {
    skipUnused.add(icon);
    skipUnused.add(icon.replace(/\.(png|jpe?g)$/i, '.webp')); // favicon source — used by the build, not the page
  }
  const indexFile = path.join(distDir, 'index.html');
  const html = fs.readFileSync(indexFile, 'utf8');

  // Addresses that only work on the builder's computer
  for (const f of files) {
    if (!TEXT_EXT.has(path.extname(f))) continue;
    const text = fs.readFileSync(f, 'utf8');
    const m = /(localhost|127\.0\.0\.1)(:\d+)?/.exec(text);
    if (m) add('error', rel(f), `Contains "${m[0]}", an address that only works on this computer.`, 'Use a relative path like assets/images/… or the real https:// address.');
  }

  // Zoom and language
  const viewports = [...html.matchAll(/<meta[^>]+name="viewport"[^>]*content="([^"]*)"/gi)].map((m) => m[1]);
  const viewport = viewports.join(' ');
  if (!viewports.length) add('error', 'index.html', 'The page has no viewport tag, so phones will show it zoomed out.', 'Include "head.njk" in the theme.');
  if (viewports.length > 1) add('error', 'index.html', 'The page has more than one viewport tag.', 'Keep only the one from "head.njk".');
  if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(viewport)) {
    add('error', 'index.html', 'Pinch-to-zoom is switched off — older guests will not be able to enlarge the text.', 'Remove user-scalable=no / maximum-scale=1 from the viewport tag.');
  }
  if (!/<html[^>]+lang="[a-z-]+"/i.test(html)) add('warn', 'index.html', 'The <html> tag has no lang attribute.');

  // Share preview (WhatsApp / Instagram / iMessage)
  const og = (prop) => (new RegExp(`<meta[^>]+property="og:${prop}"[^>]*content="([^"]*)"`, 'i').exec(html) || [])[1];
  if (og('url') !== context.site.url) add('error', 'index.html', `The share link address is "${og('url')}" instead of ${context.site.url}.`, 'Include "head.njk" in the theme and do not add your own og: tags.');
  const ogImage = og('image') || '';
  if (!/^https:\/\//.test(ogImage)) add('error', 'index.html', 'The share image is not a full https:// address, so WhatsApp will not show it.');

  // Every file the page asks for must exist
  const missing = new Set();
  for (const f of files) {
    const ext = path.extname(f);
    if (!TEXT_EXT.has(ext) || f.includes(`${path.sep}engine${path.sep}js`)) continue;
    const text = fs.readFileSync(f, 'utf8');
    const refs = [];
    if (ext === '.html') {
      for (const m of text.matchAll(/\s(?:src|href|data-[a-z-]*src)="([^"]+)"/gi)) refs.push(m[1]);
      for (const m of text.matchAll(/data-petals="([^"]+)"/gi)) refs.push(...m[1].split(',').map((s) => s.trim()));
    }
    for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) refs.push(m[1]);
    for (const ref of refs) {
      if (/^(https?:|data:|mailto:|tel:|#|\/__)/i.test(ref) || ref.includes('{{')) continue;
      const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
      if (!clean) continue;
      const target = clean.startsWith('/') ? path.join(distDir, clean) : path.resolve(path.dirname(f), clean);
      if (!fs.existsSync(target)) missing.add(`${rel(f)} → ${clean}`);
    }
  }
  for (const m of missing) add('error', m.split(' → ')[0], `Points to a file that does not exist: ${m.split(' → ')[1]}`, 'Check the file name and that it is inside theme/assets/.');

  // Images need alt text (alt="" is fine for decoration)
  const noAlt = [...html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/gi)].length;
  if (noAlt) add('warn', 'index.html', `${noAlt} image(s) have no alt text.`, 'Add alt="…" describing the picture, or alt="" if it is only decoration.');

  // Content from the config should actually appear on the page
  const pageText = html.replace(/<[^>]+>/g, ' ');
  for (const person of context.invite.couple || []) {
    if (person.name && !pageText.includes(escapeHtml(person.name))) add('warn', 'index.html', `The name "${person.name}" is not shown anywhere on the page.`);
  }
  for (const e of context.events) {
    if (!pageText.includes(escapeHtml(e.name))) add('warn', 'index.html', `The event "${e.name}" is in the config but not on the page.`);
  }

  // Weight
  let pageBytes = 0;
  const referencedText = files.filter((f) => TEXT_EXT.has(path.extname(f))).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  for (const f of files) {
    const size = fs.statSync(f).size;
    const ext = path.extname(f).toLowerCase();
    const r = rel(f);
    if (!['.mp3', '.m4a', '.ogg', '.wav'].includes(ext)) pageBytes += size;
    if (IMAGE_EXT.has(ext) && size > 400 * 1024) add('warn', r, `This image is ${kb(size)} — slow on mobile data.`, 'Export it smaller, or crop empty space around it.');
    if (['.woff2', '.woff'].includes(ext) && size > 150 * 1024) add('warn', r, `This font file is ${kb(size)}.`);
    if (!skipUnused.has(r) &&!r.startsWith('engine/') && !['.txt'].includes(ext) && !referencedText.includes(r) && !referencedText.includes(path.basename(r))) {
      add('warn', r, 'This file is not used by the page.', 'Delete it from theme/assets/ to keep the site light.');
    }
  }
  if (pageBytes > 3 * 1048576) add('warn', 'dist', `The page is ${(pageBytes / 1048576).toFixed(1)} MB without the music — aim for under 3 MB.`);

  return { issues, pageBytes };
}

function kb(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function printReport(issues, { title, live }) {
  const errors = issues.filter((i) => i.level === 'error' || i.level === 'fatal');
  const warns = issues.filter((i) => i.level === 'warn');
  console.log(`\n${title}\n`);
  if (errors.length) {
    console.log(`✖ Must fix before ${live ? 'going live' : 'sharing'} (${errors.length}):`);
    for (const i of errors) console.log(`  • ${i.where}: ${i.message}${i.fix ? `\n      → ${i.fix}` : ''}`);
    console.log('');
  }
  if (warns.length) {
    console.log(`⚠ Worth a look (${warns.length}):`);
    for (const i of warns) console.log(`  • ${i.where}: ${i.message}${i.fix ? `\n      → ${i.fix}` : ''}`);
    console.log('');
  }
  if (!errors.length) console.log(`✔ Ready to ${live ? 'go live' : 'share as a preview'}.${warns.length ? ' (The notes above are optional.)' : ''}\n`);
  return errors.length === 0;
}

/** Build in the right mode, run config + page checks, print the report. Returns true when nothing blocks. */
export async function runChecks(dir, { live = false } = {}) {
  const mode = live ? 'live' : 'preview';
  const name = path.basename(dir);
  let result;
  try {
    result = await build(dir, { mode, quiet: true });
  } catch (err) {
    if (err instanceof UserError && err.issues) {
      printReport(err.issues, { title: `Checking "${name}" (${mode})`, live });
      return false;
    }
    throw err;
  }
  const { issues, pageBytes } = checkDist(result.distDir, result.context);
  return printReport([...result.issues, ...issues], {
    title: `Checking "${name}" (${mode}) — page weight ${(pageBytes / 1048576).toFixed(1)} MB without music`,
    live,
  });
}
