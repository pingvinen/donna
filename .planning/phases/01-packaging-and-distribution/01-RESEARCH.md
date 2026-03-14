# Phase 1: Packaging and Distribution - Research

**Researched:** 2026-03-14
**Domain:** npm packaging, CLI installer, Claude Code slash commands
**Confidence:** HIGH

## Summary

Phase 1 creates an npm package (`@pingvinen/donna-assistant`) that installs a stub `donna:setup` slash command into Claude Code and a shared runtime into `~/.donna/`. The technical domain is straightforward: an npm package with a `bin` entry pointing to a Node.js installer script, plus a migration system using numbered JS files. No external dependencies are needed -- Node.js built-in `fs` and `path` modules handle all file operations.

The key technical consideration is that scoped npm packages (`@scope/name`) work with `npx` when the `bin` field name matches the unscoped package name or uses a simple alias. The installer itself is a single-run script (not a long-lived CLI), so the architecture is simple: detect providers, copy files, run migrations, print summary.

**Primary recommendation:** Build as a zero-dependency npm package using only Node.js built-ins (`fs`, `path`, `os`). Target Node.js >= 18 (Claude Code's minimum). Use `fs.cpSync` for file copying and numbered `.cjs` migration files for upgrades.

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

### Claude's Discretion
- Exact banner styling and copy
- Error message wording for edge cases
- Internal installer code structure (how provider detection is implemented)
- Compression/minification of package contents (if any)

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
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins (`fs`, `path`, `os`) | >= 18 | File operations, path resolution, home dir | Zero dependencies, `fs.cpSync` stable since Node 22.3 |

### Supporting
No external dependencies needed. This is a zero-dependency package.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `fs.cpSync` | `fs-extra` | Adds dependency; fs.cpSync is stable and sufficient for Node >= 18 |
| Manual migration runner | `migrate` / `umzug` | Over-engineered for sequential numbered files; custom runner is ~30 lines |
| `chalk` for colors | ANSI escape codes | Zero-dep is worth the minor verbosity; checkmark/cross output is simple |
| `commander`/`yargs` for CLI | None needed | Installer has no CLI arguments -- it just runs |

**Installation:**
```bash
npx @pingvinen/donna-assistant
```

## Architecture Patterns

### Recommended Package Structure
```
donna/
├── package.json            # name: @pingvinen/donna-assistant, bin field
├── bin/
│   └── install.cjs         # Entry point (bin script)
├── src/
│   ├── installer.cjs       # Main installer logic
│   ├── providers/
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
└── references/             # (empty for Phase 1, used in later phases)
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

### Anti-Patterns to Avoid
- **Interactive prompts:** Installer must be fully non-interactive. No readline, no inquirer.
- **Touching user data:** Never modify files outside `~/.donna/` and provider stub directories. Never delete user-created files.
- **Global state assumptions:** Don't assume cwd or env vars. Always resolve paths from `os.homedir()`.
- **Async where sync suffices:** Installer is a one-shot script, not a server. `fs.mkdirSync`, `fs.cpSync`, `fs.writeFileSync` are appropriate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Directory copying | Custom recursive walk | `fs.cpSync(src, dest, { recursive: true })` | Handles symlinks, permissions, edge cases |
| Home directory | `process.env.HOME` parsing | `os.homedir()` | Cross-platform (macOS, Linux, Windows) |
| Path joining | String concatenation | `path.join()` | Handles separators, normalization |
| Directory creation | Check-then-create | `fs.mkdirSync(p, { recursive: true })` | Idempotent, creates parents |

**Key insight:** Node.js built-ins in v18+ cover every file operation this installer needs. Zero dependencies means zero supply chain risk and instant npx execution (no install step beyond the package itself).

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

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `fs-extra.copy()` | `fs.cpSync()` (built-in) | Node 22.3 (June 2024) | No dependency needed for recursive copy |
| `~/.claude/commands/` | `~/.claude/skills/` (also works) | 2025 | Commands still work, skills is the modern name |
| `chalk` for terminal colors | ANSI escape codes or no color | 2024+ | Zero-dep trend for simple CLI tools |

**Deprecated/outdated:**
- `fs-extra`: Still works but unnecessary for Node >= 18 with `fs.cpSync`
- `npx` from npm 5.x: Current npx (npm 7+) has different caching behavior; always test with current npm

## Open Questions

1. **Does `@~/.donna/workflows/setup.md` resolve correctly in Claude Code?**
   - What we know: GSD stubs use `@/absolute/path` (no tilde). The `~` expansion in `@` paths is undocumented.
   - What's unclear: Whether Claude Code expands `~` in `@` prefixed paths or requires absolute paths.
   - Recommendation: During implementation, test with tilde first. If it fails, have the installer write the absolute path (e.g., `@/Users/pingvinen/.donna/workflows/setup.md`) into the stub at install time. This means stubs become machine-specific (generated, not copied verbatim).

2. **Should the installer use `~/.claude/commands/donna/` or `~/.claude/skills/donna/`?**
   - What we know: CONTEXT.md specifies `~/.claude/commands/donna/`. Both `commands/` and `skills/` work in Claude Code. GSD uses `commands/`.
   - What's unclear: Whether `skills/` will eventually replace `commands/` entirely.
   - Recommendation: Use `commands/` as specified in CONTEXT.md. This matches GSD's pattern and the user's decision.

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
- [ ] Test infrastructure: use `node:test` + `node:assert` (built-in, no install needed), tests operate on temp directories to avoid touching real `~/.donna/` or `~/.claude/`

## Sources

### Primary (HIGH confidence)
- npm official docs (package.json bin field, files field, engines): https://docs.npmjs.com/cli/v11/configuring-npm/package-json/
- npx official docs: https://docs.npmjs.com/cli/v11/commands/npx/
- Node.js fs.cpSync stabilized in 22.3.0: https://github.com/nodejs/node/releases/tag/v22.3.0
- Claude Code slash commands docs: https://code.claude.com/docs/en/slash-commands
- GSD reference implementation (local): `~/.claude/commands/gsd/` and `~/.claude/get-shit-done/`

### Secondary (MEDIUM confidence)
- Claude Code requires Node 18+: https://github.com/anthropics/claude-code/issues/8410
- Scoped package npx bin resolution issues: https://github.com/vercel/ai/issues/11401
- Node.js bin scripts guide: https://2ality.com/2022/08/installing-nodejs-bin-scripts.html

### Tertiary (LOW confidence)
- `@~` path resolution in Claude Code stubs -- untested, needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Node.js built-ins are well-documented, zero dependencies simplifies everything
- Architecture: HIGH - Pattern mirrors proven GSD structure, npm packaging is well-understood
- Pitfalls: HIGH - Scoped package npx issues are well-documented; migration ordering is a known problem with known solutions
- `@` path tilde resolution: LOW - Needs runtime validation, may require generating absolute paths in stubs

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable domain, unlikely to change)
