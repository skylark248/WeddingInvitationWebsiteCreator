// npm run new -- <invite-id> [--from <example-or-invite>]
// Creates invites/<invite-id>/ from the starter template (or from an existing design, to reuse
// its artwork for another couple), with its own frozen copy of the engine.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, CONFIG_FILE, resolveInvite, parseArgs, run, UserError } from './lib/invite.mjs';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SKIP = new Set(['dist', '.cache', '.screens', '.rsvp-test.jsonl', 'engine', 'PROGRESS.md']);

run(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const id = positional[0];
  if (!id || !SLUG.test(id)) {
    throw new UserError('Give the new invite a short name: lowercase letters, numbers and dashes, e.g.  npm run new -- priya-arjun');
  }
  const dest = path.join(ROOT, 'invites', id);
  if (fs.existsSync(dest)) throw new UserError(`invites/${id} already exists. Pick another name, or continue working on that one.`);

  const source = flags.from ? resolveInvite(String(flags.from)).dir : path.join(ROOT, 'template');
  copyDir(source, dest);

  // Frozen copy of the engine: later engine changes never alter this invite.
  copyDir(path.join(ROOT, 'engine'), path.join(dest, 'engine'), new Set(['README.md']));
  fs.copyFileSync(path.join(ROOT, 'template', 'PROGRESS.md'), path.join(dest, 'PROGRESS.md'));
  fs.mkdirSync(path.join(dest, 'design'), { recursive: true });
  const designReadme = path.join(ROOT, 'template', 'design', 'README.md');
  if (!fs.existsSync(path.join(dest, 'design', 'README.md'))) fs.copyFileSync(designReadme, path.join(dest, 'design', 'README.md'));

  const configFile = path.join(dest, CONFIG_FILE);
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  config.id = id;
  config.site = { ...(config.site || {}), subdomain: id.replace(/-/g, '') };
  if (config.rsvp) config.rsvp.endpoint = 'local';
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n');

  const engineVersion = fs.readFileSync(path.join(ROOT, 'engine', 'VERSION'), 'utf8').trim();
  console.log(`
✔ Created invites/${id}  (from ${path.relative(ROOT, source) || source}, engine ${engineVersion})

  Subdomain will be:  https://${config.site.subdomain}.${config.site.domain}/
  Next:
    1. Put the Figma exports in invites/${id}/design/  (see the README there)
    2. Fill in invites/${id}/invite.config.json with the couple's details
    3. npm run serve -- ${id}
`);
});

function copyDir(src, dest, skip = SKIP) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to, skip);
    else fs.copyFileSync(from, to);
  }
}
