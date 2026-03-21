---
phase: 03-prioritized-now-view-distill-daily-file-to-focus-items
verified: 2026-03-21T00:00:00Z
status: passed
score: 8/8 must-haves verified
re_verification: false
---

# Phase 03: Prioritized Now View — Verification Report

**Phase Goal:** Add a `/donna:focus` skill that reads today's daily file, enriches items by re-querying relevant tools, and produces a short prioritized summary of the most important items to focus on right now
**Verified:** 2026-03-21
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | donna:focus stub exists and references the workflow | VERIFIED | `stubs/claude-code/donna/focus.md` exists, contains `name: donna:focus`, references `@~/.donna/workflows/focus.md` |
| 2 | focus workflow reads today's daily file and extracts open tasks | VERIFIED | `step name="read-daily-file"` reads `<storage_repo>/<daily_folder>/YYYY-MM-DD.md`; `step name="parse-open-tasks"` extracts `- [ ]` lines only |
| 3 | focus workflow applies text-analysis priority signals | VERIFIED | `step name="score-and-rank"` applies urgency keywords ("due today", "due tomorrow", "blocking", "urgent", "ASAP"), carry-forward count (`(N times)`), and freshness (D-08 through D-12) |
| 4 | focus workflow re-queries only tools whose items appear in today's file | VERIFIED | `step name="enrich-from-tools"` collects unique tool tags from `<open_tasks>` before querying; D-13 constraint explicitly stated |
| 5 | focus workflow writes daily/focus.md with YAML frontmatter | VERIFIED | `step name="write-focus-file"` targets `<storage_repo>/<daily_folder>/focus.md` with `date` and `generated` YAML fields; explicit `CRITICAL: Only write to focus.md` constraint |
| 6 | focus workflow prints focus list to terminal with banner | VERIFIED | `step name="print-focus"` uses double-line box banner "Donna — Focus for <today>" matching begin-the-day pattern |
| 7 | installer success message includes focus | VERIFIED | `src/installer.cjs` line 82 contains `adjust-tool, focus` at end of skill list |
| 8 | README command table includes /donna:focus | VERIFIED | `README.md` line 144: `| /donna:focus | Distill today's tasks into a short prioritized focus list |` |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `stubs/claude-code/donna/focus.md` | Skill stub for donna:focus | VERIFIED | Exists, 17 lines, correct YAML frontmatter, no AskUserQuestion |
| `workflows/focus.md` | Full focus workflow with 9 steps | VERIFIED | Exists, 318 lines, all 9 steps present |
| `src/installer.cjs` | Updated installer success message | VERIFIED | Contains "adjust-tool, focus" at line 82 |
| `README.md` | Command table entry for /donna:focus | VERIFIED | Row present at line 144 |
| `test/stubs.test.cjs` | Test blocks for focus stub and workflow | VERIFIED | `describe` blocks for stub (5 tests) and workflow (2 tests), plus installer message test; 174 pass total |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `stubs/claude-code/donna/focus.md` | `workflows/focus.md` | `@~/.donna/workflows/focus.md` reference | WIRED | Line 15: `@~/.donna/workflows/focus.md` |
| `workflows/focus.md` | `daily/<date>.md` | `step name="read-daily-file"` reads today's file | WIRED | Line 85: step exists and constructs path from `<storage_repo>/<daily_folder>/<today>.md` |
| `workflows/focus.md` | `donna/tools.md` | `step name="enrich-from-tools"` queries tools | WIRED | Line 123: step reads tools.md and matches tool sections by tag |
| `workflows/focus.md` | `daily/focus.md` | `step name="write-focus-file"` writes output | WIRED | Line 224: explicitly writes to `<storage_repo>/<daily_folder>/focus.md` |
| `test/stubs.test.cjs` | `stubs/claude-code/donna/focus.md` | `fs.existsSync` and `fs.readFileSync` assertions | WIRED | `focusStubPath` declared at line 31; used in 4 assertions |
| `test/stubs.test.cjs` | `workflows/focus.md` | `fs.existsSync` and `fs.readFileSync` assertions | WIRED | `focusWorkflowPath` declared at line 32; used in 2 assertions |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| FOCUS-01 | 03-01-PLAN | `/donna:focus` skill stub | SATISFIED | Stub exists at `stubs/claude-code/donna/focus.md` with correct YAML; tests pass |
| FOCUS-02 | 03-01-PLAN | `workflows/focus.md` workflow file | SATISFIED | Workflow exists at `workflows/focus.md`; installer copies entire `workflows/` dir |
| FOCUS-03 | 03-01-PLAN | Read today's daily file and extract open `- [ ]` items | SATISFIED | Steps `read-daily-file` and `parse-open-tasks` in workflow; only `- [ ]` items processed |
| FOCUS-04 | 03-01-PLAN | Apply text-analysis priority signals (D-08 through D-12) | SATISFIED | `score-and-rank` step covers all five signals: urgency keywords, chronic neglect, carry-forward, freshness, open state |
| FOCUS-05 | 03-01-PLAN | Re-query tools with items in today's file for enrichment | SATISFIED | `enrich-from-tools` step uses same type-aware execution as `run-tools.md`; only queries tools present in open tasks |
| FOCUS-06 | 03-01-PLAN | Dynamic focus list (3-8 items) with total count footer | SATISFIED | `score-and-rank` produces 3–8 items dynamically; `<other_count>` footer in `write-focus-file` and `print-focus` |
| FOCUS-07 | 03-01-PLAN | Write `daily/focus.md` with YAML frontmatter, Obsidian-compatible | SATISFIED | `write-focus-file` step writes `date` and `generated` frontmatter; D-07 constraint explicitly maintained |
| FOCUS-08 | 03-01-PLAN | Print focus list to terminal with Donna banner | SATISFIED | `print-focus` step uses double-line box banner, numbered items with reason tags, footer |
| FOCUS-09 | 03-01-PLAN | Register skill in installer success message | SATISFIED | `src/installer.cjs` line 82 includes "focus"; test at line 1217 passes |
| FOCUS-10 | 03-01-PLAN | Add `/donna:focus` entry to README command table | SATISFIED | Row present in README at line 144 |
| FOCUS-11 | 03-02-PLAN | Test coverage for new stub and workflow | SATISFIED | 8 tests added: stub existence, frontmatter, description, workflow reference, no AskUserQuestion, workflow existence, step structure, installer message; 174 total pass |

