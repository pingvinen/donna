# Phase 1: Packaging and Distribution - Research

**Researched:** 2026-03-14 (updated with CI/CD research)
**Domain:** npm packaging, CLI installer, Claude Code slash commands, GitHub Actions CI/CD
**Confidence:** HIGH

## Summary

Phase 1 creates an npm package (`@pingvinen/donna-assistant`) that installs a stub `donna:setup` slash command into Claude Code and a shared runtime into `~/.donna/`, with a full CI/CD pipeline for validation, release, and deployment. The installer domain is straightforward: an npm package with a `bin` entry pointing to a Node.js installer script, plus a migration system using numbered JS files. No external dependencies are needed for the installer -- Node.js built-in `fs` and `path` modules handle all file operations.

The CI/CD domain uses three separate GitHub Actions workflows: (1) PR validation (lint + build verification), (2) release creation (manually triggered, determines version bump from conventional commit PR titles, creates GitHub release with changelog), and (3) deployment (triggered by release creation, publishes to npm). The key architectural decision is using squash merges so PR titles become commit messages, which are then parsed by conventional commit tooling to determine semver bumps.

npm trusted publishing via OIDC is the current standard (classic tokens were revoked December 2025). This requires `id-token: write` permission and npm CLI >= 11.5.1. For the release workflow, a lightweight script approach is recommended over heavy tools like release-please, since the user wants manual trigger control rather than automated release PRs.

**Primary recommendation:** Build the installer as a zero-dependency npm package using only Node.js built-ins. Use three GitHub Actions workflows with `amannn/action-semantic-pull-request` for PR title linting, a custom `workflow_dispatch` script for release creation (reads merged PR titles since last tag to determine bump), and npm trusted publishing via OIDC for deployment.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single package: `@pingvinen/donna-assistant` (scoped to @pingvinen)
- Invocation: `npx @pingvinen/donna-assistant`
- Flat-by-type layout: `bin/`, `stubs/`, `workflows/`, `templates/`, `references/`, `migrations/`
- Silent with summary -- no interactive prompts, auto-detects providers, prints checkmark summary
- Provider-aware: auto-detects installed providers by scanning known directories
- All implementation done in an AI-agnostic way -- architecture supports multiple providers
- When no providers detected: install shared runtime anyway, warn, advise re-running
- No donna:update skill -- users update by re-running npx
- Numbered JS migration files: `001-initial.cjs`, `002-rename-config.cjs`, etc.
- Each migration exports `{ version, description, up(ctx) }`
- Version tracked in `~/.donna/version.md` (markdown, human-readable)
- On migration failure: stop at failed migration, record last successful, user fixes and re-runs
- Upgrades show brief inline changelog using migration descriptions
- donna:setup stub shows Donna banner, confirms workflow loaded, prints next steps
- Stub reads `~/.donna/version.md` to display installed version
- Stub uses `@` path to reference workflow: `@~/.donna/workflows/setup.md`
- Stub file lives at `~/.claude/commands/donna/setup.md`
- CI/CD: Three separate workflows (validate, release, deploy) -- single responsibility, clear triggers
- CI/CD: PR validation runs lint and verifies the package builds on every pull request
- CI/CD: Release creation is manually triggered, determines version bump from conventional commit PR titles
- CI/CD: Conventional commits convention applied to PR titles (not individual commits)
- CI/CD: Start at 0.1.0, stay on 0.x.y until structure is stable
- CI/CD: Deployment workflow triggers on release creation, publishes to npm
- Specific lint rules and tooling choice is Claude's discretion

