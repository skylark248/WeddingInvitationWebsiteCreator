// Builds one invite into <invite>/dist:
//   1. checks the config (stops only on "fatal" problems)
//   2. renders theme/index.njk with the engine partials
//   3. copies engine CSS/JS
//   4. optimises theme assets: PNG/JPG → WebP (max 1600px wide), TTF/OTF → WOFF2
//      and rewrites references to the new file names
//   5. makes favicons from config.icon

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import nunjucks from 'nunjucks';
import sharp from 'sharp';
import { loadConfig, engineDirFor, withPrivateOverride, UserError } from './invite.mjs';
import { validateConfig, buildContext } from './config.mjs';

const IMAGE_MAX_WIDTH = 1600;
const WEBP = { quality: 80, alphaQuality: 90, effort: 4 };
const CACHE_VERSION = 'v1';
const TEXT_EXT = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt']);

export async function build(inviteDir, { mode = 'preview', quiet = false } = {}) {
  const started = Date.now();
  const config = loadConfig(inviteDir);
  const issues = await validateConfig(config, inviteDir, { mode });
  const fatal = issues.filter((i) => i.level === 'fatal');
  if (fatal.length) {
    const err = new UserError(`The invite can't be built yet:\n${fatal.map((i) => `  • ${i.where}: ${i.message}${i.fix ? `\n    → ${i.fix}` : ''}`).join('\n')}`);
    err.issues = issues;
    throw err;
  }

  const themeDir = path.join(inviteDir, 'theme');
  const engineDir = engineDirFor(inviteDir);
  const distDir = path.join(inviteDir, 'dist');
  const cacheDir = path.join(inviteDir, '.cache', 'assets');
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(cacheDir, { recursive: true });

  // Engine files
  copyFile(path.join(engineDir, 'css', 'engine.css'), path.join(distDir, 'engine', 'engine.css'));
  for (const f of fs.readdirSync(path.join(engineDir, 'js'))) {
    if (f.endsWith('.js')) copyFile(path.join(engineDir, 'js', f), path.join(distDir, 'engine', 'js', f));
  }

  // Theme root files (theme.css, theme.js, …) — templates are rendered separately
  let privateCount = 0;
  const source = (file) => {
    const real = withPrivateOverride(file);
    if (real !== file) privateCount++;
    return real;
  };
  for (const f of fs.readdirSync(themeDir)) {
    const file = path.join(themeDir, f);
    if (fs.statSync(file).isFile() && !f.endsWith('.njk')) copyFile(source(file), path.join(distDir, f));
  }

  // Assets
  const renames = new Map(); // "assets/images/moon.png" -> "assets/images/moon.webp"
  const keepAsIs = new Set([config.share && config.share.image].filter(Boolean).map(toPosix));
  const assetsDir = path.join(themeDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    for (const file of walk(assetsDir)) {
      const rel = toPosix(path.relative(themeDir, file));
      const src = source(file);
      const ext = path.extname(src).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext) && !keepAsIs.has(rel)) {
        const out = rel.slice(0, -ext.length) + '.webp';
        await cached(src, cacheDir, 'webp', () => toWebp(src), path.join(distDir, out));
        renames.set(rel, out);
      } else if (['.ttf', '.otf'].includes(ext)) {
        const out = rel.slice(0, -ext.length) + '.woff2';
        await cached(src, cacheDir, 'woff2', () => toWoff2(src), path.join(distDir, out));
        renames.set(rel, out);
      } else {
        copyFile(src, path.join(distDir, rel));
      }
    }
  }

  // Favicons
  let hasIcons = false;
  if (config.icon && fs.existsSync(path.join(themeDir, config.icon))) {
    const icon = withPrivateOverride(path.join(themeDir, config.icon));
    const bg = (config.share && config.share.themeColor) || '#0A0D18';
    await sharp(icon).resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(distDir, 'favicon-32.png'));
    await sharp(icon).resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 20, bottom: 20, left: 20, right: 20, background: bg }).flatten({ background: bg })
      .png().toFile(path.join(distDir, 'apple-touch-icon.png'));
    hasIcons = true;
  }

  // Page
  const context = buildContext(config, { mode, hasThemeJs: fs.existsSync(path.join(themeDir, 'theme.js')), hasIcons });
  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader([themeDir, path.join(engineDir, 'partials')], { noCache: true }),
    { autoescape: true, trimBlocks: true, lstripBlocks: true },
  );
  env.addFilter('lines', (list) => new nunjucks.runtime.SafeString(
    (Array.isArray(list) ? list : [list]).filter((l) => l != null).map((l) => nunjucks.lib.escape(String(l))).join('<br>'),
  ));
  env.addFilter('find', (list, id) => {
    const found = (list || []).find((x) => x && x.id === id);
    if (!found) throw new UserError(`The theme asks for an event with id "${id}", but there is no such event in the config.`);
    return found;
  });
  let html;
  try {
    html = env.render('index.njk', context);
  } catch (err) {
    if (err instanceof UserError) throw err;
    throw new UserError(`The page template has a problem:\n${err.message}`);
  }
  fs.writeFileSync(path.join(distDir, 'index.html'), html);

  // Point references at the optimised files
  if (renames.size) {
    for (const file of walk(distDir)) {
      if (!TEXT_EXT.has(path.extname(file).toLowerCase()) || file.includes(`${path.sep}engine${path.sep}`)) continue;
      let text = fs.readFileSync(file, 'utf8');
      let changed = false;
      for (const [from, to] of renames) {
        if (text.includes(from)) {
          text = text.split(from).join(to);
          changed = true;
        }
      }
      if (changed) fs.writeFileSync(file, text);
    }
  }

  fs.writeFileSync(path.join(distDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  fs.writeFileSync(path.join(distDir, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  Referrer-Policy: strict-origin-when-cross-origin\n');

  if (!quiet) {
    const note = privateCount ? ` (using ${privateCount} real file(s) from private/ instead of placeholders)` : '';
    console.log(`✔ Built ${path.basename(inviteDir)} in ${((Date.now() - started) / 1000).toFixed(1)}s → ${path.relative(process.cwd(), distDir) || distDir}${note}`);
  }
  return { distDir, config, issues, context };
}

async function toWebp(src) {
  const img = sharp(src);
  const meta = await img.metadata();
  return img.resize({ width: Math.min(meta.width || IMAGE_MAX_WIDTH, IMAGE_MAX_WIDTH), withoutEnlargement: true }).webp(WEBP).toBuffer();
}

async function toWoff2(src) {
  const { default: wawoff } = await import('wawoff2');
  return Buffer.from(await wawoff.compress(fs.readFileSync(src)));
}

async function cached(src, cacheDir, ext, make, dest) {
  const stat = fs.statSync(src);
  const key = crypto.createHash('sha1').update(`${CACHE_VERSION}|${src}|${stat.size}|${stat.mtimeMs}`).digest('hex');
  const cacheFile = path.join(cacheDir, `${key}.${ext}`);
  if (!fs.existsSync(cacheFile)) fs.writeFileSync(cacheFile, await make());
  copyFile(cacheFile, dest);
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

export function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

export function toPosix(p) {
  return p.split(path.sep).join('/');
}
