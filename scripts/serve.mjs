// npm run serve -- <invite> [--port 5173] [--lan]
// Builds the invite, serves it, and rebuilds + refreshes the page whenever a file changes.
// --lan also makes it reachable from a phone on the same Wi-Fi (Windows may ask to allow Node — choose "Private networks").
import fs from 'node:fs';
import path from 'node:path';
import { resolveInvite, parseArgs, run, engineDirFor, UserError } from './lib/invite.mjs';
import { build, walk } from './lib/build.mjs';
import { startServer, lanAddresses } from './lib/server.mjs';

run(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const { dir, id } = resolveInvite(positional[0]);
  const port = Number(flags.port) || 5173;
  const lan = !!flags.lan;

  await build(dir);
  let srv;
  try {
    srv = await startServer({ inviteDir: dir, port, host: lan ? '0.0.0.0' : '127.0.0.1', liveReload: true });
  } catch (err) {
    if (err.code === 'EADDRINUSE') throw new UserError(`Port ${port} is busy — a preview is probably already running. Use it, or add --port 5174.`);
    throw err;
  }

  console.log(`\n  Preview of "${id}":  ${srv.url}`);
  if (lan) for (const ip of lanAddresses()) console.log(`  On your phone (same Wi-Fi):  http://${ip}:${srv.port}/`);
  console.log('  Add ?static to the address to skip the gate and animations.');
  console.log('  Watching for changes… (Ctrl+C to stop)\n');

  const watched = [path.join(dir, 'theme'), path.join(dir, 'invite.config.json'), engineDirFor(dir)];
  // Windows also reports file *reads* as changes, so compare modification times before rebuilding.
  const signature = () => watched.filter((t) => fs.existsSync(t)).flatMap((t) => (fs.statSync(t).isDirectory() ? [...walk(t)] : [t]))
    .map((f) => { const s = fs.statSync(f); return `${f}:${s.mtimeMs}:${s.size}`; }).join('|');
  let lastSignature = signature();

  let timer = null;
  let building = false;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (building) return rebuild();
      const now = signature();
      if (now === lastSignature) return;
      lastSignature = now;
      building = true;
      try {
        await build(dir, { quiet: true });
        console.log(`  ↻ Rebuilt at ${new Date().toLocaleTimeString()}`);
        srv.reload();
      } catch (err) {
        console.error(`  ✖ ${err.message}`);
      } finally {
        building = false;
      }
    }, 250);
  };

  for (const target of watched) {
    if (fs.existsSync(target)) fs.watch(target, { recursive: true }, rebuild);
  }
});