### Claude's Discretion
- Exact banner styling and copy
- Error message wording for edge cases
- Internal installer code structure (how provider detection is implemented)
- Compression/minification of package contents (if any)
- Specific lint rules and tooling choice (eslint, biome, etc.)
- Changelog format details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIST-01 | Installer via `npx @pingvinen/donna-assistant` -- detects providers, copies stubs + runtime | npm bin field, fs.cpSync, provider detection pattern |
| DIST-02 | `~/.donna/version.md` tracks version; installer shows changelog on upgrade | Markdown version file format, migration description aggregation |
| DIST-03 | Migration system handles cumulative upgrades from any previous version | Numbered .cjs files with `{ version, description, up(ctx) }` exports |
| DIST-04 | Installer is idempotent and safe to re-run -- preserves user state | File existence checks, overwrite-only for managed files |
| DIST-05 | npm package contains stubs, workflows, templates, references, installer | package.json `files` field, flat-by-type layout |
| DIST-06 | `donna:setup` stub + workflow with hello-world implementation | GSD stub format (YAML frontmatter + `@` path), workflow markdown |
| DIST-07 | PR validation workflow -- lint + build verification on every PR | GitHub Actions `pull_request` trigger, Biome for linting, `npm pack --dry-run` for build verification |
| DIST-08 | Release creation workflow -- manually triggered, conventional commit version bump, changelog, GitHub release | `workflow_dispatch` trigger, git log parsing for PR titles, `gh release create` |
| DIST-09 | Deployment workflow -- publishes to npm on GitHub release creation | `release: [published]` trigger, npm trusted publishing via OIDC, `--provenance --access public` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins (`fs`, `path`, `os`) | >= 18 | File operations, path resolution, home dir | Zero dependencies, `fs.cpSync` stable since Node 22.3 |
| GitHub Actions | N/A | CI/CD pipeline | Native to GitHub, no external CI service |
| `actions/checkout` | v5 | Checkout repo in workflows | Official GitHub action |
| `actions/setup-node` | v4 | Configure Node.js + npm registry | Official GitHub action, handles registry auth |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@biomejs/biome` | latest | Linting + formatting | PR validation workflow; fast, zero-config, replaces ESLint + Prettier |
| `amannn/action-semantic-pull-request` | v6 | Enforce conventional commit format on PR titles | PR validation workflow; ensures PR titles follow feat:/fix:/etc. convention |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `fs.cpSync` | `fs-extra` | Adds dependency; fs.cpSync is stable and sufficient for Node >= 18 |
| Manual migration runner | `migrate` / `umzug` | Over-engineered for sequential numbered files; custom runner is ~30 lines |
| `chalk` for colors | ANSI escape codes | Zero-dep is worth the minor verbosity; checkmark/cross output is simple |
| `commander`/`yargs` for CLI | None needed | Installer has no CLI arguments -- it just runs |
| Biome | ESLint + Prettier | ESLint requires more config; Biome is faster and handles both linting + formatting |
| Custom release script | release-please | release-please creates auto-updating release PRs; user wants manual trigger with more control |
| Custom release script | semantic-release | semantic-release auto-publishes on every push; user wants explicit manual trigger |
| npm trusted publishing (OIDC) | NPM_TOKEN secret | Classic tokens revoked Dec 2025; OIDC is the current standard, more secure |

**Installation:**
```bash
npx @pingvinen/donna-assistant
```

**Dev dependencies (for CI/CD):**
```bash
npm install --save-dev @biomejs/biome
```

## Architecture Patterns

### Recommended Package Structure
```
donna/
├── package.json            # name: @pingvinen/donna-assistant, bin field
├── biome.json              # Biome linting config
├── bin/
│   └── install.cjs         # Entry point (bin script)
├── src/
│   ├── installer.cjs       # Main installer logic
│   ├── providers/
│   │   ├── index.cjs       # Provider aggregator
│   │   └── claude-code.cjs # Claude Code provider detection + stub copying
│   ├── migrator.cjs        # Migration runner
│   └── output.cjs          # Console output helpers (checkmarks, banners)
├── stubs/
│   └── claude-code/
│       └── donna/
│           └── setup.md    # Stub: copied to ~/.claude/commands/donna/setup.md
├── workflows/
│   └── setup.md            # Workflow: copied to ~/.donna/workflows/setup.md
├── migrations/
│   └── 001-initial.cjs     # First migration (creates directory structure)
├── templates/              # (empty for Phase 1, used in later phases)
├── references/             # (empty for Phase 1, used in later phases)
├── .github/
│   └── workflows/
│       ├── validate.yml    # DIST-07: PR validation (lint + build check)
│       ├── release.yml     # DIST-08: Manual release creation
│       └── deploy.yml      # DIST-09: npm publish on release
└── scripts/
    └── determine-bump.cjs  # Reads merged PR titles, outputs version bump type
