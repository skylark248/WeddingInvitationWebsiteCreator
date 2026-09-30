// npm run deploy -- <invite> --preview    publish a private preview link to send the couple
// npm run deploy -- <invite> --live       publish the real site (stricter checks)
//
// Hosting is Cloudflare Pages (free). One Cloudflare Pages project per invite, named invite-<id>.
// First time on a computer:  npx wrangler login   (opens the browser to sign in to Cloudflare)
import path from 'node:path';
import { resolveInvite, parseArgs, run, loadConfig, UserError } from './lib/invite.mjs';
import { runChecks } from './lib/checks.mjs';
import { wrangler } from './lib/wrangler.mjs';

run(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const { dir, id } = resolveInvite(positional[0]);
  if (!flags.preview === !flags.live) throw new UserError('Say which kind of deploy:  --preview  (link for the couple)  or  --live  (the real site).');
  const live = !!flags.live;

  const ok = await runChecks(dir, { live });
  if (!ok) throw new UserError(`Not deploying — fix the "Must fix" items above first, then run this again.`);

  const config = loadConfig(dir);
  const project = (config.deploy && config.deploy.project) || `invite-${id}`.slice(0, 58);
  const hostname = `${config.site.subdomain}.${config.site.domain}`;

  const who = await wrangler(['whoami'], { quiet: true });
  if (who.code !== 0 || /not authenticated|You are not logged in/i.test(who.output)) {
    throw new UserError('This computer is not signed in to Cloudflare yet. Run:  npx wrangler login  — then run this deploy again.');
  }

  const list = await wrangler(['pages', 'project', 'list'], { quiet: true });
  if (!list.output.includes(project)) {
    console.log(`\nCreating the Cloudflare Pages project "${project}"…`);
    const created = await wrangler(['pages', 'project', 'create', project, '--production-branch', 'main']);
    if (created.code !== 0) throw new UserError(`Cloudflare could not create the project "${project}". See the message above.`);
  }

  console.log(`\nUploading ${live ? 'the LIVE site' : 'a preview'}…\n`);
  const branch = live ? 'main' : 'preview';
  const result = await wrangler(['pages', 'deploy', path.join(dir, 'dist'), '--project-name', project, '--branch', branch, '--commit-dirty=true']);
  if (result.code !== 0) throw new UserError('The upload failed. See the message above.');

  const urls = [...new Set(result.output.match(/https:\/\/[a-z0-9.-]+\.pages\.dev/gi) || [])];
  if (!live) {
    console.log(`\n✔ Preview is up. Send this link to the couple:\n\n    https://preview.${project}.pages.dev/\n`);
    if (urls.length) console.log(`  (This exact version is also saved at ${urls[0]})\n`);
    return;
  }

  const domainAdded = await attachDomain(project, hostname);
  console.log(`\n✔ The live site is uploaded to https://${project}.pages.dev/\n`);
  if (domainAdded !== 'already') {
    console.log(`To show it at https://${hostname}/ (only needed once per invite):

  1. Cloudflare${domainAdded === 'added' ? ' — done automatically ✔' : ` — dash.cloudflare.com → Workers & Pages → ${project}
     → Custom domains → Set up a custom domain → type  ${hostname}  → Continue`}

  2. Hostinger — hPanel → Domains → ${config.site.domain} → DNS / Nameservers → DNS records
     • If there is already a record with Name "${config.site.subdomain}", delete it first.
     • Add record:  Type CNAME   Name ${config.site.subdomain}   Points to ${project}.pages.dev   TTL default

  3. Wait 5–30 minutes, then run:  npm run verify -- ${id}
`);
  } else {
    console.log(`  It is served at https://${hostname}/ — run  npm run verify -- ${id}  to double-check.\n`);
  }
});

/** Adds the custom domain through the Cloudflare API when a token is available. */
async function attachDomain(project, hostname) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account) return 'manual';
  const base = `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${project}/domains`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  try {
    const existing = await (await fetch(base, { headers })).json();
    if (existing.success && existing.result.some((d) => d.name === hostname)) return 'already';
    const added = await (await fetch(base, { method: 'POST', headers, body: JSON.stringify({ name: hostname }) })).json();
    return added.success ? 'added' : 'manual';
  } catch {
    return 'manual';
  }
}
