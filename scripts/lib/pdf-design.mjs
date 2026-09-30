// Reads a Figma PDF export: renders every frame to a PNG, pulls out the embedded artwork,
// and lists every line of text with its font, size and position.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const FRAME_WIDTH = 780; // 2× a 390 px phone
const MIN_ART_SIZE = 64;

export async function readPdfDesign(pdfFile, { framesDir, artDir, prefix }) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(pdfFile));
  const doc = await pdfjs.getDocument({ data, verbosity: 0 }).promise;
  fs.mkdirSync(framesDir, { recursive: true });
  fs.mkdirSync(artDir, { recursive: true });

  const frames = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const view = page.getViewport({ scale: 1 });
    const ops = await page.getOperatorList(); // also loads fonts, so their real names are known

    // Frame picture
    const viewport = page.getViewport({ scale: FRAME_WIDTH / view.width });
    const { canvas, context } = doc.canvasFactory.create(Math.round(viewport.width), Math.round(viewport.height));
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    const framePng = path.join(framesDir, `${prefix}frame-${p}.png`);
    fs.writeFileSync(framePng, canvas.toBuffer('image/png'));

    // Embedded artwork
    const art = [];
    const seen = new Set();
    ops.fnArray.forEach((fn, i) => {
      if (fn === pdfjs.OPS.paintImageXObject) seen.add(ops.argsArray[i][0]);
    });
    let n = 0;
    for (const objId of seen) {
      const store = objId.startsWith('g_') ? page.commonObjs : page.objs;
      if (!store.has(objId)) continue;
      let img;
      try { img = store.get(objId); } catch { continue; }
      if (!img || !img.data || img.width < MIN_ART_SIZE || img.height < MIN_ART_SIZE) continue;
      const channels = img.kind === 3 ? 4 : img.kind === 2 ? 3 : 0;
      if (!channels) continue;
      n++;
      const file = path.join(artDir, `${prefix}frame-${p}-art-${n}.png`);
      await sharp(Buffer.from(img.data), { raw: { width: img.width, height: img.height, channels } }).png().toFile(file);
      art.push({ file, width: img.width, height: img.height });
    }

    // Text
    const content = await page.getTextContent();
    const items = content.items.filter((it) => it.str && it.str.trim()).map((it) => {
      const [a, b, , , e, f] = it.transform;
      const size = Math.round(Math.hypot(a, b) * 10) / 10;
      return { text: it.str, x: Math.round(e), y: Math.round(view.height - f - size), size, font: fontName(page, it.fontName) };
    });
    items.sort((m, k) => m.y - k.y || m.x - k.x);
    const lines = [];
    for (const it of items) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.y - it.y) <= 2 && last.font === it.font && last.size === it.size) {
        last.text += (/\s$/.test(last.text) ? '' : ' ') + it.text.trim();
      } else lines.push({ ...it, text: it.text.trim() });
    }

    frames.push({ number: p, width: Math.round(view.width), height: Math.round(view.height), framePng, art, lines });
  }
  return frames;
}

function fontName(page, id) {
  try {
    const font = page.commonObjs.get(id);
    const name = (font && (font.name || font.loadedName)) || id;
    return name.replace(/^[A-Z]{6}\+/, ''); // drop the subset prefix, e.g. "ABCDEF+"
  } catch {
    return id;
  }
}