```

### Pattern 1: Provider Detection
**What:** Auto-detect installed AI coding assistants by checking known directories.
**When to use:** During installation to determine which provider stubs to copy.
**Example:**
```javascript
// Provider detection - check if directory exists
const PROVIDERS = [
  {
    name: 'Claude Code',
    detect: () => fs.existsSync(path.join(os.homedir(), '.claude')),
    stubSource: path.join(__dirname, '..', 'stubs', 'claude-code'),
    stubTarget: path.join(os.homedir(), '.claude', 'commands'),
  },
  // Future providers added here
];

function detectProviders() {
  return PROVIDERS.filter(p => p.detect());
}
```

### Pattern 2: Stub Format (GSD Reference)
**What:** Claude Code slash command stub with YAML frontmatter and `@` path resolution.
**When to use:** For the `donna:setup` stub file.
**Example:**
```markdown
---
name: donna:setup
description: Set up Donna assistant for this machine
allowed-tools:
  - Read
  - Bash
---

<objective>
Run the Donna setup workflow.
</objective>

<execution_context>
@~/.donna/workflows/setup.md
</execution_context>
```

### Pattern 3: Migration File Format
**What:** Numbered CommonJS files with standardized exports.
**When to use:** For every schema/structure change across versions.
**Example:**
```javascript
// migrations/001-initial.cjs
module.exports = {
  version: '0.1.0',
  description: 'Initial directory structure and version file',
  up(ctx) {
    // ctx.donnaDir = ~/.donna/
    // ctx.fs, ctx.path available
    const dirs = ['workflows', 'templates', 'references'];
    for (const dir of dirs) {
      fs.mkdirSync(path.join(ctx.donnaDir, dir), { recursive: true });
    }
  }
};
```

### Pattern 4: Version File Format
**What:** Human-readable markdown tracking installation state.
**When to use:** Written by installer, read by stubs and migrator.
**Example:**
```markdown
# Donna

- **Version:** 0.1.0
- **Last migration:** 001
- **Installed:** 2026-03-14T10:00:00Z
- **Updated:** 2026-03-14T10:00:00Z
```

### Pattern 5: Installer Output
**What:** Silent execution with checkmark summary.
**Example output (fresh install):**
```
━━━ DONNA ━━━

  ✓ Created ~/.donna/
  ✓ Detected Claude Code
  ✓ Copied donna:setup to ~/.claude/commands/donna/
  ✓ Installed workflows to ~/.donna/workflows/
  ✓ Version 0.1.0 installed

  Run /donna:setup in Claude Code to get started.
```
**Example output (upgrade):**
```
━━━ DONNA ━━━

  Upgrading 0.1.0 → 0.3.0:
    • 002: Added templates directory
    • 003: Renamed config format

  ✓ Updated stubs in ~/.claude/commands/donna/
  ✓ Updated workflows in ~/.donna/workflows/
  ✓ Version 0.3.0 installed
