// npm run private-files -- <design>                    which files are real and which are placeholders
// npm run private-files -- <design> --from "<folder>"  copy the real files in from a folder you have
//
// The public repo can't hold the designer's artwork, bought fonts, music or client PDFs, so it has
// placeholders of the same size instead. The real files live in private/ (git-ignored) and the
// build uses them automatically. A design lists its private files in private-files.json.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, PRIVATE_DIR, resolveInvite, parseArgs, run, UserError } from './lib/invite.mjs';

run(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const { dir, id } = resolveInvite(positional[0]);
  const manifestFile = path.join(dir, 'private-files.json');
  if (!fs.existsSync(manifestFile)) {
    console.log(`\n"${id}" has no private files — everything it needs is in the repo.\n`);
    return;
  }
  const { files } = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const from = typeof flags.from === 'string' ? path.resolve(flags.from) : null;
  if (flags.from && !from) throw new UserError('Say which folder to copy from:  --from "D:\\Wedding Site"');
  if (from && !fs.existsSync(from)) throw new UserError(`The folder "${from}" doesn't exist.`);

  const target = (f) => (f.kind === 'design'
    ? path.join(dir, f.path) // design sources sit in the design's own (git-ignored) design/ folder
    : path.join(PRIVATE_DIR, path.relative(ROOT, dir), f.path));

  console.log(`\nPrivate files for "${id}"${from ? ` — copying from ${from}` : ''}\n`);
  let real = 0;
  for (const f of files) {
    const dest = target(f);
    if (from && f.original) {
      const src = path.join(from, f.original);
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }
    }
    const ok = fs.existsSync(dest);
    if (ok) real++;
    const hint = !ok && from && f.original ? `  (not found: ${f.original})` : '';
    console.log(`  ${ok ? '✔ real       ' : '○ placeholder'}  ${f.path} — ${f.what}${hint}`);
  }
  console.log(`\n${real} of ${files.length} real. Real files are kept in private/ and design/ — both git-ignored, never pushed.`);
  if (real < files.length) console.log('Placeholders still work for building and testing; they just look plain.');
  console.log('');
});
