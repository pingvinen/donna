# Phase 3: Prioritized now view — distill daily file to focus items - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a `/donna:focus` skill that reads today's daily file, enriches items by re-querying relevant tools, and produces a short prioritized summary of the most important items to focus on right now. Writes output to `daily/focus.md` (overwritten each run) and prints to terminal. Does not modify the daily file itself — this is a read-only distillation layer.

</domain>

<decisions>
## Implementation Decisions

### Skill name and invocation
- **D-01:** Skill name is `donna:focus`
- **D-02:** No arguments — always reads today's full daily file and produces the focus list
- **D-03:** Zero-friction invocation: just `/donna:focus`, no configuration needed

### Output destination
- **D-04:** Write to `daily/focus.md` (single file, not date-stamped) — visible in Obsidian
- **D-05:** Also print the focus list to the terminal so user sees it immediately
- **D-06:** Each run overwrites `focus.md` entirely — always shows current state, no history
- **D-07:** `focus.md` must be Obsidian-compatible markdown with YAML frontmatter

### Prioritization signals — text analysis (from daily file content)
- **D-08:** Urgency keywords in task text: "due today", "due tomorrow", "blocking", "urgent", "ASAP"
- **D-09:** Carry-forward count — items carried forward many times (high `(N times)` suffix) signal neglected work
- **D-10:** Task source via tool tags — `(gh)`, `(jira)`, etc. — used to correlate with enriched data
- **D-11:** Recency — items appearing for the first time today (not carried forward) get a freshness signal
- **D-12:** Open vs resolved — only open items (`- [ ]`) are candidates for the focus list

### Prioritization signals — tool enrichment
- **D-13:** Re-query only tools whose items appear in the daily file (not all configured tools)
- **D-14:** Enrichment adds richer context: Jira status fields, PR review-requested flags, PR approval state, etc.
- **D-15:** Graceful fallback — if a tool query fails, fall back to text-only signals for that tool's items; still produce the focus list
- **D-16:** Tool enrichment uses the same capability commands from `tools.md` that `run-tools` uses

### Focus list sizing
- **D-17:** Dynamic item count — Claude decides based on urgency distribution (could be 3 items on a quiet day, 8 on a busy one)
- **D-18:** Always show total item count in daily file as context (e.g. "47 other items in today's file")

### Claude's Discretion
- Exact ranking algorithm and signal weighting
- How to present enriched data in the focus list (inline annotations, sub-bullets, etc.)
- Format and structure of `focus.md` beyond the basic requirements
- How to detect "first time today" items vs carried-forward items
- Whether to include a brief reason/tag for why each item is prioritized

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Daily file structure and parsing
- `workflows/begin-the-day.md` — Daily file creation, carry-forward logic, task line format, deduplication rules
- `workflows/run-tools.md` — Tool execution, smart-merge logic, how tool data enters the daily file
- `workflows/done.md` — Task line parsing patterns (strip tool tags, links, counters)

### Tool system
- `workflows/add-tool.md` — Tool registration, tools.md format, capability definitions
- `workflows/relearn-tools.md` — How capabilities are structured and versioned

### Skill patterns
- `stubs/claude-code/donna/` — Stub format for all existing skills
- `workflows/setup.md` — Reference for skill structure, config reading, AskUserQuestion patterns

### Project conventions
- `CLAUDE.md` — Git/CI rules, Obsidian compatibility, naming ("Donna" not "DONNA"), README updates
- `.planning/PROJECT.md` — Core value, key decisions, distribution model

### Source issue
- GitHub Issue #16: https://github.com/pingvinen/donna/issues/16

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workflows/run-tools.md` — Tool execution and capability command patterns; `donna:focus` reuses the same tool query mechanism
- `workflows/begin-the-day.md` — Task line format parsing, carry-forward detection logic
- `workflows/done.md` — Task line stripping patterns (tool tags, links, counters) for clean display
- `src/installer.cjs` — Skill registration for new stub + workflow

### Established Patterns
- Skill = stub (stubs/claude-code/donna/) + workflow (workflows/)
- All skills read `~/.config/donna/config.md` first for storage_repo path
- Daily files at `<storage_repo>/<daily_folder>/YYYY-MM-DD.md`
- Task line format: `- [state] (tool) description [id](url) (suffix)`
- Git commit from main context only (SSH signing constraint)
- Standing files live in `donna/` subfolder; focus.md lives in `daily/` (alongside daily files)

### Integration Points
- New skill needs entry in `src/installer.cjs` (file copy list)
- New skill needs entry in `README.md` (command table)
- Reads `donna/tools.md` to know which tools to query for enrichment
- Reads today's daily file (`daily/YYYY-MM-DD.md`) as primary input
- Writes `daily/focus.md` as output

</code_context>

<specifics>
## Specific Ideas

- Focus list should feel like a "morning standup with yourself" — what are the 3-8 things that actually matter today?
- The GitHub issue example output is a good reference for the format:
  ```
  ## Focus (2026-03-17, 11:00)
  1. Prepare for blip blop — due tomorrow
  2. 11:30 Planning Session — starts in 30 min
  3. (gh) review: stuff — review requested by Colleague
  4. (mail) John Doe — Important Topic, needs reply
  5. (jira) XYZ-1234 — Important topic (In Progress)
  ---
  47 other items in today's file
  ```
- Tool enrichment should be fast — parallel queries, same pattern as run-tools

</specifics>

<deferred>
## Deferred Ideas

- Calendar integration for meeting proximity signals — requires a calendar tool type first
- Configurable item count override via arguments — keep it simple for now
- "Done with this, what's next?" interactive flow — separate skill or future enhancement
- Tool-specific filtering (e.g. "only show GitHub items") — could add arguments later

</deferred>

---

*Phase: 03-prioritized-now-view-distill-daily-file-to-focus-items*
*Context gathered: 2026-03-21*