```

### Pattern 6: Three-Workflow CI/CD Architecture
**What:** Separate GitHub Actions workflows for validation, release, and deployment.
**Why:** Single responsibility -- each workflow has one trigger, one job. Changes to lint rules don't affect deployment. Release logic is isolated from publishing.

```
PR opened/updated → validate.yml (lint + build check)
Manual trigger → release.yml (determine bump, create release)
Release published → deploy.yml (publish to npm)
```

### Pattern 7: PR Title Conventional Commits with Squash Merge
**What:** Enforce conventional commit format on PR titles; configure repo for squash merge so PR title becomes the commit message.
**Why:** This is how the version bump is determined -- merged PR titles are parsed to find feat:/fix:/etc. prefixes.
**Critical prerequisite:** The GitHub repo must be configured to use squash merges with PR title as default commit message.

### Anti-Patterns to Avoid
- **Interactive prompts:** Installer must be fully non-interactive. No readline, no inquirer.
- **Touching user data:** Never modify files outside `~/.donna/` and provider stub directories. Never delete user-created files.
- **Global state assumptions:** Don't assume cwd or env vars. Always resolve paths from `os.homedir()`.
- **Async where sync suffices:** Installer is a one-shot script, not a server. `fs.mkdirSync`, `fs.cpSync`, `fs.writeFileSync` are appropriate.
- **Storing npm tokens as secrets:** Classic tokens were revoked Dec 2025. Use OIDC trusted publishing instead.
- **Combining CI/CD concerns:** Don't merge lint, release, and deploy into one workflow. They have different triggers and different failure modes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Directory copying | Custom recursive walk | `fs.cpSync(src, dest, { recursive: true })` | Handles symlinks, permissions, edge cases |
| Home directory | `process.env.HOME` parsing | `os.homedir()` | Cross-platform (macOS, Linux, Windows) |
| Path joining | String concatenation | `path.join()` | Handles separators, normalization |
| Directory creation | Check-then-create | `fs.mkdirSync(p, { recursive: true })` | Idempotent, creates parents |
| Linting | Custom rules | `@biomejs/biome` | Fast, zero-config defaults, replaces ESLint + Prettier |
| PR title validation | Regex in a custom action | `amannn/action-semantic-pull-request@v6` | Battle-tested, used by Electron/Vite/47k+ repos |
| npm authentication | Token management | OIDC trusted publishing | Classic tokens revoked; OIDC is the current standard |

**Key insight:** Node.js built-ins in v18+ cover every file operation this installer needs. Zero dependencies means zero supply chain risk and instant npx execution. For CI/CD, use existing GitHub Actions rather than building custom validation.

## Common Pitfalls

### Pitfall 1: Scoped Package npx Resolution
**What goes wrong:** `npx @scope/package` fails to find the binary if `bin` field naming is wrong.
**Why it happens:** npx matches the bin name against the package name. For scoped packages, the bin name should be the unscoped portion or explicitly mapped.
**How to avoid:** In package.json, set `"bin": { "donna-assistant": "./bin/install.cjs" }` -- npx resolves `@pingvinen/donna-assistant` to the `donna-assistant` bin entry.
**Warning signs:** `sh: donna-assistant: command not found` when running npx.

### Pitfall 2: Overwriting User State on Re-install
**What goes wrong:** Re-running the installer destroys user customizations or data.
**Why it happens:** Blindly copying all files without checking what's managed vs user-created.
**How to avoid:** Only overwrite files that are "managed" by donna (stubs, workflows, version.md). Never touch files the user created. The managed file list should be explicit.
**Warning signs:** User reports lost configuration after update.

### Pitfall 3: Migration Ordering Assumptions
**What goes wrong:** Migrations run out of order or skip entries.
**Why it happens:** Using filesystem readdir which may not sort numerically (e.g., "10" before "2").
**How to avoid:** Read migration files, sort by numeric prefix (`parseInt(filename)`), then execute sequentially.
**Warning signs:** Migration "010" runs before "002".

### Pitfall 4: Shebang Line Missing
**What goes wrong:** `npx @pingvinen/donna-assistant` fails with permission error or tries to run as shell script.
**Why it happens:** Missing `#!/usr/bin/env node` at top of bin entry file.
**How to avoid:** Always include shebang as first line of `bin/install.cjs`.
**Warning signs:** `SyntaxError: Unexpected token` or permission denied.

### Pitfall 5: File Permissions on npm Publish
**What goes wrong:** Bin script is not executable after npm install.
**Why it happens:** npm preserves file permissions from the publishing machine. If bin script lacks +x, it fails.
**How to avoid:** Ensure `chmod +x bin/install.cjs` before publishing. Or add a `prepublishOnly` script.
**Warning signs:** `EACCES: permission denied` when running npx.

