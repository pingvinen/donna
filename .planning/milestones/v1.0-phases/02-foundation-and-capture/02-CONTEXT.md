# Phase 2: Foundation and Capture - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

User can set up the assistant, capture tasks instantly, mark them done, and trust that everything persists in git. Delivers: real donna:setup, donna:add-task, donna:done, hybrid storage structure (daily journals + config), and git-backed persistence. Role definition, recurring tasks, and external tools belong in later phases.

</domain>

<decisions>
## Implementation Decisions

### Setup flow
- Interactive setup using AskUserQuestion — guided flow asking for repo path, confirming structure creation, showing summary
- User points to a local path (existing git repo or empty directory that gets git-initialized)
- Minimal initialization: creates `daily/` folder and `config.md` only — other standing files (role.md, recurring.md, tools.md, people.md) are created by the skills that need them in later phases
- Re-run behavior: detects existing setup, offers update (change repo path), view current config, or reset (start over)
- Bootstrap config stored at `~/.config/donna/config.md` pointing to the storage repo — all other skills read this first

### Daily journal format
- File path: `daily/YYYY-MM-DD.md` (flat folder, no year/month nesting — Obsidian Calendar plugin compatible)
- Simple task checklist: `- [ ] description` lines, no extra metadata per task
- YAML frontmatter included (content at Claude's discretion)
- Sections are minimal in Phase 2 — later phases add carried-forward, recurring, etc.

### Task capture
- `/donna:add-task` takes description as inline argument: `/donna:add-task buy milk`
- If no argument provided, prompts the user for a description
- Appends task as `- [ ] description` to today's daily file
- Creates today's daily file if it doesn't exist (no dependency on begin-the-day)
- Target: under 10 seconds end-to-end including git commit

### Task completion
- `/donna:done` skill with dual mode:
  - With argument: fuzzy-matches against today's open tasks, shows match and asks to confirm before marking `[x]`
  - Without argument: shows numbered multi-select checklist of all open tasks, user checks off completed ones
- Only searches today's daily file (tasks from prior days get carried forward in Phase 3)
- Manual edits in Obsidian/editor also supported — begin-the-day (Phase 3) picks up manual changes

### Git persistence
- Every skill commits changes after writing, using `git -C <repo-path>` (no directory changes)
- Commit message format: conventional commits — `donna(add-task): buy milk`, `donna(done): buy milk`, `donna(setup): initialize storage`
- Push is configurable: `auto_push` setting in config.md, defaults to false (commit-only)
- When auto_push is true, push runs in main context (1Password SSH unlock works)

### Claude's Discretion
- YAML frontmatter fields for daily journal files
- Exact config.md format and fields
- Setup banner and output formatting
- Error handling for edge cases (missing repo, corrupted files)
- How fuzzy matching works in donna:done

</decisions>

<specifics>
## Specific Ideas

- Setup stub already exists at `stubs/claude-code/donna/setup.md` with `@~/.donna/workflows/setup.md` reference — replace hello-world workflow with real setup logic
- Follow Phase 1's checkmark output pattern: `✓ Created daily/ directory`, `✓ Wrote config.md`, etc.
- Conventional commit format matches the project's own PR title convention from Phase 1's CI/CD

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/output.cjs`: banner(), success(), fail(), info() formatting utilities — can be referenced in workflow instructions for consistent output
- `workflows/setup.md`: existing stub workflow to be replaced with real setup logic
- `stubs/claude-code/donna/setup.md`: stub with frontmatter (name, description, allowed-tools) and `@` workflow reference
- `src/installer.cjs`: installer already copies workflows to `~/.donna/workflows/` — new workflow files will be distributed automatically

### Established Patterns
- Stub-workflow split: thin stubs in provider dirs reference shared workflows in `~/.donna/workflows/`
- `@` path resolution for stub→workflow linking
- Silent-with-summary output style (checkmarks, no interactive prompts in installer)
- Version tracking in `~/.donna/version.md`

### Integration Points
- `~/.config/donna/config.md` — new bootstrap config, read by all future skills
- `~/.donna/workflows/` — new workflow files for add-task and done skills
- `stubs/claude-code/donna/` — new stub files for add-task and done skills
- `src/installer.cjs` — may need updates to copy new stubs
- Storage repo `daily/` directory — where daily journal files live

</code_context>

<deferred>
## Deferred Ideas

- `/donna:remove-task` — delete a task from the daily file. Same UX as donna:done (fuzzy match + confirm with arg, multi-select list without). Add to backlog for a future phase.

</deferred>

---

*Phase: 02-foundation-and-capture*
*Context gathered: 2026-03-14*
