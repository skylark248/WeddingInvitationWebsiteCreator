// PreToolUse hook for Edit / MultiEdit / Write / NotebookEdit.
// Lets Claude change only an invite's own files (theme, design, config, progress) and help notes.
import { readInput, block, projectPath, isEditable, protectedReason, isMaintainer } from './lib.mjs';

const input = readInput();
const file = input.tool_input && (input.tool_input.file_path || input.tool_input.notebook_path);
const rel = projectPath(file);

if (rel === null) process.exit(0); // outside the project (e.g. a scratch file) — not ours to judge
if (rel === '.env' || rel.endsWith('/.env')) block(protectedReason('.env'));
if (isMaintainer) process.exit(0);
if (!isEditable(rel)) block(`✋ Not changed: ${protectedReason(rel)}`);
process.exit(0);