### Pitfall 6: `@` Path Resolution in Stubs
**What goes wrong:** The `@~/.donna/workflows/setup.md` path doesn't resolve correctly.
**Why it happens:** The `@` prefix is Claude Code's path resolution syntax. The `~` must expand to the actual home directory. This may work differently than GSD's `@/absolute/path` pattern.
**How to avoid:** Test with both `@~/.donna/workflows/setup.md` and `@/Users/username/.donna/workflows/setup.md` to determine which Claude Code supports. The installer may need to write the absolute path into the stub at install time.
**Warning signs:** Claude Code says "file not found" when running `/donna:setup`.

### Pitfall 7: npm Trusted Publishing OIDC Misconfiguration
**What goes wrong:** `npm publish` fails with authentication error in GitHub Actions.
**Why it happens:** Missing `id-token: write` permission, outdated npm CLI (< 11.5.1), or trust relationship not configured on npmjs.com.
**How to avoid:** (1) Set `permissions.id-token: write` in the deploy workflow. (2) Install latest npm before publishing: `npm install -g npm@latest`. (3) Configure trusted publisher on npmjs.com/package/@pingvinen/donna-assistant/access specifying the exact workflow filename and repo.
**Warning signs:** `ENEEDAUTH` or `npm error code E401` during publish step.

### Pitfall 8: Scoped Package Requires --access public
**What goes wrong:** `npm publish` fails for scoped package with "You must sign up for private packages" error.
**Why it happens:** Scoped packages default to private on npm. Public publishing requires explicit `--access public` flag.
**How to avoid:** Always use `npm publish --provenance --access public` for scoped packages. Or set `"publishConfig": { "access": "public" }` in package.json.
**Warning signs:** `E402 Payment Required` or private packages error.

### Pitfall 9: Release Workflow Version Determination Failure
**What goes wrong:** Release script can't determine version bump because no conventional commit PR titles found since last tag.
**Why it happens:** PRs were merged without conventional commit titles, or the repo isn't configured for squash merge with PR title as commit message.
**How to avoid:** (1) Enforce PR title format with `action-semantic-pull-request`. (2) Configure repo branch protection to require squash merge with PR title as commit message. (3) Release script should have a fallback or clear error when no relevant commits found.
**Warning signs:** Release workflow succeeds but creates no release, or bumps version incorrectly.

### Pitfall 10: First npm Publish Requires Manual Setup
**What goes wrong:** OIDC trusted publishing can't be configured until the package exists on npm.
**Why it happens:** You configure trusted publishers on an existing package's access page. For a brand new package, there's a chicken-and-egg problem.
**How to avoid:** The very first publish must be done manually: `npm login && npm publish --access public`. After that, configure OIDC trusted publishing on npmjs.com. Document this as a one-time setup step.
**Warning signs:** First CI/CD deploy fails because trusted publisher isn't configured yet.

## Code Examples

### package.json Structure
```json
{
  "name": "@pingvinen/donna-assistant",
  "version": "0.1.0",
  "description": "Donna - your personal assistant for Claude Code",
  "bin": {
    "donna-assistant": "./bin/install.cjs"
  },
  "files": [
    "bin/",
    "src/",
    "stubs/",
    "workflows/",
    "migrations/",
    "templates/",
    "references/"
  ],
  "engines": {
    "node": ">=18"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "test": "node --test test/",
    "prepublishOnly": "chmod +x bin/install.cjs"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0"
  },
  "keywords": ["claude-code", "assistant", "productivity"],
  "license": "MIT"
}
```

### Bin Entry Point (bin/install.cjs)
```javascript
#!/usr/bin/env node
'use strict';

const { run } = require('../src/installer.cjs');

run().catch(err => {
  console.error('\n  ✗ Installation failed:', err.message);
  process.exit(1);
});
```

### Migration Runner Core Logic
```javascript
function runMigrations(donnaDir, lastMigration) {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.cjs'))
    .sort((a, b) => parseInt(a) - parseInt(b));

  const pending = files.filter(f => parseInt(f) > lastMigration);
  const results = [];

  for (const file of pending) {
    const migration = require(path.join(migrationsDir, file));
    try {
      migration.up({ donnaDir, fs, path, os });
      results.push({ num: parseInt(file), description: migration.description, ok: true });
    } catch (err) {
      results.push({ num: parseInt(file), description: migration.description, ok: false, error: err });
      break; // Stop on first failure
    }
  }

  return results;
}
```

