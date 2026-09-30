// Runs automatically on `npm install`: turns on the public-repo leak check for commits (.githooks/pre-commit).
// Quietly skipped when this folder is not a git clone (e.g. downloaded as a ZIP) so the install still works;
// `npm run doctor` then explains that the copy should be cloned instead.
import { execFileSync } from 'node:child_process';

try {
  execFileSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' });
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' });
} catch {
  console.log('Note: this folder is not a git clone, so updates and the commit check are unavailable. Clone the repository instead (README, Part 2).');
}
