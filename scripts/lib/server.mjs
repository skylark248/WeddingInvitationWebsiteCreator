// A small static server for previewing an invite's dist folder.
// - POST /__rsvp stores test RSVPs in <invite>/.rsvp-test.jsonl (used when rsvp.endpoint is "local")
// - optional live reload: the page refreshes itself after every rebuild
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.mp4': 'video/mp4',
};

const RELOAD_SNIPPET = '<script>new EventSource("/__reload").onmessage=function(){location.reload()}</script>';

export function startServer({ inviteDir, port = 0, host = '127.0.0.1', liveReload = false }) {
  const distDir = path.join(inviteDir, 'dist');
  const clients = new Set();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');

    if (url.pathname === '/__reload') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }

    if (url.pathname === '/__rsvp' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 20000) req.destroy(); });
      req.on('end', () => {
        let ok = true;
        try {
          const data = JSON.parse(body);
          fs.appendFileSync(path.join(inviteDir, '.rsvp-test.jsonl'), JSON.stringify({ receivedAt: new Date().toISOString(), ...data }) + '\n');
          console.log(`  ✉ Test RSVP from "${data.name}" — ${data.attendingLabel || data.attending}`);
        } catch {
          ok = false;
        }
        res.writeHead(ok ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(ok ? { ok: true } : { ok: false, error: 'bad request' }));
      });
      return;
    }

    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(distDir, path.normalize(rel));
    if (!file.startsWith(distDir) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' };
    if (ext === '.html' && liveReload) {
      const html = fs.readFileSync(file, 'utf8').replace('</body>', `${RELOAD_SNIPPET}</body>`);
      res.writeHead(200, headers);
      res.end(html);
      return;
    }
    const size = fs.statSync(file).size;
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      // Audio on iPhone needs byte-range support.
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Number(range[2]) : size - 1;
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, { ...headers, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(file).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const actualPort = server.address().port;
      resolve({
        server,
        port: actualPort,
        url: `http://127.0.0.1:${actualPort}/`,
        reload() { for (const c of clients) c.write('data: reload\n\n'); },
        close() { for (const c of clients) c.end(); return new Promise((r) => server.close(r)); },
      });
    });
  });
}

export function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push(a.address);
  }
  return out;
}
