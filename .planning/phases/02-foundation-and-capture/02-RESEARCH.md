# Phase 2: Foundation and Capture - Research

**Researched:** 2026-03-14
**Domain:** Claude Code workflow files, git shell operations, Markdown file authoring, Node.js stdlib
**Confidence:** HIGH

## Summary

Phase 2 builds the first real skills: `donna:setup`, `donna:add-task`, and `donna:done`. All three follow the established stub-workflow split pattern already proven in Phase 1. The implementation is entirely in plain Markdown workflow files (no new Node.js source modules needed) — Claude Code reads workflow files at runtime, executes their steps, and uses `Bash` tool calls for git operations.

The key technical challenge is that workflows run inside Claude Code with access to a fixed set of allowed tools. Every skill needs `Read`, `Write`, `Bash`, and `AskUserQuestion` (for setup and done). Git operations must use `git -C <repo-path>` to avoid changing the working directory. The bootstrap config at `~/.config/donna/config.md` is the linchpin — all skills read it first before doing anything.

The secondary challenge is the installer. It currently hardcodes a success message referencing only `donna:setup`. When new stubs are added, the installer output must be updated and the stubs test must be extended to cover the new files.

**Primary recommendation:** Author three workflow files (`setup.md`, `add-task.md`, `done.md`) and three stubs, extend the installer success message, and add unit tests that verify file structure and content invariants — matching the test pattern already established in Phase 1.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Setup flow**
- Interactive setup using AskUserQuestion — guided flow asking for repo path, confirming structure creation, showing summary
- User points to a local path (existing git repo or empty directory that gets git-initialized)
- Minimal initialization: creates `daily/` folder and `config.md` only — other standing files (role.md, recurring.md, tools.md, people.md) are created by the skills that need them in later phases
- Re-run behavior: detects existing setup, offers update (change repo path), view current config, or reset (start over)
- Bootstrap config stored at `~/.config/donna/config.md` pointing to the storage repo — all other skills read this first

