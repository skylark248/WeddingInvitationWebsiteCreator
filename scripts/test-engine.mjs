// npm run test:engine [-- <invite>]   (default: every example in examples/)
// Drives real invites in Chrome and WebKit like a guest would: open the gate (slider or tap),
// music button, petals, countdown, RSVP form (against the local test endpoint), screenshot mode,
// and the river — each only if that invite uses it.
// Run it after every engine change, before copying the engine into new invites.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, CONFIG_FILE, resolveInvite, parseArgs, run, UserError } from './lib/invite.mjs';
import { build } from './lib/build.mjs';
import { startServer } from './lib/server.mjs';

run(async () => {
  const { positional } = parseArgs(process.argv.slice(2));
  const targets = positional[0]
    ? [resolveInvite(positional[0])]
    : fs.readdirSync(path.join(ROOT, 'examples'))
      .filter((n) => fs.existsSync(path.join(ROOT, 'examples', n, CONFIG_FILE)))
      .map((n) => resolveInvite(n));
  let failed = 0;
  for (const target of targets) failed += await testInvite(target);
  if (failed) throw new UserError(`Engine test failed (${failed}).`);
});

async function testInvite({ dir, id }) {
  await build(dir, { quiet: true });
  const rsvpLog = path.join(dir, '.rsvp-test.jsonl');
  fs.rmSync(rsvpLog, { force: true });

  const { chromium, webkit } = await import('playwright');
  const srv = await startServer({ inviteDir: dir });
  const results = [];
  const test = async (name, fn) => {
    try {
      await fn();
      results.push([true, name]);
    } catch (err) {
      results.push([false, `${name} — ${err.message.split('\n')[0]}`]);
    }
  };
  const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

  try {
    for (const [label, type] of [['chrome', chromium], ['webkit', webkit]]) {
      const browser = label === 'chrome'
        ? await type.launch({ channel: 'chrome' }).catch(() => type.launch())
        : await type.launch();
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(srv.url, { waitUntil: 'load' });

      await test(`${label}: gate is shown and page scroll is locked`, async () => {
        expect(await page.isVisible('[data-gate]'), 'gate not visible');
        expect(await page.evaluate(() => document.documentElement.classList.contains('gate-active')), 'no gate-active class');
      });

      const hasSlider = !!(await page.$('[data-gate-handle]'));
      const hasMusic = !!(await page.$('[data-audio]'));
      const hasPetals = !!(await page.$('[data-petals]'));
      const leaveMs = await page.evaluate(() => {
        const g = document.querySelector('[data-gate]');
        const n = (a, d) => { const v = parseInt(g.getAttribute(a), 10); return Number.isNaN(v) ? d : v; };
        return n('data-gate-delay', 200) + n('data-gate-leave', 400);
      });

      if (hasSlider) {
        await test(`${label}: a short drag snaps back and stays closed`, async () => {
          const box = await page.locator('[data-gate-handle]').boundingBox();
          await page.mouse.move(box.x + 30, box.y + 30);
          await page.mouse.down();
          await page.mouse.move(box.x + 60, box.y + 30, { steps: 5 });
          await page.mouse.up();
          await page.waitForTimeout(500);
          expect(await page.isVisible('[data-gate]'), 'gate opened on a short drag');
        });

        await test(`${label}: sliding the handle opens the invitation`, async () => {
          const box = await page.locator('[data-gate-handle]').boundingBox();
          await page.mouse.move(box.x + 30, box.y + 30);
          await page.mouse.down();
          await page.mouse.move(box.x + 250, box.y + 30, { steps: 12 });
          await page.mouse.up();
          await page.waitForTimeout(leaveMs + 300);
          expect(!(await page.$('[data-gate]')), 'gate still in the page');
        });
      } else {
        await test(`${label}: tapping the gate's open button opens the invitation`, async () => {
          await page.click('[data-gate-open]');
          expect(await page.evaluate(() => document.querySelector('[data-gate]').classList.contains('is-opening')), 'no is-opening class for the animation');
          await page.waitForTimeout(leaveMs + 300);
          expect(!(await page.$('[data-gate]')), 'gate still in the page');
        });
      }

      await test(`${label}: invitation is open and scroll is unlocked`, async () => {
        const [open, locked] = await page.evaluate(() => [document.documentElement.classList.contains('is-open'), document.documentElement.classList.contains('gate-active')]);
        expect(open && !locked, 'page not marked open / still locked');
      });

      if (hasMusic) {
        await test(`${label}: music button appears`, async () => {
          expect(await page.isVisible('[data-audio-toggle]'), 'music button not visible');
        });
      }

      if (hasPetals) {
        await test(`${label}: petals shower on opening`, async () => {
          expect(await page.$('.petals-layer'), 'no petals layer');
        });
      }

      await test(`${label}: countdown shows time left`, async () => {
        const days = await page.textContent('[data-unit="days"]');
        const target = await page.getAttribute('[data-countdown]', 'data-countdown');
        const expected = Math.floor((Date.parse(target) - Date.now()) / 86400000);
        expect(Number(days) === expected, `shows ${days} days, expected ${expected}`);
      });

      if (await page.$('canvas[data-river]')) {
        await test(`${label}: river canvas covers the whole page`, async () => {
          const [h, ch] = await page.evaluate(() => [document.querySelector('.invite').scrollHeight, document.querySelector('canvas[data-river]').offsetHeight]);
          expect(Math.abs(h - ch) <= 2, `canvas ${ch}px, page ${h}px`);
        });
      }

      await test(`${label}: RSVP needs a name, shows event choices, and sends`, async () => {
        const form = page.locator('[data-rsvp]');
        await form.scrollIntoViewIfNeeded();
        await form.locator('[type="submit"]').click();
        expect((await form.locator('[data-rsvp-status]').getAttribute('class')).includes('is-error'), 'empty form was not rejected');
        await form.locator('input[name="name"]').fill(`Test Guest ${label}`);
        await form.locator('input[value="yes_some"]').check();
        expect(await form.locator('[data-rsvp-events]').isVisible(), 'event choices did not appear');
        await form.locator('[data-rsvp-events] input').first().check();
        await form.locator('[type="submit"]').click();
        await page.waitForSelector('[data-rsvp-status].is-success', { timeout: 5000 });
        const log = fs.readFileSync(rsvpLog, 'utf8');
        expect(log.includes(`Test Guest ${label}`), 'RSVP not received by the test endpoint');
      });

      await test(`${label}: ?static skips the gate and animations`, async () => {
        await page.goto(`${srv.url}?static`, { waitUntil: 'load' });
        expect(!(await page.$('[data-gate]')), 'gate present in static mode');
        expect(!(await page.evaluate(() => document.documentElement.classList.contains('reveal-ready'))), 'reveal animations active');
      });

      await test(`${label}: no JavaScript errors`, async () => {
        expect(!errors.length, errors.join(' | '));
      });

      await browser.close();
    }
  } finally {
    await srv.close();
    fs.rmSync(rsvpLog, { force: true });
  }

  console.log(`\nEngine test on "${id}":\n`);
  for (const [ok, name] of results) console.log(`  ${ok ? '✔' : '✖'} ${name}`);
  const failed = results.filter(([ok]) => !ok).length;
  console.log(failed ? `\n${failed} failed.\n` : '\nAll passed.\n');
  return failed;
}
