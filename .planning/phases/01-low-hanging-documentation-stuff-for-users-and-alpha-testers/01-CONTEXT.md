# Phase 1: Low-hanging documentation stuff for users and alpha testers - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Documentation, developer experience, and lightweight skills that help users and alpha testers get more out of Donna v1.0. No new core features — this is about polish, discoverability, and feedback loops.

</domain>

<decisions>
## Implementation Decisions

### CONTRIBUTING.md
- Create a CONTRIBUTING.md at the repo root
- Covers how a Donna developer can test changes locally (link stubs, run installer in dev mode, etc.)
- Separate from README — README is user-facing, CONTRIBUTING.md is developer-facing

### User-facing changelog
- Changelog is shown during install/upgrade — the installer displays what's new when upgrading
- No separate CHANGELOG.md file needed (installer output is the delivery mechanism)
- Format should be compact and human-friendly — not raw git log, not verbose prose
- Group changes by category (new skills, fixes, improvements) with brief descriptions

### `/donna:help` skill
- Conversational troubleshooting — have a conversation with the user about what they need help with, then try to help them fix the problem
- Not a static command reference — it's interactive and diagnostic
- Should be able to inspect Donna's state (config, storage repo, installed tools) to diagnose issues

### `/donna:contribute-idea` skill
- Interactive skill that helps users submit feature ideas or feedback
- Checks TWO sources for duplicates before creating a new issue:
  1. Existing GitHub Issues in pingvinen/donna (via `gh`)
  2. GSD's pending todos — fetched from GitHub (`.planning/STATE.md` in pingvinen/donna) since the `.planning/` folder doesn't exist in the user's storage repo
- If duplicate found in either source: links to the existing issue or shows the matching todo
- If new: helps the user create (or helps create) a GitHub Issue on pingvinen/donna
- Replaces the original "generate pending TODOs file" idea — GitHub Issues is the right home for feedback

### Claude's Discretion
- Exact structure and sections of CONTRIBUTING.md
- How the installer detects "upgrading" vs "fresh install" for changelog display
- How `/donna:help` inspects state and formulates diagnostic questions
- How `/donna:contribute-idea` searches for duplicate issues (title match, keyword search, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Installer and packaging
- `src/installer.cjs` — Current installer logic, where changelog display would be added
- `src/version.cjs` — Version tracking, needed for detecting upgrades
- `src/migrator.cjs` — Migration system, relevant to upgrade detection

### Existing skill patterns
- `workflows/setup.md` — Reference for skill structure and conventions
- `stubs/claude-code/donna/setup.md` — Reference for stub structure
- `CLAUDE.md` — Project conventions (naming, git, file format, no git from subagents)

### Project context
- `.planning/PROJECT.md` — Constraints, key decisions, distribution model

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/installer.cjs` — Already handles install/upgrade flow; changelog display hooks into this
- `src/version.cjs` — Has version tracking that can detect previous → current version
- `workflows/*.md` — 8 existing skills provide the pattern for new skill workflows
- `stubs/claude-code/donna/*.md` — 8 existing stubs provide the pattern for new skill stubs

### Established Patterns
- Skill = stub (.md in stubs/claude-code/donna/) + workflow (.md in workflows/)
- Installer copies stubs to `~/.claude/commands/donna/` and workflows to `~/.donna/workflows/`
- All skills follow XML-tagged prompt structure with `<process>`, `<success_criteria>`, etc.
- Git commit from main context only (SSH signing constraint)

### Integration Points
- New skills need entries in installer.cjs (file copy list)
- New skills need entries in README.md (command table)
- Changelog display integrates into the existing installer upgrade path

</code_context>

<specifics>
## Specific Ideas

- Changelog shown during install should feel like brew upgrade output — quick scan, not a wall of text
- `/donna:help` should feel like talking to a knowledgeable support person, not reading a manual
- `/donna:contribute-idea` should use `gh` CLI to interact with GitHub Issues

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-low-hanging-documentation-stuff-for-users-and-alpha-testers*
*Context gathered: 2026-03-16*
