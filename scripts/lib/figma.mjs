// Reading a design straight from a Figma link with Figma's REST API.
// Works on the free plan with a personal access token (Figma → Settings → Security →
// Personal access tokens, scope "File content: read-only"), saved as FIGMA_TOKEN in .env.
// Figma limits how often free accounts may call it, so an import makes only 3 requests
// (file structure, frame pictures, artwork) and everything is cached in design/figma/.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, UserError } from './invite.mjs';

const API = 'https://api.figma.com/v1';
const FRAME_WIDTH = 780; // 2× a 390 px phone
const FRAME_TYPES = new Set(['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE']);

export function figmaToken() {
  if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN.trim();
  const envFile = path.join(ROOT, '.env');
  if (fs.existsSync(envFile)) {
    const m = /^\s*FIGMA_TOKEN\s*=\s*(.+?)\s*$/m.exec(fs.readFileSync(envFile, 'utf8'));
    if (m && m[1] && !/^(your|paste)/i.test(m[1])) return m[1].replace(/^["']|["']$/g, '');
  }
  return null;
}

/** "https://www.figma.com/design/AbC123/Name?node-id=12-34" → { key: "AbC123", nodeId: "12:34" } */
export function parseFigmaUrl(url) {
  const m = /figma\.com\/(?:design|file|proto|board|site)\/([A-Za-z0-9]+)/.exec(url || '');
  if (!m) throw new UserError(`That doesn't look like a Figma link: ${url}\nIt should look like https://www.figma.com/design/…`);
  let nodeId = null;
  try {
    const raw = new URL(url).searchParams.get('node-id');
    if (raw && raw !== '0-1' && raw !== '0:1') nodeId = raw.replace('-', ':');
  } catch { /* no node id */ }
  return { key: m[1], nodeId, isSite: /figma\.com\/site\//.test(url) };
}

async function call(token, pathAndQuery) {
  let res;
  try {
    res = await fetch(`${API}${pathAndQuery}`, { headers: { 'X-Figma-Token': token } });
  } catch (err) {
    throw new UserError(`Could not reach Figma — check the internet connection. (${err.cause ? err.cause.code : err.message})`);
  }
  if (res.ok) return res.json();
  const body = await res.text().catch(() => '');
  if (res.status === 403) throw new UserError('Figma says this key cannot open the file. Check that the key in .env is right and belongs to the Figma account that owns (or can view) this file.');
  if (res.status === 404) throw new UserError('Figma could not find that file. Check the link — and that it is a Design file, not a FigJam board or Figma Site.');
  if (res.status === 429) {
    const wait = res.headers.get('retry-after');
    throw new UserError(`Figma's limit for this account has been reached${wait ? ` (try again in about ${Math.ceil(Number(wait) / 60)} minutes)` : ''}.\nFor now, export the frames as a PDF from Figma and use that instead — nothing is lost.`);
  }
  throw new UserError(`Figma returned an error (${res.status}): ${body.slice(0, 200)}`);
}

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new UserError(`Could not download a picture from Figma (${res.status}).`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

/** Fetches (or reuses) the file structure. Returns the raw API response. */
export async function loadFigmaFile({ token, key, nodeId, cacheDir, refresh }) {
  const cacheFile = path.join(cacheDir, 'file.json');
  if (!refresh && fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    if (cached.__key === key && cached.__nodeId === nodeId) return { data: cached, fromCache: true };
  }
  if (!token) throw new UserError('There is no Figma key on this computer yet. Run /setup and choose "Connect Figma".');
  const data = nodeId
    ? await call(token, `/files/${key}/nodes?ids=${encodeURIComponent(nodeId)}`)
    : await call(token, `/files/${key}`);
  data.__key = key;
  data.__nodeId = nodeId;
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(data));
  return { data, fromCache: false };
}

/** Frames, texts, artwork and colours from the file structure. */
export function analyseFigma(data) {
  let roots;
  if (data.nodes) roots = Object.values(data.nodes).map((n) => n && n.document).filter(Boolean);
  else roots = [data.document];

  const frames = [];
  const addFrames = (node, page) => {
    if (!node || node.visible === false) return;
    if (FRAME_TYPES.has(node.type) && node.absoluteBoundingBox) { frames.push({ node, page }); return; }
    if (['DOCUMENT', 'CANVAS', 'SECTION', 'GROUP'].includes(node.type)) {
      const nextPage = node.type === 'CANVAS' ? node.name : page;
      for (const child of node.children || []) addFrames(child, nextPage);
    }
  };
  for (const r of roots) addFrames(r, r.type === 'CANVAS' ? r.name : '');
  frames.sort((a, b) => (a.page === b.page ? a.node.absoluteBoundingBox.x - b.node.absoluteBoundingBox.x || a.node.absoluteBoundingBox.y - b.node.absoluteBoundingBox.y : 0));

  const colours = new Map();
  const fonts = new Map();
  const result = frames.map(({ node: frame, page }) => {
    const box = frame.absoluteBoundingBox;
    const texts = [];
    const marked = [];
    const placed = [];
    const walk = (node, insideArt) => {
      if (node.visible === false) return;
      for (const fill of node.fills || []) {
        if (fill.type === 'SOLID' && fill.visible !== false) {
          const hex = toHex(fill.color, fill.opacity);
          colours.set(hex, (colours.get(hex) || 0) + 1);
        }
      }
      const b = node.absoluteBoundingBox;
      const pos = b ? { x: Math.round(b.x - box.x), y: Math.round(b.y - box.y), w: Math.round(b.width), h: Math.round(b.height) } : null;
      if (node.type === 'TEXT' && node.characters && node.characters.trim()) {
        const s = node.style || {};
        const fill = (node.fills || []).find((f) => f.type === 'SOLID' && f.visible !== false);
        const font = `${s.fontFamily || '?'} ${s.fontWeight || ''}${s.italic ? ' italic' : ''}`.trim();
        fonts.set(font, (fonts.get(font) || new Set()).add(Math.round(s.fontSize || 0)));
        texts.push({
          ...pos, name: node.name, text: node.characters.replace(/\s+/g, ' ').trim(), font,
          size: Math.round((s.fontSize || 0) * 10) / 10, colour: fill ? toHex(fill.color, fill.opacity) : '',
          align: (s.textAlignHorizontal || '').toLowerCase(), spacing: s.letterSpacing ? Math.round(s.letterSpacing * 10) / 10 : 0,
          lineHeight: s.lineHeightPx ? Math.round(s.lineHeightPx) : null,
        });
      }
      const isMarked = node !== frame && Array.isArray(node.exportSettings) && node.exportSettings.length > 0;
      const hasImage = (node.fills || []).some((f) => f.type === 'IMAGE' && f.visible !== false);
      if (!insideArt && isMarked) marked.push({ id: node.id, name: node.name, ...pos, settings: node.exportSettings[0] });
      if (!insideArt && hasImage && node !== frame) placed.push({ id: node.id, name: node.name, ...pos });
      for (const child of node.children || []) walk(child, insideArt || isMarked);
    };
    walk(frame, false);
    texts.sort((a, b) => a.y - b.y || a.x - b.x);
    return { id: frame.id, name: frame.name, page, width: Math.round(box.width), height: Math.round(box.height), texts, marked, placed };
  });

  return {
    frames: result,
    colours: [...colours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12),
    fonts,
  };
}

/** Renders frames and artwork to PNG (2 requests) and downloads them. */
export async function renderFigmaImages({ token, key, analysis, framesDir, artDir }) {
  const frameFiles = new Map();
  const artFiles = [];
  if (!analysis.frames.length) return { frameFiles, artFiles };
  if (!token) throw new UserError('There is no Figma key on this computer yet. Run /setup and choose "Connect Figma".');

  const width = Math.max(...analysis.frames.map((f) => f.width));
  const frameScale = clamp(FRAME_WIDTH / width, 0.01, 4);
  const frameIds = analysis.frames.map((f) => f.id);
  const framesRes = await call(token, `/images/${key}?ids=${encodeURIComponent(frameIds.join(','))}&format=png&scale=${frameScale.toFixed(3)}`);
  for (const [i, f] of analysis.frames.entries()) {
    const url = framesRes.images && framesRes.images[f.id];
    if (!url) continue;
    const file = path.join(framesDir, `figma-frame-${i + 1}-${slug(f.name)}.png`);
    await download(url, file);
    frameFiles.set(f.id, file);
  }

  // Artwork: layers the designer marked for export, plus placed pictures that aren't inside one.
  const art = analysis.frames.flatMap((f) => artworkOf(f).map((a) => ({ ...a, frame: f.name })));
  if (art.length) {
    const byScale = new Map();
    for (const a of art) {
      const s = a.settings && a.settings.constraint && a.settings.constraint.type === 'SCALE' ? a.settings.constraint.value : 2;
      if (!byScale.has(s)) byScale.set(s, []);
      byScale.get(s).push(a);
    }
    const used = new Set();
    for (const [scale, list] of byScale) {
      const res = await call(token, `/images/${key}?ids=${encodeURIComponent(list.map((a) => a.id).join(','))}&format=png&scale=${clamp(scale, 0.01, 4)}&use_absolute_bounds=true`);
      for (const a of list) {
        const url = res.images && res.images[a.id];
        if (!url) continue;
        let name = slug(a.name) || 'art';
        while (used.has(name)) name = `${name}-2`;
        used.add(name);
        const file = path.join(artDir, `${name}.png`);
        await download(url, file);
        artFiles.push({ ...a, file });
      }
    }
  }
  return { frameFiles, artFiles };
}

/** Layers marked for export, plus placed pictures (not already covered by a marked layer). */
export function artworkOf(frame) {
  const ids = new Set(frame.marked.map((a) => a.id));
  return [
    ...frame.marked.map((a) => ({ ...a, source: 'marked for export' })),
    ...frame.placed.filter((a) => !ids.has(a.id)).map((a) => ({ ...a, source: 'placed picture' })),
  ];
}

export function slug(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

function toHex(c, opacity = 1) {
  if (!c) return '';
  const h = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  const a = (c.a == null ? 1 : c.a) * (opacity == null ? 1 : opacity);
  return `#${h(c.r)}${h(c.g)}${h(c.b)}${a < 0.99 ? h(a) : ''}`.toUpperCase();
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
