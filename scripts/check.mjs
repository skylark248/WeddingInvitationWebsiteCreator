// npm run check -- <invite> [--live]
// Builds the invite and runs every check. Without --live it checks a preview is safe to share;
// with --live it is strict about what guests need (real RSVP sheet, real map link…).
// Exits with code 1 when something must be fixed — deploy.mjs relies on the same checks.
import { resolveInvite, parseArgs, run } from './lib/invite.mjs';
import { runChecks } from './lib/checks.mjs';

run(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const { dir } = resolveInvite(positional[0]);
  const ok = await runChecks(dir, { live: !!flags.live });
  process.exitCode = ok ? 0 : 1;
});
