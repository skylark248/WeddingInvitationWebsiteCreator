// PreToolUse hook for Bash. Stops commands that would skip a safety check, lose work,
// expose a private key, or change the shared tool kit behind the file guard's back.
import { readInput, block, projectPath, isEditable, protectedReason, isMaintainer } from './lib.mjs';

const input = readInput();
const command = String((input.tool_input && input.tool_input.command) || '');

// Private keys: only the person types them, in Notepad. Allow creating .env from the example and opening it.
const touchesEnv = /(^|[\s"'=\/])\.env\b(?!\.example)/.test(command);
const allowedEnv = /^\s*(cp \.env\.example \.env|(cmd\s*\/+c\s+)?start\s+("")?\s*notepad(\.exe)?\s+\.env|notepad(\.exe)?\s+\.env)\s*$/i.test(command);
if (touchesEnv && !allowedEnv) block('✋ The .env file holds private keys and stays private. Open it for the person with:  start notepad .env  — they paste the key themselves.');

if (isMaintainer) process.exit(0);

const GIT = String.raw`\bgit\s+(?:-C\s+("[^"]*"|\S+)\s+)?`;
const rules = [
  [/\bwrangler\b[^|;&]*\b(deploy|publish|delete)\b/i, 'Publish only with  npm run deploy -- <invite> --preview|--live  — it runs every check first.'],
  [new RegExp(`${GIT}push\\b[^|;&]*(\\s--force\\b|\\s-f\\b|--force-with-lease)`, 'i'), 'Force-pushing can destroy saved work. Never do it; use /stuck if a push is refused.'],
  [new RegExp(`${GIT}(reset\\s+--hard|clean\\s+-[a-z]*f|checkout\\s+--\\s|restore\\s+(--staged\\s+)?\\.)`, 'i'), 'That throws work away without a trace. Use /undo, which reverses a saved step safely.'],
  [new RegExp(`${GIT}(rebase|filter-branch|filter-repo|update-ref)\\b`, 'i'), 'History-rewriting git commands are off-limits. Use /undo or /stuck.'],
  [/--no-verify\b/i, 'Skipping checks is not allowed.'],
  [/\bnpm\s+(install|i|add|uninstall|remove|rm|update)\s+[^-\s]/i, 'Adding or removing tool-kit packages changes every invite. Ask the maintainer (/stuck) instead.'],
];
for (const [re, why] of rules) if (re.test(command)) block(`✋ Not run: ${why}`);

// Two repositories: the tool kit (public) only receives updates; invite work is saved in the
// private invites/ repository. Anything that writes to git must say  git -C invites …
const WRITES = /^(add|commit|push|revert|stash|rm|mv|tag|merge|cherry-pick|am|apply|restore|checkout|switch|branch|reset|clean|init)$/;
for (const m of command.matchAll(new RegExp(`${GIT}([a-z-]+)`, 'gi'))) {
  const dir = (m[1] || '').replace(/^"|"$/g, '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
  if (WRITES.test(m[2]) && dir !== 'invites') {
    block(`✋ Not run: invite work is saved in the private invites repository — use  git -C invites ${m[2]} …  instead. The tool kit repository is public and only receives updates (git pull).`);
  }
}

// Shell commands that write files: the destination must be one Claude is allowed to edit.
for (const segment of command.split(/&&|\|\||;|\|/)) {
  const words = tokenize(segment);
  while (words.length && /^[A-Z_][A-Z0-9_]*=/.test(words[0])) words.shift();
  const program = (words[0] || '').replace(/^.*[\\/]/, '');
  const args = words.slice(1).filter((w) => !w.startsWith('-'));
  let targets = [];
  if (['rm', 'rmdir', 'unlink', 'truncate', 'touch', 'mkdir'].includes(program)) targets = args;
  else if (['cp', 'mv', 'install', 'ln'].includes(program)) targets = args.slice(-1);
  else if (program === 'sed' && words.some((w) => /^-[a-z]*i/.test(w))) targets = args.slice(1);
  else if (program === 'tee') targets = args;
  for (const m of segment.matchAll(/(?:^|[^0-9&>])>>?\s*("?)([^\s"|;&<>]+)\1/g)) targets.push(m[2]);
  for (const t of targets) {
    const rel = projectPath(t.replace(/^["']|["']$/g, ''));
    if (rel === null || rel === '') continue;
    if (rel === '.env' && allowedEnv) continue; // creating .env from .env.example (empty keys)
    if (/^invites\/[a-z0-9-]+\/(dist|\.cache|\.screens)(\/|$)/.test(rel)) continue; // generated folders
    if (/^invites\/[a-z0-9-]+\/?$/.test(rel) && program === 'mkdir') continue;
    if (!isEditable(rel) && !isEditable(`${rel}/`)) block(`✋ Not run: this command would change ${rel}. ${protectedReason(rel)}`);
  }
}
process.exit(0);

function tokenize(s) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(s))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}
