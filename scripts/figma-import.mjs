// npm run figma -- <invite> <figma-link> [--refresh] [--offline]
// Reads the design straight from Figma (free plan works, needs FIGMA_TOKEN in .env):
//   design/frames/figma-frame-<n>-<name>.png  a picture of every frame
//   design/extracted/<layer-name>.png         artwork: layers marked for export in Figma
//                                             (or, if none are marked, placed pictures)
//   design/figma-notes.md                     texts with font, weight, size, colour, alignment
//                                             and position; artwork positions; colour palette
// --refresh  ask Figma again even if a saved copy exists (after the designer changed the file)
// --offline  use only the saved copy (no Figma requests at all)
import fs from 'node:fs';
import path from 'node:path';
import { resolveInvite, parseArgs, run, UserError } from './lib/invite.mjs';
import { figmaToken, parseFigmaUrl, loadFigmaFile, analyseFigma, renderFigmaImages, artworkOf } from './lib/figma.mjs';
import { toPosix } from './lib/build.mjs';

run(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const { dir, id } = resolveInvite(positional[0]);
  const designDir = path.join(dir, 'design');
  const cacheDir = path.join(designDir, 'figma');
  const linkFile = path.join(cacheDir, 'link.txt');
  const link = positional[1] || (fs.existsSync(linkFile) ? fs.readFileSync(linkFile, 'utf8').trim() : '');
  if (!link) throw new UserError('Give me the Figma link too:  npm run figma -- <invite> https://www.figma.com/design/…');
  const { key, nodeId, isSite } = parseFigmaUrl(link);
  if (isSite) console.log('⚠ This is a Figma *Site* link. The Figma API reads Design files; if this fails, share the Design file link instead.');

  const token = flags.offline ? null : figmaToken();
  const { data, fromCache } = await loadFigmaFile({ token, key, nodeId, cacheDir, refresh: !!flags.refresh && !flags.offline });
  fs.writeFileSync(linkFile, link + '\n');
  const analysis = analyseFigma(data);
  if (!analysis.frames.length) throw new UserError('No frames found at that link. Link to the page (or the frame) that holds the website design.');

  const framesDir = path.join(designDir, 'frames');
  const artDir = path.join(designDir, 'extracted');
  let frameFiles = new Map();
  let artFiles = [];
  if (!flags.offline && (!fromCache || flags.refresh || !fs.existsSync(framesDir))) {
    ({ frameFiles, artFiles } = await renderFigmaImages({ token, key, analysis, framesDir, artDir }));
  } else {
    analysis.frames.forEach((f, i) => {
      const guess = fs.existsSync(framesDir) && fs.readdirSync(framesDir).find((n) => n.startsWith(`figma-frame-${i + 1}-`));
      if (guess) frameFiles.set(f.id, path.join(framesDir, guess));
    });
  }

  const rel = (f) => toPosix(path.relative(designDir, f));
  const out = [
    `# Figma design notes — ${id}`,
    '',
    `Made by \`npm run figma\` on ${new Date().toISOString().slice(0, 10)} from "${data.name || key}"${data.lastModified ? ` (last changed in Figma ${data.lastModified.slice(0, 10)})` : ''}.`,
    `Link: ${link}`,
    '',
    'Positions (x, y) and sizes are in Figma pixels, measured from the frame\'s top-left corner.',
    '',
  ];

  for (const [i, f] of analysis.frames.entries()) {
    out.push(`## Frame ${i + 1} — "${f.name}"${f.page ? ` (page "${f.page}")` : ''} — ${f.width} × ${f.height} px`, '');
    if (frameFiles.get(f.id)) out.push(`Picture: \`${rel(frameFiles.get(f.id))}\``, '');
    if (Math.abs(390 / f.width - 1) > 0.02) out.push(`_For a 390 px phone, multiply sizes and positions by ${(390 / f.width).toFixed(3)}._`, '');
    if (f.texts.length) {
      out.push('| y | x | w | size | font | colour | align | spacing | text |', '|---:|---:|---:|---:|---|---|---|---:|---|');
      for (const t of f.texts) out.push(`| ${t.y} | ${t.x} | ${t.w} | ${t.size} | ${t.font} | ${t.colour} | ${t.align} | ${t.spacing || ''} | ${t.text.replace(/\|/g, '\\|')} |`);
      out.push('');
    } else out.push('_No text in this frame._', '');
    const downloaded = new Map(artFiles.filter((a) => a.frame === f.name).map((a) => [a.id, a.file]));
    const art = artworkOf(f);
    if (art.length) {
      out.push('Artwork in this frame:', '', '| layer | how found | file | x | y | w | h |', '|---|---|---|---:|---:|---:|---:|');
      for (const a of art) {
        const file = downloaded.get(a.id);
        out.push(`| ${a.name} | ${a.source} | ${file ? `\`${rel(file)}\`` : '(not downloaded)'} | ${a.x} | ${a.y} | ${a.w} | ${a.h} |`);
      }
      out.push('');
    }
  }

  out.push('## Colours used most', '', analysis.colours.map(([hex, n]) => `\`${hex}\` ×${n}`).join(' · '), '');
  if (analysis.fonts.size) {
    out.push('## Fonts', '', '| font | sizes (px) |', '|---|---|');
    for (const [font, sizes] of analysis.fonts) out.push(`| ${font} | ${[...sizes].sort((a, b) => a - b).join(', ')} |`);
    out.push('', '- Fonts not on Google Fonts must be added to theme/assets/fonts/ — ask the designer for the files.');
    out.push('- A font name with "PERSONAL USE" / "Demo" in it usually may not be used in paid work — tell the designer.', '');
  }
  out.push('_Artwork = layers marked for export in Figma + placed pictures. Artwork drawn in Figma (vectors, groups) is only included if the designer marks it for export (select the layer → Export → + → PNG 2x); then run the import again with --refresh._', '');

  fs.writeFileSync(path.join(designDir, 'figma-notes.md'), out.join('\n'));
  console.log(`✔ Figma design read${fromCache ? ' (from the saved copy — add --refresh after the designer changes the file)' : ''}: ${analysis.frames.length} frame(s), ${frameFiles.size} frame picture(s), ${artFiles.length} artwork file(s). Notes in design/figma-notes.md`);
});