### Version File Read/Write
```javascript
function readVersion(donnaDir) {
  const versionPath = path.join(donnaDir, 'version.md');
  if (!fs.existsSync(versionPath)) return null;

  const content = fs.readFileSync(versionPath, 'utf8');
  const version = content.match(/\*\*Version:\*\* (.+)/)?.[1] || '0.0.0';
  const lastMigration = parseInt(content.match(/\*\*Last migration:\*\* (\d+)/)?.[1] || '0');
  return { version, lastMigration };
}

function writeVersion(donnaDir, version, lastMigration) {
  const now = new Date().toISOString();
  const content = `# Donna\n\n- **Version:** ${version}\n- **Last migration:** ${String(lastMigration).padStart(3, '0')}\n- **Installed:** ${now}\n- **Updated:** ${now}\n`;
  fs.writeFileSync(path.join(donnaDir, 'version.md'), content);
}
```

### GitHub Actions: PR Validation (validate.yml) -- DIST-07
```yaml
name: Validate PR

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: read

jobs:
  lint-pr-title:
    name: Lint PR title
    runs-on: ubuntu-latest
    steps:
      - uses: amannn/action-semantic-pull-request@v6
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            chore
            refactor
            test
            ci

  validate:
    name: Lint and build check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm pack --dry-run
```

### GitHub Actions: Release Creation (release.yml) -- DIST-08
```yaml
name: Create Release

on:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  release:
    name: Determine version and create release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0  # Full history for tag comparison

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Determine version bump
        id: bump
        run: node scripts/determine-bump.cjs

      - name: Update package.json version
        run: npm version ${{ steps.bump.outputs.new_version }} --no-git-tag-version

      - name: Generate changelog
        id: changelog
        run: node scripts/generate-changelog.cjs

      - name: Commit version bump
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add package.json
          git commit -m "chore: release ${{ steps.bump.outputs.new_version }}"
          git push

      - name: Create GitHub release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh release create "v${{ steps.bump.outputs.new_version }}" \
            --title "v${{ steps.bump.outputs.new_version }}" \
            --notes "${{ steps.changelog.outputs.changelog }}"
```

### GitHub Actions: Deploy to npm (deploy.yml) -- DIST-09
```yaml
name: Deploy to npm

on:
  release:
    types: [published]

permissions:
  contents: read
  id-token: write  # Required for OIDC trusted publishing

jobs:
  publish:
    name: Publish to npm
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          ref: ${{ github.event.release.tag_name }}

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'

      - run: npm install -g npm@latest  # Ensure npm >= 11.5.1 for OIDC

      - run: npm ci

      - run: npm test

      - run: npm publish --provenance --access public
```

### Version Bump Determination Script (scripts/determine-bump.cjs)
```javascript
#!/usr/bin/env node
'use strict';

// Reads merged commit messages (squash-merged PR titles) since last tag
// Outputs: bump type (patch/minor/major) and new version

const { execSync } = require('child_process');
const pkg = require('../package.json');

// Get last tag, or use initial commit if no tags
let lastTag;
try {
  lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
} catch {
  lastTag = execSync('git rev-list --max-parents=0 HEAD', { encoding: 'utf8' }).trim();
}

// Get commit messages since last tag
const log = execSync(`git log ${lastTag}..HEAD --pretty=format:"%s"`, { encoding: 'utf8' });
const messages = log.split('\n').filter(Boolean);

if (messages.length === 0) {
  console.error('No commits found since last tag. Nothing to release.');
  process.exit(1);
}

// Determine bump type from conventional commit prefixes
let bump = 'patch';
for (const msg of messages) {
  if (msg.includes('BREAKING CHANGE') || /^[a-z]+(\(.+\))?!:/.test(msg)) {
    bump = 'major';
    break;
  }
  if (/^feat(\(.+\))?:/.test(msg)) {
    bump = 'minor';
  }
}

