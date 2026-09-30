// Runs the Cloudflare "wrangler" CLI installed in node_modules (no global install, no shell quirks on Windows).
import { spawn } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './invite.mjs';

const WRANGLER = path.join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

/** Resolves { code, output }. Output is also streamed to the console unless quiet. */
export function wrangler(args, { quiet = false } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [WRANGLER, ...args], { cwd: ROOT, env: process.env });
    let output = '';
    const onData = (chunk) => {
      const text = chunk.toString();
      output += text;
      if (!quiet) process.stdout.write(text);
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('close', (code) => resolve({ code, output }));
  });
}
