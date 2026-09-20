#!/usr/bin/env node
// PostToolUse hook: after Claude writes or edits a file, auto-format it with
// Prettier and then lint it with ESLint.
//
// How Claude Code talks to this script:
//   - It pipes a JSON object to stdin describing the tool call.
//   - We care about the edited file's path, found at either
//       tool_response.filePath   (present after a successful edit)
//     or
//       tool_input.file_path     (the path Claude asked to edit)
//   - Exit code 0  = success, nothing to report.
//   - Exit code 2  = "blocking error": whatever we print to stderr is fed back
//                    to Claude so it can fix the problem in the same turn.
//   - Any other non-zero code is shown to you (the user) but not to Claude.
//
// We use `npx --no-install <tool>` so this works no matter which package
// manager installed the dependencies (npm, pnpm, or yarn all place the tool
// under node_modules/.bin, which npx finds). --no-install means it never tries
// to download anything.

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

// --- 1. Read the JSON that Claude Code piped to us on stdin -------------------
// fd 0 is stdin. Reading it synchronously keeps this script simple.
let raw = ''
try {
	raw = readFileSync(0, 'utf8')
} catch {
	// No stdin available: nothing to act on.
}

let payload = {}
try {
	payload = JSON.parse(raw || '{}')
} catch {
	// Malformed input: nothing we can act on, so let the edit through.
	process.exit(0)
}

// --- 2. Figure out which file was edited -------------------------------------
const filePath = payload?.tool_response?.filePath || payload?.tool_input?.file_path || ''

// No path, or the file no longer exists (e.g. it was deleted): do nothing.
if (!filePath || !existsSync(filePath)) {
	process.exit(0)
}

// --- 3. Auto-format with Prettier --------------------------------------------
// --ignore-unknown means Prettier silently skips file types it doesn't handle,
// so we can safely pass any edited file. --write fixes the file in place.
spawnSync('npx', ['--no-install', 'prettier', '--write', '--ignore-unknown', filePath], {
	stdio: 'ignore',
	shell: true
})

// --- 4. Lint with ESLint, but only for file types ESLint is configured for ---
const lintable = /\.(svelte|ts|js|mjs|cjs)$/.test(filePath)
if (!lintable) {
	process.exit(0)
}

const eslint = spawnSync('npx', ['--no-install', 'eslint', filePath], {
	encoding: 'utf8',
	shell: true
})

// ESLint exits non-zero when it finds error-level problems (warnings alone do
// NOT trip this). If that happens, hand the report to Claude via stderr + exit 2
// so it gets fixed right away.
if (eslint.status !== 0) {
	const report = `${eslint.stdout || ''}${eslint.stderr || ''}`.trim()
	console.error(`ESLint found problems in ${filePath}:\n\n${report}`)
	process.exit(2)
}

process.exit(0)