**Coverage:** 11/11 requirements satisfied. No orphaned requirements.

### Anti-Patterns Found

| File | Pattern | Severity | Assessment |
|------|---------|----------|-----------|
| `workflows/focus.md` | `enrich-from-tools` spawns Task agents | Info | Not a stub — this is correct design per D-13/D-15; agents cannot write files or run git, enforced by explicit constraints in the step |
| `stubs/claude-code/donna/focus.md` | Minimal stub body (17 lines) | Info | Not a stub in the negative sense — this is the intended stub pattern; all logic lives in the workflow file per the skill architecture |

No blocking anti-patterns found. No TODO/FIXME/placeholder comments. No hardcoded empty data. The workflow uses runtime variables (`<storage_repo>`, `<today>`, `<open_tasks>`) throughout, not hardcoded values.

### Human Verification Required

#### 1. End-to-end focus run

**Test:** Create a daily file with a mix of open tasks (some with urgency keywords, some carried forward, some new), configure a tool in tools.md, then run `/donna:focus` in Claude Code.
**Expected:** Donna reads the daily file, optionally queries configured tools, writes `daily/focus.md` with YAML frontmatter and numbered items, and prints the banner to the terminal. Only `focus.md` is written — the daily file is unchanged.
**Why human:** Workflow logic (task scoring, tool enrichment, file writing) executes inside Claude Code at runtime — cannot be unit-tested without a live Claude session.

#### 2. Tool enrichment path

**Test:** Add a `(gh)` tagged item to a daily file, configure a `gh` tool in tools.md, run `/donna:focus`.
**Expected:** The enrich-from-tools step queries the `gh` tool and uses the returned PR status (review-requested, changes-requested, etc.) to influence ranking. Items without tool tags still appear in the focus list via text-analysis signals.
**Why human:** Tool capability execution (cli/rest/graphql/mcp) and enrichment data integration require a live tool configuration.

#### 3. Graceful degradation on tool failure

**Test:** Configure a tool with an invalid command or missing secret, run `/donna:focus`.
**Expected:** Warning is logged (`! <tool_name>: <error>`), focus list is still produced using text-analysis signals, no crash.
**Why human:** Error handling behavior in the `enrich-from-tools` step requires a runtime failure scenario.

### Gaps Summary

No gaps found. All 8 must-have truths verified, all 11 requirements satisfied, all 5 key links wired, 174 tests pass, linting clean.

---

_Verified: 2026-03-21_
_Verifier: Claude (gsd-verifier)_
