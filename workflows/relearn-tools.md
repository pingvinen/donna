# Donna Relearn-Tools Workflow

<objective>
Check each registered tool's installed version against its stored version and re-learn capabilities for tools that have been updated. Tools at the same version are skipped.
</objective>

<step name="read-config">
Read `~/.config/donna/config.md`.

If the file does not exist, print:
```
✗ Donna is not configured. Run /donna:setup first.
```
Stop.

Extract the `storage_repo`, `daily_folder` (default: `daily`), and `auto_push` (default: false) fields from the YAML frontmatter.

**Obsidian sync:** Check if `<storage_repo>/.obsidian/daily-notes.json` exists.
- If it exists and has a `folder` field that differs from `<daily_folder>`: update `<daily_folder>` to match Obsidian's value, and update `~/.config/donna/config.md` with the new `daily_folder`. Print `✓ Synced daily folder with Obsidian: <daily_folder>`.
- If `<storage_repo>/.obsidian/` exists but `daily-notes.json` does not exist or has no `folder` field: write `<storage_repo>/.obsidian/daily-notes.json` with `{"folder":"<daily_folder>"}`. Print `✓ Configured Obsidian daily notes to use <daily_folder>/`.
- Otherwise: do nothing.
</step>

<step name="check-pending-migrations">
Read `~/.donna/state.md` with the Read tool. If the file does not exist or has no `pending_migrations` field in its YAML frontmatter, skip this step.

For each entry in `pending_migrations`:

**`move-standing-files`:** Move standing files from storage repo root to donna/ subfolder.

Run via Bash:
```bash
STORAGE_REPO="<storage_repo>"
DONNA_DIR="$STORAGE_REPO/donna"
MOVED=0

mkdir -p "$DONNA_DIR"
for FILE in role.md recurring.md role-research.md; do
    if [ -f "$STORAGE_REPO/$FILE" ] && [ ! -f "$DONNA_DIR/$FILE" ]; then
        mv "$STORAGE_REPO/$FILE" "$DONNA_DIR/$FILE"
        echo "Moved $FILE to donna/$FILE"
        MOVED=$((MOVED + 1))
    fi
done

echo "MOVED=$MOVED"
```

If MOVED > 0, commit the move:
```bash
git -C <storage_repo> add -A
git -C <storage_repo> diff --cached --quiet || git -C <storage_repo> commit -m "donna(migrate): move standing files to donna/ subfolder"
```

If `auto_push` is true in config, also push.

After processing all pending migrations, update `~/.donna/state.md` with the Write tool: remove the completed entries from `pending_migrations`. If no entries remain, write:
```markdown
---
pending_migrations: []
---
```
</step>

<step name="read-tools-md">
Read `<storage_repo>/donna/tools.md` with the Read tool. If the file does not exist, print:
```
✗ No tools registered. Run /donna:add-tool first.
```
Stop.

Parse each tool section (starting with `## <tool_name>`). For each tool, extract:
- `command` — the CLI command to run
- `version` — the stored version string
- `learned` — the date capabilities were last learned
- capabilities list under `### Capabilities`

Store the parsed tools as `<registered_tools>`.
</step>

<step name="check-versions">
For each tool in `<registered_tools>`, run via Bash:
```bash
<command> --version 2>/dev/null | head -1
```

Compare the output against the stored `version` field using simple string equality — "is it different?" is sufficient; no semver parsing required.

If `<command>` is not found (command fails), treat it as changed with a warning note.

Collect tools into two lists:
- `<changed_tools>` — installed version differs from stored version (or command not found)
- `<unchanged_tools>` — installed version matches stored version exactly
</step>

<step name="report-unchanged">
For each tool in `<unchanged_tools>`, print:
```
⊘ <tool_name>: unchanged at <version> — skipped
```

If ALL tools are in `<unchanged_tools>` (no changes found), print:
```
✓ All tools up to date. Nothing to re-learn.
```
Stop.
</step>

<step name="relearn-changed">
For each tool in `<changed_tools>`, apply the same learn-capabilities logic as add-tool.md's learn-capabilities step.

Determine if the tool is well-known (gh, jira, kubectl) or unknown. For well-known tools, synthesize capabilities from training data. Do NOT parse --help for well-known tools.

**gh (GitHub CLI) — training data baseline:**
- list-assigned-prs: `gh search prs --assignee=@me --state=open --json number,title,url --limit 20`
- list-review-requests: `gh search prs --review-requested=@me --state=open --json number,title,url --limit 20`
- list-assigned-issues: `gh search issues --assignee=@me --state=open --json number,title,url --limit 20`

**jira (ankitpokhrel/jira-cli) — training data baseline:**
- list-sprint-issues: `jira sprint list --current -a$(jira me) --plain`
- list-my-issues: `jira issue list -a$(jira me) --plain`

**kubectl — training data baseline:**
- list-pods: `kubectl get pods --all-namespaces --field-selector=status.phase!=Succeeded -o wide`
- list-failing: `kubectl get pods --all-namespaces --field-selector=status.phase=Failed -o wide`

For **unknown tools**, run `<command> --help 2>&1 | head -80` via Bash and use Claude's understanding to identify 3–5 capabilities relevant to daily task management.

Do NOT ask the user to re-select capabilities — keep the same capability names, update only the CLI invocations if the training data suggests changes.

Get the new installed version:
```bash
<command> --version 2>/dev/null | head -1
```

Print:
```
✓ Re-learned <tool_name> (was <old_version>, now <new_version>)
```
</step>

<step name="write-tools-md">
Update `<storage_repo>/donna/tools.md`: for each re-learned tool, update its `version`, `learned` date (today's date YYYY-MM-DD), and capabilities section with the new invocations.

Upsert — replace only the re-learned tool sections, do not remove other tool sections. Preserve all unchanged tool sections exactly as they are.

Write the full file back with the Write tool.
</step>

<step name="git-commit">
Run via Bash:
```bash
git -C <storage_repo> add -A
```

Check whether there is anything to commit:
```bash
git -C <storage_repo> status --porcelain
```

If the output is empty, skip the commit and continue.

Otherwise, run:
```bash
git -C <storage_repo> commit -m "donna(relearn-tools): updated <count> tool(s)"
```

If `auto_push` is true in config, also run:
```bash
git -C <storage_repo> push
```
</step>

<step name="confirm">
Print summary:
```
✓ Re-learned <count> tool(s): <tool_names>
  <count> tool(s) unchanged: <tool_names>
```
</step>
