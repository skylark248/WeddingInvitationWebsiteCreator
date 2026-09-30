// npm run design -- <invite>
// Reads the PDF(s) exported from Figma in <invite>/design/ and prepares them for building:
//   design/frames/pdf-frame-<n>.png          a picture of every frame (for comparing screenshots)
//   design/extracted/pdf-frame-<n>-art-<k>.png  artwork embedded in the PDF (placed images)
//   design/pdf-notes.md                      every line of text with font, size and position
// Vector artwork (drawn in Figma, not placed as a picture) can't be pulled out of a PDF —
// use the Figma link (npm run figma) or ask the designer to export those layers as PNG.
import fs from 'node:fs';
import path from 'node:path';
import { resolveInvite, parseArgs, run, UserError } from './lib/invite.mjs';
import { readPdfDesign } from './lib/pdf-design.mjs';
import { toPosix } from './lib/build.mjs';

run(async () => {
  const { positional } = parseArgs(process.argv.slice(2));
  const { dir, id } = resolveInvite(positional[0]);
  const designDir = path.join(dir, 'design');
  const pdfs = fs.existsSync(designDir) ? fs.readdirSync(designDir).filter((f) => f.toLowerCase().endsWith('.pdf')) : [];
  if (!pdfs.length) throw new UserError(`There is no PDF in ${id}/design/. Put the PDF exported from Figma there first.`);

  const framesDir = path.join(designDir, 'frames');
  const artDir = path.join(designDir, 'extracted');
  const rel = (f) => toPosix(path.relative(designDir, f));
  const out = [
    `# PDF design notes — ${id}`,
    '',
    `Made by \`npm run design\` on ${new Date().toISOString().slice(0, 10)} from ${pdfs.join(', ')}.`,
    'Sizes and positions are in Figma pixels (1 PDF point = 1 px). Colours are not listed — look at the frame pictures.',
    '',
  ];
  const fonts = new Map();
  let frameCount = 0;
  let artCount = 0;

  for (const [i, file] of pdfs.entries()) {
    const prefix = pdfs.length > 1 ? `pdf${i + 1}-` : 'pdf-';
    const frames = await readPdfDesign(path.join(designDir, file), { framesDir, artDir, prefix });
    out.push(`## ${file} — ${frames.length} frame(s)`, '');
    for (const f of frames) {
      frameCount++;
      artCount += f.art.length;
      const scale = 390 / f.width;
      out.push(`### Frame ${f.number} — ${f.width} × ${f.height} px`, '', `Picture: \`${rel(f.framePng)}\``, '');
      if (Math.abs(scale - 1) > 0.02) out.push(`_For a 390 px phone, multiply sizes and positions by ${scale.toFixed(3)}._`, '');
      if (f.art.length) {
        out.push('Artwork found in this frame:', '');
        for (const a of f.art) out.push(`- \`${rel(a.file)}\` (${a.width} × ${a.height})`);
        out.push('');
      }
      if (!f.lines.length) {
        out.push('_No real text in this frame (it may be outlined, or only pictures)._', '');
        continue;
      }
      out.push('| y | x | size | font | text |', '|---:|---:|---:|---|---|');
      for (const l of f.lines) {
        out.push(`| ${l.y} | ${l.x} | ${l.size} | ${l.font} | ${l.text.replace(/\|/g, '\\|')} |`);
        fonts.set(l.font, (fonts.get(l.font) || new Set()).add(l.size));
      }
      out.push('');
    }
  }

  if (fonts.size) {
    out.push('## Fonts used', '', '| font | sizes (px) |', '|---|---|');
    for (const [font, sizes] of fonts) out.push(`| ${font} | ${[...sizes].sort((a, b) => a - b).join(', ')} |`);
    out.push('', '- Fonts not on Google Fonts must be added to theme/assets/fonts/ — ask the designer for the files.');
    out.push('- A font name with "PERSONAL USE" / "Demo" in it usually may not be used in paid work — tell the designer.', '');
  }

  const target = path.join(designDir, 'pdf-notes.md');
  fs.writeFileSync(target, out.join('\n'));
  console.log(`✔ Read ${pdfs.length} PDF: ${frameCount} frame picture(s) in design/frames/, ${artCount} artwork file(s) in design/extracted/, notes in design/pdf-notes.md`);
});
