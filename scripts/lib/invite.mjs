// Finding invites and reading their config.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONFIG_FILE = 'invite.config.json';

export class UserError extends Error {}

/** Accepts an invite id ("priya-arjun") or a folder path. Looks in invites/ then examples/. */
export function resolveInvite(arg) {
  if (!arg) {
    throw new UserError(`Tell me which invite to use, e.g.  npm run build -- priya-arjun\n\n${listInvites()}`);
  }
  const candidates = [
    path.resolve(arg),
    path.join(ROOT, 'invites', arg),
    path.join(ROOT, 'examples', arg),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, CONFIG_FILE))) {
      return { dir, id: path.basename(dir) };
    }
  }
  throw new UserError(`I couldn't find an invite called "${arg}".\n\n${listInvites()}`);
}

export function listInvites() {
  const lines = [];
  for (const group of ['invites', 'examples']) {
    const base = path.join(ROOT, group);
    if (!fs.existsSync(base)) continue;
    const names = fs.readdirSync(base).filter((n) => fs.existsSync(path.join(base, n, CONFIG_FILE)));
    if (names.length) lines.push(`${group}/: ${names.join(', ')}`);
  }
  return lines.length ? `Available invites:\n  ${lines.join('\n  ')}` : 'There are no invites yet. Create one with:  npm run new -- <name>';
}

export function loadConfig(dir) {
  const file = path.join(dir, CONFIG_FILE);
  const text = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(text);
  } catch (err) {
    const pos = Number((/position (\d+)/.exec(err.message) || [])[1]);
    let where = '';
    if (!Number.isNaN(pos)) {
      const before = text.slice(0, pos);
      where = ` (line ${before.split('\n').length})`;
    }
    throw new UserError(`${CONFIG_FILE} has a typing mistake${where}: ${err.message}\nCommon causes: a missing comma, a missing quote, or a comma after the last item in a list.`);
  }
}

/**
 * The public repo holds placeholders for files that can't be published (e.g. the designer's artwork
 * in examples/). A real version saved at private/<same path> is used instead when it exists.
 * private/ is git-ignored, so the real files never reach the public repo.
 */
export const PRIVATE_DIR = path.join(ROOT, 'private');

export function withPrivateOverride(file) {
  const rel = path.relative(ROOT, file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return file;
  const real = path.join(PRIVATE_DIR, rel);
  return fs.existsSync(real) ? real : file;
}

/** Which engine folder an invite uses: its own frozen copy if it has one, otherwise the shared one. */
export function engineDirFor(inviteDir) {
  const own = path.join(inviteDir, 'engine');
  return fs.existsSync(path.join(own, 'js', 'core.js')) ? own : path.join(ROOT, 'engine');
}

export function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [key, inline] = a.slice(2).split('=');
      if (inline !== undefined) flags[key] = inline;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) flags[key] = argv[++i];
      else flags[key] = true;
    } else positional.push(a);
  }
  return { positional, flags };
}

/** Run a script's main(), printing friendly errors instead of stack traces for expected problems. */
export function run(main) {
  main().catch((err) => {
    if (err instanceof UserError) {
      console.error(`\n✖ ${err.message}\n`);
    } else {
      console.error('\n✖ Something unexpected went wrong:\n');
      console.error(err);
    }
    process.exit(1);
  });
}
