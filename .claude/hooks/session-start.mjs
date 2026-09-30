// SessionStart hook: tells Claude where every invite stands (from each PROGRESS.md),
// so a fresh conversation picks up exactly where the last one stopped.
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, isMaintainer } from './lib.mjs';

const lines = ['## Invite studio — current state', ''];
const invitesDir = path.join(PROJECT, 'invites');
const invites = fs.existsSync(invitesDir)
  ? fs.readdirSync(invitesDir).filter((n) => fs.existsSync(path.join(invitesDir, n, 'invite.config.json')))
  : [];

if (!invites.length) {
  lines.push('No invites yet. If the person wants to start one, use the start-invite skill.');
} else {
  for (const id of invites) {
    const file = path.join(invitesDir, id, 'PROGRESS.md');
    if (!fs.existsSync(file)) { lines.push(`- ${id}: (no PROGRESS.md)`); continue; }
    const text = fs.readFileSync(file, 'utf8');
    const done = (text.match(/^- \[x\]/gim) || []).length;
    const total = (text.match(/^- \[[ x]\]/gim) || []).length;
    const next = (/^Next step:[ \t]*(.*)$/im.exec(text) || [])[1] || '(not written)';
    lines.push(`- ${id}: ${done}/${total} steps done. Next: ${next.trim() || '(not written)'}`);
  }
  lines.push('', 'Read that invite\'s PROGRESS.md before working on it, and update it after every approved step.');
}

const missing = [];
if (!fs.existsSync(path.join(PROJECT, 'node_modules', 'nunjucks'))) missing.push('project tools not installed (run the setup skill)');
const invitesGit = path.join(invitesDir, '.git');
if (!fs.existsSync(invitesGit)) {
  missing.push('invites/ is not set up yet — no history or undo (setup skill → "Client work: history and backup")');
} else {
  let config = '';
  try { config = fs.readFileSync(path.join(invitesGit, 'config'), 'utf8'); } catch { /* unreadable */ }
  if (!/\[remote "origin"\]/.test(config)) lines.push('', 'Note: client work is saved on this computer only (no online backup yet). Commit as usual; skip `git -C invites push`.');
}
if (missing.length) lines.push('', `Setup needed: ${missing.join('; ')}.`);
if (isMaintainer) lines.push('', 'Maintainer mode: file guards are off. Engine changes must pass npm run test:engine.');

process.stdout.write(lines.join('\n') + '\n');
