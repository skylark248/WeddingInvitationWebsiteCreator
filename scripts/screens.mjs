// npm run screens -- <invite> [--widths 360,390,430] [--browsers chrome,webkit] [--sections] [--gate]
// Builds the invite and saves phone-sized screenshots to <invite>/.screens/:
//   <browser>-<width>.png            the whole page (gate skipped, animations off)
//   <browser>-<width>-<section>.png  one per data-section, with --sections (compare with the Figma frames)
//   <browser>-390-gate.png           the opening gate, with --gate
// "webkit" is the engine inside iPhone Safari, so it catches most iPhone-only layout problems.
import fs from 'node:fs';
import path from 'node:path';
import { resolveInvite, parseArgs, run, UserError } from './lib/invite.mjs';
import { build } from './lib/build.mjs';
import { startServer } from './lib/server.mjs';

run(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const { dir, id } = resolveInvite(positional[0]);
  const widths = String(flags.widths || '360,390,430').split(',').map(Number).filter(Boolean);
  const browsers = String(flags.browsers || 'chrome,webkit').split(',').map((b) => b.trim());
  const outDir = path.join(dir, '.screens');

  await build(dir, { quiet: true });
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const pw = await import('playwright');
  const srv = await startServer({ inviteDir: dir });
  const saved = [];
  const problems = [];

  try {
    for (const name of browsers) {
      const browser = await launch(pw, name);
      for (const width of widths) {
        const context = await browser.newContext({
          viewport: { width, height: 844 },
          deviceScaleFactor: 2,
          isMobile: name !== 'firefox',
          hasTouch: true,
        });
        const page = await context.newPage();
        page.on('pageerror', (err) => problems.push(`${name} ${width}px: page error — ${err.message}`));
        page.on('requestfailed', (req) => problems.push(`${name} ${width}px: could not load ${req.url().replace(srv.url, '/')}`));
        page.on('response', (res) => { if (res.status() >= 400) problems.push(`${name} ${width}px: ${res.status()} for ${res.url().replace(srv.url, '/')}`); });

        await page.goto(`${srv.url}?static`, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts && document.fonts.ready);
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewportSize({ width, height: Math.min(height, 16000) });
        await page.waitForTimeout(900); // let the river and effects draw

        const file = path.join(outDir, `${name}-${width}.png`);
        await page.screenshot({ path: file, fullPage: true });
        saved.push(file);

        if (flags.sections) {
          const sections = await page.$$('[data-section]');
          for (const el of sections) {
            const label = await el.getAttribute('data-section');
            const sfile = path.join(outDir, `${name}-${width}-${label}.png`);
            await el.screenshot({ path: sfile });
            saved.push(sfile);
          }
        }

        if (flags.gate && width === 390) {
          await page.setViewportSize({ width, height: 844 });
          await page.goto(srv.url, { waitUntil: 'load' });
          await page.waitForTimeout(600);
          const gfile = path.join(outDir, `${name}-390-gate.png`);
          await page.screenshot({ path: gfile });
          saved.push(gfile);
        }
        await context.close();
      }
      await browser.close();
    }
  } finally {
    await srv.close();
  }

  console.log(`\n✔ Saved ${saved.length} screenshots of "${id}":`);
  for (const f of saved) console.log(`  ${path.relative(process.cwd(), f)}`);
  const unique = [...new Set(problems)];
  if (unique.length) {
    console.log('\n⚠ Problems seen while loading the page:');
    for (const p of unique) console.log(`  • ${p}`);
  }
  console.log('');
});

async function launch(pw, name) {
  try {
    if (name === 'chrome') {
      try {
        return await pw.chromium.launch({ channel: 'chrome' });
      } catch {
        return await pw.chromium.launch();
      }
    }
    if (name === 'webkit') return await pw.webkit.launch();
    if (name === 'firefox') return await pw.firefox.launch();
  } catch (err) {
    throw new UserError(`Could not start the ${name} browser. Run:  npx playwright install ${name === 'chrome' ? 'chromium' : name}\n(${err.message.split('\n')[0]})`);
  }
  throw new UserError(`Unknown browser "${name}". Use chrome, webkit or firefox.`);
}
