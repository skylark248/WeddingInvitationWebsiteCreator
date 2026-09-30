// npm run private-repo                      status of the client-work repository (invites/)
// npm run private-repo -- --local           start it on this computer only: history and undo, no online backup
// npm run private-repo -- <private-git-url> connect it to a PRIVATE GitHub repository (online backup)
//                                           (works later too: a local-only repository keeps all its history)
//
// This tool kit is public. Client work (names, family details, designs, artwork) must never go
// into it, so invites/ is ignored by the tool kit and is its own separate git repository.
// Save invite work with:  git -C invites add <id>  /  git -C invites commit  /  git -C invites push (if online)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, parseArgs, run, UserError } from './lib/invite.mjs';

const INVITES = path.join(ROOT, 'invites');
const IGNORE = ['dist/', '.cache/', '.screens/', '.rsvp-test.jsonl', 'design/figma/file.json', '.env', ''].join('\n');
const README = `# Private invites\n\nClient work for the Invite Studio tool kit: names, family details, designs and artwork.\n**Keep this private.** It lives inside the tool kit's \`invites/\` folder and is never part of the public tool kit.\n`;

const git = (args, opts = {}) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: opts.inherit ? 'inherit' : 'pipe' });
const isRepo = () => fs.existsSync(path.join(INVITES, '.git'));
const remoteUrl = () => {
  try { return git(['-C', 'invites', 'remote', 'get-url', 'origin']).trim(); } catch { return ''; }
};

run(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const url = positional[0];

  // ---- status
  if (!url && !flags.local) {
    if (!isRepo()) {
      console.log('\n✖ invites/ is not set up yet — no history, no undo, no backup.\n  This computer only:  npm run private-repo -- --local\n  With online backup:  npm run private-repo -- https://github.com/<owner>/<private-repo>.git\n');
      process.exitCode = 1;
      return;
    }
    const remote = remoteUrl();
    const status = git(['-C', 'invites', 'status', '-sb']).split('\n')[0];
    if (remote) console.log(`\n✔ invites/ is a private repository, backed up online → ${remote}\n  ${status}\n`);
    else console.log(`\n⚠ invites/ keeps history on this computer only — there is no online backup yet.\n  Add one any time (all history is kept):  npm run private-repo -- https://github.com/<owner>/<private-repo>.git\n`);
    return;
  }

  // ---- this computer only
  if (flags.local) {
    if (isRepo()) {
      console.log(`✔ invites/ is already set up${remoteUrl() ? ` (backed up online → ${remoteUrl()})` : ' on this computer'}.`);
      return;
    }
    fs.mkdirSync(INVITES, { recursive: true });
    git(['-C', 'invites', 'init', '-b', 'main']);
    finishSetup();
    console.log('\n✔ invites/ is set up on this computer: every saved step is kept and can be undone.\n  There is no online backup yet. Add one later with:  npm run private-repo -- <private GitHub address>\n');
    return;
  }

  // ---- online backup
  if (!/^(https:\/\/|git@|file:\/\/)/.test(url)) throw new UserError(`That doesn't look like a git address: ${url}`);

  if (isRepo()) {
    const remote = remoteUrl();
    if (remote && remote !== url) throw new UserError(`invites/ is already backed up to ${remote}. Ask the maintainer before changing it.`);
    if (!remote) git(['-C', 'invites', 'remote', 'add', 'origin', url]);
    if (!git(['-C', 'invites', 'log', '--oneline', '-1']).trim()) finishSetup();
    return upload(url);
  }

  const hasContent = fs.existsSync(INVITES) && fs.readdirSync(INVITES).some((n) => n !== '.gitkeep');
  if (!hasContent) {
    fs.rmSync(INVITES, { recursive: true, force: true });
    console.log(`Downloading your private invites from ${url}…`);
    git(['clone', url, 'invites'], { inherit: true });
    if (!git(['-C', 'invites', 'log', '--oneline', '-1', '--all']).trim()) {
      finishSetup(); // the private repository was empty
      return upload(url);
    }
    console.log(`\n✔ Client work downloaded into invites/ and backed up to ${url}\n`);
    return;
  }

  // Invites already on this computer without git: start the repository from them.
  git(['-C', 'invites', 'init', '-b', 'main']);
  git(['-C', 'invites', 'remote', 'add', 'origin', url]);
  try {
    git(['-C', 'invites', 'fetch', 'origin']);
  } catch { /* empty or unreachable — the upload will tell */ }
  if (git(['-C', 'invites', 'branch', '-r']).trim()) {
    throw new UserError('The private repository already has work in it, and so does this computer. Ask the maintainer to combine them.');
  }
  finishSetup();
  return upload(url);
});

function finishSetup() {
  if (!fs.existsSync(path.join(INVITES, '.gitignore'))) fs.writeFileSync(path.join(INVITES, '.gitignore'), IGNORE);
  if (!fs.existsSync(path.join(INVITES, '.gitattributes'))) fs.copyFileSync(path.join(ROOT, '.gitattributes'), path.join(INVITES, '.gitattributes'));
  if (!fs.existsSync(path.join(INVITES, 'README.md'))) fs.writeFileSync(path.join(INVITES, 'README.md'), README);
  git(['-C', 'invites', 'add', '-A']);
  if (git(['-C', 'invites', 'status', '--porcelain']).trim()) git(['-C', 'invites', 'commit', '-q', '-m', 'Set up private invites']);
}

function upload(url) {
  try {
    git(['-C', 'invites', 'push', '-u', 'origin', 'main'], { inherit: true });
  } catch {
    console.log('\n⚠ Connected, but the upload did not go through. Check you are signed in to GitHub and have access to the repository, then run:  git -C invites push -u origin main\n');
    return;
  }
  console.log(`\n✔ Client work in invites/ is now backed up privately to ${url} (with all its history)\n`);
}