**Daily journal format**
- File path: `daily/YYYY-MM-DD.md` (flat folder, no year/month nesting — Obsidian Calendar plugin compatible)
- Simple task checklist: `- [ ] description` lines, no extra metadata per task
- YAML frontmatter included (content at Claude's discretion)
- Sections are minimal in Phase 2 — later phases add carried-forward, recurring, etc.

**Task capture**
- `/donna:add-task` takes description as inline argument: `/donna:add-task buy milk`
- If no argument provided, prompts the user for a description
- Appends task as `- [ ] description` to today's daily file
- Creates today's daily file if it doesn't exist (no dependency on begin-the-day)
- Target: under 10 seconds end-to-end including git commit

**Task completion**
- `/donna:done` skill with dual mode:
  - With argument: fuzzy-matches against today's open tasks, shows match and asks to confirm before marking `[x]`
  - Without argument: shows numbered multi-select checklist of all open tasks, user checks off completed ones
- Only searches today's daily file (tasks from prior days get carried forward in Phase 3)
- Manual edits in Obsidian/editor also supported — begin-the-day (Phase 3) picks up manual changes

**Git persistence**
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

### Deferred Ideas (OUT OF SCOPE)
- `/donna:remove-task` — delete a task from the daily file. Same UX as donna:done (fuzzy match + confirm with arg, multi-select list without). Add to backlog for a future phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SETUP-01 | User can run `/donna:setup` to configure the storage repo path, initialize the file structure, and store bootstrap config at `~/.config/donna/config.md` | Workflow file pattern established; AskUserQuestion tool available; XDG config dir creation via Bash |
| SETUP-02 | System creates and maintains bootstrap config (`~/.config/donna/config.md`) pointing to the storage repo — all other skills read this first | Plain Markdown format; skills use Read tool on this path before acting |
| TASK-01 | User can run `/donna:add-task <description>` to capture a task in a single command — written to today's daily journal and committed in < 10 seconds | Workflow reads config, appends line to file, runs `git -C <path> add && commit`; inline arg available in workflow context |
| TASK-02 | User can mark a task as complete, updating the daily journal and committing the change | donna:done workflow; text replace `- [ ]` → `- [x]`; git commit |
| STORE-01 | All state persists as markdown files in configured git repo: daily journals (`daily/YYYY-MM-DD.md`) + standing files | Daily file path pattern; flat structure for Obsidian Calendar compatibility |
| STORE-02 | Every skill commits its changes to git immediately after writing | `git -C <repo-path> add -A && git -C <repo-path> commit -m "..."` pattern |
</phase_requirements>

---

## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Node.js `node:fs` | stdlib | Read/write Markdown files in installer tests | Already in use across all test files |
| Node.js `node:test` | stdlib (v18+) | Test framework | Already established; all tests use it |
| Node.js `node:assert/strict` | stdlib | Assertions in tests | Already established |
| `git -C <path>` | system git | Run git without cd | Avoids directory-change side effects |
| Claude Code `Bash` tool | runtime | Execute shell commands inside workflow | Available in all skills |
| Claude Code `Read` tool | runtime | Read files inside workflow | Available in all skills |
| Claude Code `Write` tool | runtime | Write files inside workflow | Available in all skills |
| Claude Code `AskUserQuestion` tool | runtime | Interactive prompts in workflow | Available; used for setup and done |

### Supporting
| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| `@biomejs/biome` | ^1.9.0 | Lint/format CJS files | Any new `.cjs` source files |
| XDG config dir (`~/.config/donna/`) | OS convention | Bootstrap config location | Created by setup skill, read by all skills |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `git -C <path>` | `cd <path> && git ...` | cd changes shell state — not safe in multi-step Bash calls |
| Flat `daily/` folder | `daily/YYYY/MM/YYYY-MM-DD.md` | Nesting breaks Obsidian Calendar plugin — flat is required |
| AskUserQuestion for done multi-select | Parse numbered input manually | AskUserQuestion is cleaner; no custom parsing |

**Installation:** No new npm dependencies needed. All functionality uses Node.js stdlib and Claude Code tools.

---

## Architecture Patterns

### Recommended Project Structure (additions for Phase 2)
```
stubs/claude-code/donna/
├── setup.md          # exists (stub — replace hello-world with real setup logic)
├── add-task.md       # new stub
└── done.md           # new stub

workflows/
├── setup.md          # exists (replace stub content with real setup logic)
├── add-task.md       # new workflow
└── done.md           # new workflow

test/
├── stubs.test.cjs    # extend to cover add-task and done stubs
├── workflows.test.cjs # (GitHub Actions tests — no changes needed)
└── setup-workflow.test.cjs  # new: integration test for setup behavior
```

### Pattern 1: Stub-Workflow Split
**What:** A thin stub file in `stubs/claude-code/donna/<skill>.md` contains YAML frontmatter (name, description, allowed-tools) and an `@~/.donna/workflows/<skill>.md` reference. The workflow file contains all the real logic.
**When to use:** Every skill follows this pattern.

Stub template:
```markdown
---
name: donna:<skill>
description: <one-line description>
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Run the Donna <skill> workflow.
</objective>

<execution_context>
@~/.donna/workflows/<skill>.md
</execution_context>
```

Workflow file template:
```markdown
# Donna <Skill> Workflow

<objective>
<one-sentence goal>
</objective>

<step name="read-config">
Read `~/.config/donna/config.md` and extract the storage repo path.
</step>

<step name="...">
...
</step>
```

### Pattern 2: Bootstrap Config Read
**What:** Every skill (except setup itself) begins by reading `~/.config/donna/config.md`. If absent, it tells the user to run `/donna:setup` first.
**When to use:** add-task, done, and all future skills.

```markdown
<step name="read-config">
Read `~/.config/donna/config.md`.
If the file does not exist, print:
  ✗ Donna is not configured. Run /donna:setup first.
Stop.
Extract: storage_repo (the path to the git repo).
</step>
```

### Pattern 3: Git Commit After Write
**What:** After writing to any file in the storage repo, run `git -C <repo-path> add -A` followed by `git -C <repo-path> commit -m "<conventional message>"`. If `auto_push` is true in config.md, follow with `git -C <repo-path> push`.
**When to use:** End of every skill that modifies the storage repo.

```bash
git -C /path/to/storage-repo add -A
git -C /path/to/storage-repo commit -m "donna(add-task): buy milk"
# if auto_push == true:
git -C /path/to/storage-repo push
```

### Pattern 4: Daily File Creation
**What:** Get today's date (`date +%Y-%m-%d`), construct path `<repo>/daily/YYYY-MM-DD.md`. If file doesn't exist, create it with YAML frontmatter and an empty tasks section.
**When to use:** add-task always does this; done can also handle missing file gracefully.

```markdown
<step name="ensure-daily-file">
Run: `date +%Y-%m-%d` to get today's date.
Construct path: `<storage_repo>/daily/<date>.md`
If the file does not exist, create it with:
```
---
date: <YYYY-MM-DD>
---

## Tasks

```
</step>
```

### Pattern 5: Conventional Commit Messages
**What:** All donna commits use the format `donna(<skill>): <summary>` — lowercase skill name, concise summary derived from the action taken.
**When to use:** Every git commit from a donna skill.

Examples:
- `donna(setup): initialize storage`
- `donna(add-task): buy milk`
- `donna(done): buy milk`

### Pattern 6: Output Style
**What:** Checkmark lines (`✓ ...`) for success steps, cross lines (`✗ ...`) for errors. Established by `src/output.cjs`. Workflows should mirror this style in their printed output.
**When to use:** All workflow output that reports progress or errors.

### Pattern 7: Re-run Detection in Setup
**What:** Setup reads `~/.config/donna/config.md` first. If it exists, enters update mode and offers: (1) change repo path, (2) view current config, (3) reset, (4) cancel. Only on first run does it go through the full guided init.

### Anti-Patterns to Avoid
- **`cd` in Bash steps:** Changes working directory for subsequent commands. Use `git -C <path>` and absolute paths instead.
- **Reading the entire storage repo at once:** STORE-03 (Phase 3) enforces file-by-file reads. Start good habits now: skills read only the one daily file they need.
- **Creating standing files (role.md, recurring.md, etc.) in setup:** These belong to later phases. Phase 2 setup creates only `daily/` and `config.md` in the storage repo.
- **Putting logic in stubs:** Stubs must be thin. All logic lives in the workflow file.
- **`allowed-tools` missing `AskUserQuestion`:** If the stub doesn't declare it, Claude Code won't be able to prompt the user interactively.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom date logic | `date +%Y-%m-%d` via Bash | Shell built-in, always correct for local timezone |
| Git operations | Node.js `simple-git` or similar | `git -C <path>` via Bash | Zero new dependencies; already in path on all dev machines |
| YAML frontmatter parsing | Custom regex parser | Simple key: value line matching with `grep` or Claude reading the file | Frontmatter in this project is minimal and hand-matched |
| Fuzzy match | Levenshtein distance library | Claude's natural language understanding + string includes | Workflows run inside Claude — it handles fuzzy matching natively |
| Interactive prompts | Custom readline loop | `AskUserQuestion` tool | Built into Claude Code; handles multi-select cleanly |

**Key insight:** Workflow files run inside Claude Code, so Claude itself handles fuzzy matching, user dialogue, and natural language — no custom NLP or fuzzy-match library needed.

---

## Common Pitfalls

### Pitfall 1: Missing `AskUserQuestion` in allowed-tools
**What goes wrong:** Skill fails silently or errors when trying to prompt user; setup and done both require interactive input.
**Why it happens:** The stub's `allowed-tools` list controls what the runtime permits.
**How to avoid:** Always include `AskUserQuestion` in allowed-tools for setup and done stubs.
**Warning signs:** Skill completes without asking expected questions.

### Pitfall 2: `~/.config/donna/` directory not created before writing config
**What goes wrong:** `Write` tool fails on `~/.config/donna/config.md` because parent directory doesn't exist.
**Why it happens:** The XDG config directory doesn't exist on a fresh machine.
**How to avoid:** In the setup workflow, run `mkdir -p ~/.config/donna` via Bash before writing config.md.
**Warning signs:** Write error mentioning ENOENT or no such file or directory.

### Pitfall 3: Storage repo `daily/` directory not created before writing first daily file
**What goes wrong:** Write fails because `<repo>/daily/` doesn't exist.
**Why it happens:** A freshly git-initialized directory has no subdirectories.
**How to avoid:** Setup creates `daily/`. add-task defensively runs `mkdir -p <repo>/daily` before writing.
**Warning signs:** File write error on first add-task after setup.

### Pitfall 4: Git commit with nothing staged
**What goes wrong:** `git commit` fails with "nothing to commit" — skill errors out.
**Why it happens:** Edge case where the file wasn't actually modified (e.g., done called on already-completed task).
**How to avoid:** Check `git -C <path> status --porcelain` before committing; skip commit and inform user if nothing changed.
**Warning signs:** git exit code 1 with "nothing to commit" message.

### Pitfall 5: Installer copies only setup stub — new stubs missed
**What goes wrong:** add-task and done stubs not installed to `~/.claude/commands/donna/` on user machines.
**Why it happens:** The installer copies the entire `stubs/claude-code/` directory to the target, so new files are included automatically — BUT the installer's success message is hardcoded to mention only `donna:setup`. The message needs updating.
**How to avoid:** The installer already uses `fs.cpSync` recursively, so new stubs are auto-copied. Update the success message string in `src/installer.cjs` to reflect the new skills.
**Warning signs:** Stubs appear on disk but success message doesn't mention new skills.

### Pitfall 6: `donna:done` without argument shows tasks from wrong file
**What goes wrong:** Shows tasks from wrong date or no tasks if daily file doesn't exist.
**Why it happens:** Date computed incorrectly, or file doesn't exist yet today.
**How to avoid:** Always compute `date +%Y-%m-%d` at runtime (not hardcoded). If no daily file exists today, tell user there are no tasks for today and exit cleanly.
**Warning signs:** Empty task list on days when tasks exist in previous files.

### Pitfall 7: Re-run setup overwrites storage repo without warning
**What goes wrong:** User accidentally re-runs setup, changes repo path, loses configured repo reference.
**Why it happens:** Setup doesn't detect existing config.
**How to avoid:** Read config at start of setup; if it exists, go into update mode (offer menu of options, not silent overwrite).
**Warning signs:** User reports setup wiped their config.

---

## Code Examples

Verified patterns from the existing codebase:

### Reading the installed version in a workflow
```markdown
<step name="version">
Read `~/.donna/version.md` and display the installed version.
</step>
```
Source: `workflows/setup.md` (existing pattern)

### XDG config directory creation via Bash
```bash
mkdir -p ~/.config/donna
```
Source: XDG Base Directory Specification — `~/.config` is the standard location; `mkdir -p` is safe to re-run (idempotent).

### Git add + commit without cd
```bash
git -C /path/to/repo add -A
git -C /path/to/repo commit -m "donna(add-task): buy milk"
```
Source: `git -C` flag documentation; locked decision in CONTEXT.md.

### Checking git status before commit
```bash
git -C /path/to/repo status --porcelain
```
Returns empty string if nothing to commit; non-empty if there are staged/unstaged changes.

### Getting today's date
```bash
date +%Y-%m-%d
```
Returns `YYYY-MM-DD` in local timezone. No external dependencies.

### Stub file structure (from existing setup.md)
```markdown
---
name: donna:setup
description: Set up Donna assistant for this machine
allowed-tools:
  - Read
  - Bash
---

<objective>
Run the Donna setup workflow. ...
</objective>

<execution_context>
@~/.donna/workflows/setup.md
</execution_context>
```
Source: `stubs/claude-code/donna/setup.md` (Phase 1 established pattern)

### Node.js test with temp directory (from installer.test.cjs)
```javascript
const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "donna-test-"));
// ... test ...
fs.rmSync(homeDir, { recursive: true, force: true });
```
Source: `test/installer.test.cjs` (Phase 1 established pattern)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hello-world setup stub | Real interactive setup | Phase 2 | setup.md workflow replaced entirely |
| No bootstrap config | `~/.config/donna/config.md` | Phase 2 | All future skills depend on this file |
| No task capture | donna:add-task + donna:done | Phase 2 | Core user value delivered |

**Deprecated/outdated:**
- The "This is a stub -- real setup coming in Phase 2." message in `workflows/setup.md`: Will be replaced by the real setup logic.

---

## Open Questions

1. **Installer success message wording for multiple stubs**
   - What we know: Currently says `Copied donna:setup to ${provider.stubTarget}` (hardcoded single skill mention)
   - What's unclear: Should it list all skills individually, or say "Copied donna skills to ..."?
   - Recommendation: Change to `Copied donna skills (setup, add-task, done) to ${provider.stubTarget}` — simple enumeration is clear and doesn't require dynamic discovery.

2. **config.md format for `auto_push` and other settings**
   - What we know: Left to Claude's discretion; must be Obsidian-compatible plain Markdown with YAML frontmatter.
   - What's unclear: YAML frontmatter vs body key-value pairs for settings.
   - Recommendation: Use YAML frontmatter for all settings (`storage_repo`, `auto_push`). Frontmatter is standard, machine-readable, and Obsidian displays it cleanly.

3. **YAML frontmatter fields for daily journal files**
   - What we know: Left to Claude's discretion; Obsidian compatibility required.
   - What's unclear: Minimal vs richer frontmatter.
   - Recommendation: Use `date: YYYY-MM-DD` only in Phase 2. Keep it minimal — later phases can add fields like `carried_from` when needed.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (v18+) |
| Config file | None — test script in package.json: `"test": "node --test 'test/*.test.cjs'"` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETUP-01 | setup stub exists with correct frontmatter | unit | `npm test` (stubs.test.cjs) | ❌ Wave 0 — extend stubs.test.cjs |
| SETUP-01 | setup workflow has real logic (not stub message) | unit | `npm test` (new setup-workflow.test.cjs) | ❌ Wave 0 |
| SETUP-02 | config.md written at correct path with expected fields | unit | `npm test` (new setup-workflow.test.cjs) | ❌ Wave 0 |
| TASK-01 | add-task stub exists with correct frontmatter + @reference | unit | `npm test` (stubs.test.cjs) | ❌ Wave 0 — extend stubs.test.cjs |
| TASK-01 | add-task workflow file exists and references config read | unit | `npm test` (new add-task-workflow.test.cjs or inline) | ❌ Wave 0 |
| TASK-02 | done stub exists with correct frontmatter + @reference | unit | `npm test` (stubs.test.cjs) | ❌ Wave 0 — extend stubs.test.cjs |
| TASK-02 | done workflow file exists and references today's tasks | unit | `npm test` (new done-workflow.test.cjs or inline) | ❌ Wave 0 |
| STORE-01 | setup creates daily/ directory in storage repo | unit | `npm test` | ❌ Wave 0 |
| STORE-02 | git commit step present in all workflow files | unit | `npm test` | ❌ Wave 0 |

Note: Workflow files are Markdown — tests verify structural properties (file exists, contains expected sections/patterns) rather than runtime behavior. Runtime behavior (Claude actually executing steps) is validated manually per the Phase 1 pattern.

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/stubs.test.cjs` — extend to cover add-task and done stubs (currently only covers setup)
- [ ] `test/setup-workflow.test.cjs` — new file: verify setup.md contains real logic, not stub message; verify XDG config path reference; verify git init step
- [ ] `test/add-task-workflow.test.cjs` — new file: verify add-task.md structure and required step references
- [ ] `test/done-workflow.test.cjs` — new file: verify done.md structure and required step references

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `stubs/claude-code/donna/setup.md`, `workflows/setup.md`, `src/installer.cjs`, `src/output.cjs`, `src/providers/` — direct code reading
- Codebase inspection: `test/installer.test.cjs`, `test/stubs.test.cjs` — test patterns
- `package.json` — Node.js version constraint (>=18), test script pattern, no new dependency needed

### Secondary (MEDIUM confidence)
- `git -C <path>` flag: well-established git feature, available in all modern git versions; avoids directory-change side effects
- XDG Base Directory Specification: `~/.config` is the standard config location on Linux/macOS; confirmed by macOS and most Linux distros
- Claude Code `allowed-tools` frontmatter: observed in existing stub; controls what tools the skill can use at runtime

### Tertiary (LOW confidence — flag for validation)
- `AskUserQuestion` multi-select behavior: referenced in CONTEXT.md decisions as chosen approach; exact syntax/behavior in workflow instructions should be validated against Claude Code runtime behavior before authoring the `donna:done` workflow

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools/libs are already in use in the project; no new dependencies
- Architecture: HIGH — patterns derived directly from existing Phase 1 code
- Pitfalls: HIGH — most derived from code inspection; one (Pitfall 7) from design reasoning
- Validation: HIGH — test framework and patterns established in Phase 1

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable domain — Node.js stdlib and git don't change fast)
