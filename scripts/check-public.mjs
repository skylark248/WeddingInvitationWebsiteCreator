// npm run check-public [-- --all]
// Runs automatically before every commit to this PUBLIC repository (.githooks/pre-commit).
// Refuses to commit anything confidential:
//   • client work (invites/), real files (private/), example design sources, secrets (.env)
//   • a file identical to one of the real files kept in private/
//   • text containing a client's family lines or family name (read from invites/*/invite.config.json)
// --all checks every tracked file instead of just the staged ones.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ROOT, PRIVATE_DIR, parseArgs, run } from './lib/invite.mjs';
import { walk } from './lib/build.mjs';

const TEXT = /\.(md|json|njk|html|css|js|mjs|txt|gs|yml|yaml)$/i;

run(async () => {
  const { flags } = parseArgs(process.argv.slice(2));
  const list = flags.all
    ? execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
    : execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { cwd: ROOT, encoding: 'utf8' });
  const files = list.split('\n').map((s) => s.trim()).filter(Boolean);
  const problems = [];

  for (const f of files) {
    if (/^(invites|private)\//.test(f)) problems.push(`${f} — client work / private files never go in the public repo`);
    else if (/^examples\/[^/]+\/design\/(?!README\.md$)/.test(f)) problems.push(`${f} — example design sources stay private`);
    else if (/(^|\/)\.env$/.test(f)) problems.push(`${f} — contains private keys`);
  }

  // Byte-identical copies of the real private files
  const privateHashes = new Map();
  if (fs.existsSync(PRIVATE_DIR)) {
    for (const p of walk(PRIVATE_DIR)) privateHashes.set(hash(fs.readFileSync(p)), path.relative(ROOT, p));
  }
  // Client details that must not appear in public text
  const secrets = [];
  const invitesDir = path.join(ROOT, 'invites');
  if (fs.existsSync(invitesDir)) {
    for (const id of fs.readdirSync(invitesDir)) {
      const cfg = path.join(invitesDir, id, 'invite.config.json');
      if (!fs.existsSync(cfg)) continue;
      try {
        const c = JSON.parse(fs.readFileSync(cfg, 'utf8'));
        for (const p of c.couple || []) for (const l of p.lineage || []) if (l && l.length > 12 && !/TODO/.test(l)) secrets.push([l, id]);
        if (c.closing && c.closing.family && !/TODO/.test(c.closing.family)) secrets.push([c.closing.family, id]);
      } catch { /* unreadable config — skip */ }
    }
  }

  for (const f of files) {
    const abs = path.join(ROOT, f);
    if (!fs.existsSync(abs)) continue;
    const buf = fs.readFileSync(abs);
    const match = privateHashes.get(hash(buf));
    if (match) problems.push(`${f} — identical to the private file ${match}`);
    if (TEXT.test(f) && secrets.length) {
      const text = buf.toString('utf8');
      for (const [s, id] of secrets) if (text.includes(s)) problems.push(`${f} — contains "${s}" from the client invite "${id}"`);
    }
  }

  if (problems.length) {
    console.error('\n✖ Not committed: this is a PUBLIC repository and these would leak confidential material:\n');
    for (const p of [...new Set(problems)]) console.error(`  • ${p}`);
    console.error('\nUnstage them (git restore --staged <file>) or replace them with placeholders.\n');
    process.exit(1);
  }
  console.log(`✔ Public-repo check passed (${files.length} file(s)).`);
});

function hash(buf) {
  return crypto.createHash('sha1').update(buf).digest('hex');
}
