# Phase 1: Packaging and Distribution - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

npm package (`@pingvinen/donna-assistant`) with installer, stub donna:setup skill, version tracking, migration system, and full CI/CD pipeline. Anyone can run `npx @pingvinen/donna-assistant` and get a working stub skill in Claude Code. The deployment pipeline must be in place from day 1 — PRs are validated, releases are created manually with semver, and publishing to npm is automated. Real setup logic comes in Phase 2.

</domain>

<decisions>
## Implementation Decisions

### npm package structure
- Single package: `@pingvinen/donna-assistant` (scoped to @pingvinen)
- Invocation: `npx @pingvinen/donna-assistant`
- Flat-by-type layout: `bin/`, `stubs/`, `workflows/`, `templates/`, `references/`, `migrations/`
- Mirrors GSD's `~/.claude/get-shit-done/` structure for consistency

### Installer behavior
- Silent with summary — no interactive prompts, auto-detects providers, prints checkmark summary of what was done
- Provider-aware: auto-detects installed providers by scanning known directories (e.g., `~/.claude/` for Claude Code)
- All implementation done in an AI-agnostic way — architecture supports multiple providers even though only Claude Code is tested initially
- When no providers detected: install shared runtime to `~/.donna/` anyway, warn that no provider stubs were copied, advise re-running after installing a provider
- No donna:update skill — users update by re-running npx

### Migration strategy
- Numbered JS files: `001-initial.cjs`, `002-rename-config.cjs`, etc.
- Each exports `{ version, description, up(ctx) }` — cumulative execution (v1→v5 runs all intermediate migrations)
- Version tracked in `~/.donna/version.md` (markdown, human-readable) with installed version, last migration number, install/update timestamps
- On failure: stop at failed migration, record last successful migration in version.md, user fixes and re-runs
- Upgrades show brief inline changelog using migration descriptions (1 line per version)

### Stub hello-world scope
- donna:setup stub shows a Donna banner, confirms workflow loaded from `~/.donna/workflows/`, and prints next steps
- Stub reads `~/.donna/version.md` to display installed version — proves full chain: stub resolves workflow, workflow reads runtime files
- Stub uses `@` path to reference workflow: `@~/.donna/workflows/setup.md`
- Stub file lives at `~/.claude/commands/donna/setup.md` with standard frontmatter (name, description)

### CI/CD pipeline
- PR validation: GitHub Actions workflow runs lint and verifies the package builds on every pull request
- Release creation: manually triggered GitHub Actions workflow — determines version bump from conventional commit PR titles, uses semver 0.x.y while pre-stable, generates changelog, creates GitHub release
- Deployment: separate GitHub Actions workflow triggers on release creation, publishes to npm
- Three separate workflows (validate, release, deploy) — single responsibility, clear triggers
- Conventional commits convention applied to PR titles (not individual commits) for version bump determination
- Start at 0.1.0 — stay on 0.x.y until structure is stable to avoid inflated major versions

### Claude's Discretion
- Exact banner styling and copy
- Error message wording for edge cases
- Internal installer code structure (how provider detection is implemented)
- Compression/minification of package contents (if any)
- Specific lint rules and tooling choice (eslint, biome, etc.)
- Changelog format details

</decisions>

<specifics>
## Specific Ideas

- Installer output should follow the checkmark pattern: `✓ Detected Claude Code`, `✓ Copied stubs to ~/.claude/commands/donna/`, etc.
- When upgrading, show version arrow: `Upgrading 1.0.0 → 1.3.0:` followed by migration descriptions
- Failed migrations use `✗` prefix with error message
- Banner style matches GSD aesthetic: `━━━` lines, `DONNA ▸ Setup` header
- Stub message should note "This is a stub — real setup coming in Phase 2"

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code beyond README.md

### Established Patterns
- GSD skill suite as reference architecture: stub files in `~/.claude/commands/gsd/`, workflows in `~/.claude/get-shit-done/workflows/`, `@` path resolution for stub→workflow linking
- GSD stub format: YAML frontmatter (name, description, allowed-tools) + `@` reference to workflow file

### Integration Points
- `~/.claude/commands/donna/` — where Claude Code discovers slash commands
- `~/.donna/` — shared runtime directory (provider-agnostic)
- `~/.donna/version.md` — version tracking file read by both installer and stub

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-packaging-and-distribution*
*Context gathered: 2026-03-14*
