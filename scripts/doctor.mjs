// npm run doctor
// Checks this computer has everything needed, in plain language. Used by the /setup skill.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, run } from './lib/invite.mjs';
import { figmaToken } from './lib/figma.mjs';
import { wrangler } from './lib/wrangler.mjs';

run(async () => {
  const rows = [];
  const add = (ok, what, fix) => rows.push({ ok, what, fix });

  const major = Number(process.versions.node.split('.')[0]);
  add(major >= 20, `Node.js ${process.versions.node}`, 'Install Node.js LTS from nodejs.org, then restart the Claude app.');

  const installed = fs.existsSync(path.join(ROOT, 'node_modules', 'nunjucks'));
  add(installed, 'Project tools installed', 'Run: npm install');

  let gitName = '';
  try { gitName = execFileSync('git', ['config', 'user.name'], { encoding: 'utf8' }).trim(); } catch { /* not set */ }
  add(!!gitName, gitName ? `Git knows you as "${gitName}"` : 'Git name not set', 'Run: git config --global user.name "Your Name"  and  git config --global user.email "you@example.com"');

  const invitesRepo = fs.existsSync(path.join(ROOT, 'invites', '.git'));
  let backup = '';
  if (invitesRepo) {
    try { backup = execFileSync('git', ['-C', 'invites', 'remote', 'get-url', 'origin'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { /* no remote */ }
  }
  if (!invitesRepo) add(false, 'Client work folder not set up (no history or undo yet)', 'Run:  npm run private-repo -- --local   (or with a private GitHub address for online backup)');
  else if (!backup) add('warn', 'Client work saved on this computer only (history and undo work; no online backup yet)', 'When a private GitHub repository exists:  npm run private-repo -- <address>');
  else add(true, 'Client work backed up privately online', '');

  const chromePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  ];
  add(chromePaths.some((p) => fs.existsSync(p)), 'Google Chrome', 'Install Google Chrome from google.com/chrome.');

  let webkitOk = false;
  if (installed) {
    try {
      const { webkit } = await import('playwright');
      webkitOk = fs.existsSync(webkit.executablePath());
    } catch { /* not installed */ }
  }
  add(webkitOk, 'iPhone-style test browser (WebKit)', 'Run: npx playwright install webkit');

  const token = figmaToken();
  add(!!token, token ? 'Figma connected' : 'Figma not connected (only needed for Figma links)', 'Run /setup → "Connect Figma".');

  let cloud = false;
  if (installed) {
    const who = await wrangler(['whoami'], { quiet: true });
    cloud = who.code === 0 && !/not authenticated|not logged in/i.test(who.output);
  }
  add(cloud, cloud ? 'Cloudflare connected (for publishing)' : 'Cloudflare not connected (only needed to publish)', 'Run: npx wrangler login');

  console.log('\nComputer check\n');
  for (const r of rows) {
    const mark = r.ok === 'warn' ? '⚠' : r.ok ? '✔' : '✖';
    console.log(`  ${mark} ${r.what}${r.ok === true ? '' : `\n      → ${r.fix}`}`);
  }
  const missing = rows.filter((r) => !r.ok).length;
  console.log(missing ? `\n${missing} thing(s) to set up.\n` : '\n✔ Everything needed is ready.\n');
});