// For 0.x.y: breaking changes bump minor, not major (semver pre-1.0 convention)
if (bump === 'major' && pkg.version.startsWith('0.')) {
  bump = 'minor';
}

// Calculate new version
const [major, minor, patch] = pkg.version.split('.').map(Number);
let newVersion;
switch (bump) {
  case 'major': newVersion = `${major + 1}.0.0`; break;
  case 'minor': newVersion = `${major}.${minor + 1}.0`; break;
  case 'patch': newVersion = `${major}.${minor}.${patch + 1}`; break;
}

// Set GitHub Actions output
const fs = require('fs');
fs.appendFileSync(process.env.GITHUB_OUTPUT, `bump=${bump}\n`);
fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_version=${newVersion}\n`);

console.log(`Bump: ${bump} (${pkg.version} -> ${newVersion})`);
console.log(`Commits analyzed: ${messages.length}`);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `fs-extra.copy()` | `fs.cpSync()` (built-in) | Node 22.3 (June 2024) | No dependency needed for recursive copy |
| `~/.claude/commands/` | `~/.claude/skills/` (also works) | 2025 | Commands still work, skills is the modern name |
| `chalk` for terminal colors | ANSI escape codes or no color | 2024+ | Zero-dep trend for simple CLI tools |
| npm classic tokens | OIDC trusted publishing | Dec 2025 (tokens revoked) | Must use OIDC; classic tokens no longer work |
| `NPM_TOKEN` secret in CI | `id-token: write` permission | Dec 2025 | No secrets to manage; OIDC handles auth |
| `npm publish` | `npm publish --provenance` | 2024+ | Supply chain security; provenance attestation |
| ESLint + Prettier | Biome | 2024+ | Single tool, faster, less config |

**Deprecated/outdated:**
- `fs-extra`: Still works but unnecessary for Node >= 18 with `fs.cpSync`
- `npx` from npm 5.x: Current npx (npm 7+) has different caching behavior; always test with current npm
- npm classic tokens: Permanently revoked December 2025; all CI must use OIDC or granular tokens
- npm granular tokens: Max 90 days validity, require 2FA; OIDC is simpler for CI

## Open Questions

1. **Does `@~/.donna/workflows/setup.md` resolve correctly in Claude Code?**
   - What we know: GSD stubs use `@/absolute/path` (no tilde). The `~` expansion in `@` paths is undocumented.
   - What's unclear: Whether Claude Code expands `~` in `@` prefixed paths or requires absolute paths.
   - Recommendation: During implementation, test with tilde first. If it fails, have the installer write the absolute path (e.g., `@/Users/pingvinen/.donna/workflows/setup.md`) into the stub at install time. This means stubs become machine-specific (generated, not copied verbatim).

2. **Should the installer use `~/.claude/commands/donna/` or `~/.claude/skills/donna/`?**
   - What we know: CONTEXT.md specifies `~/.claude/commands/donna/`. Both `commands/` and `skills/` work in Claude Code. GSD uses `commands/`.
   - What's unclear: Whether `skills/` will eventually replace `commands/` entirely.
   - Recommendation: Use `commands/` as specified in CONTEXT.md. This matches GSD's pattern and the user's decision.

3. **First npm publish requires manual setup for OIDC**
   - What we know: OIDC trusted publishing is configured per-package on npmjs.com. The package must exist first.
   - What's unclear: Exact timing of when to do the manual first publish.
   - Recommendation: Document as a one-time setup step. First publish: `npm login && npm publish --access public`. Then configure OIDC on npmjs.com for subsequent automated publishes.

4. **GitHub repo squash merge configuration**
   - What we know: The release workflow depends on PR titles becoming commit messages via squash merge.
   - What's unclear: Whether the repo is already configured for squash merge.
   - Recommendation: Document as a prerequisite. The repo must be configured: Settings > General > Pull Requests > "Allow squash merging" (checked), with "Default to pull request title" selected as the default commit message.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) + assert |
| Config file | none -- see Wave 0 |
| Quick run command | `node --test test/` |
| Full suite command | `node --test test/` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIST-01 | Installer detects providers and copies files | integration | `node --test test/installer.test.cjs -t "install"` | Wave 0 |
| DIST-02 | version.md created/read with correct format | unit | `node --test test/version.test.cjs` | Wave 0 |
| DIST-03 | Migrations run cumulatively, stop on failure | unit | `node --test test/migrator.test.cjs` | Wave 0 |
| DIST-04 | Re-run is idempotent, preserves user state | integration | `node --test test/installer.test.cjs -t "idempotent"` | Wave 0 |
| DIST-05 | Package contains all required files | unit | `node --test test/package.test.cjs` | Wave 0 |
| DIST-06 | Stub + workflow exist and have correct format | unit | `node --test test/stubs.test.cjs` | Wave 0 |
| DIST-07 | PR validation workflow file exists and is valid YAML | unit | `node --test test/workflows.test.cjs` | Wave 0 |
| DIST-08 | Release script determines correct bump type | unit | `node --test test/determine-bump.test.cjs` | Wave 0 |
| DIST-09 | Deploy workflow file exists and has correct triggers | unit | `node --test test/workflows.test.cjs` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/`
- **Per wave merge:** `node --test test/`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/installer.test.cjs` -- covers DIST-01, DIST-04 (integration tests using temp dirs)
- [ ] `test/version.test.cjs` -- covers DIST-02 (version file read/write)
- [ ] `test/migrator.test.cjs` -- covers DIST-03 (migration runner logic)
- [ ] `test/package.test.cjs` -- covers DIST-05 (validates package.json files field)
- [ ] `test/stubs.test.cjs` -- covers DIST-06 (stub format validation)
- [ ] `test/workflows.test.cjs` -- covers DIST-07, DIST-09 (validates workflow YAML files exist with correct triggers/permissions)
- [ ] `test/determine-bump.test.cjs` -- covers DIST-08 (version bump determination logic)
- [ ] Test infrastructure: use `node:test` + `node:assert` (built-in, no install needed), tests operate on temp directories to avoid touching real `~/.donna/` or `~/.claude/`

## Sources

### Primary (HIGH confidence)
- GitHub Docs: [Publishing Node.js packages](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages) - workflow YAML for npm publish on release
- npm Docs: [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers/) - OIDC setup
- npm Docs: [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements/) - --provenance flag
- GitHub: [action-semantic-pull-request v6](https://github.com/amannn/action-semantic-pull-request) - PR title validation
- GitHub: [release-please-action](https://github.com/googleapis/release-please-action) - conventional commit parsing reference (not used directly)
- npm official docs (package.json bin/files/engines fields): https://docs.npmjs.com/cli/v11/configuring-npm/package-json/

### Secondary (MEDIUM confidence)
- [npm trusted publishing setup guide](https://remarkablemark.org/blog/2025/12/19/npm-trusted-publishing/) - step-by-step OIDC setup, verified against official docs
- [npm trusted publishing gotchas](https://philna.sh/blog/2026/01/28/trusted-publishing-npm/) - common failure modes, npm CLI version requirements
- [GitHub blog: npm OIDC GA](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) - OIDC generally available July 2025
- GitHub community discussion on squash merge + PR titles - confirms PR title becomes commit message

### Tertiary (LOW confidence)
- `@~` path resolution in Claude Code stubs -- untested, needs validation during implementation
- Biome version recommendation (^1.9.0) -- verify latest at implementation time

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Node.js built-ins are well-documented, zero dependencies simplifies everything
- Architecture: HIGH - Pattern mirrors proven GSD structure, npm packaging is well-understood
- CI/CD workflows: HIGH - GitHub Actions patterns well-documented, OIDC trusted publishing is the current standard
- Pitfalls: HIGH - Scoped package npx issues and OIDC setup gotchas are well-documented
- `@` path tilde resolution: LOW - Needs runtime validation, may require generating absolute paths in stubs

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable domain, unlikely to change)
