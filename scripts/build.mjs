// npm run build -- <invite>
// Builds the invite into <invite>/dist. Use `npm run check` to also run every quality check.
import { resolveInvite, parseArgs, run } from './lib/invite.mjs';
import { build } from './lib/build.mjs';

run(async () => {
  const { positional } = parseArgs(process.argv.slice(2));
  const { dir } = resolveInvite(positional[0]);
  await build(dir);
});
