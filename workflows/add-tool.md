# Donna Add-Tool Workflow

<objective>
Declare an external CLI tool, verify its installation and authentication, learn its capabilities, and persist the result to tools.md in the storage repo.
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

**`backfill-tool-type`:** Add `type: cli` to existing tool sections in tools.md.

Read `<storage_repo>/donna/tools.md` with the Read tool. If the file does not exist or has no tool sections, skip this handler.

For each tool section (starting with `## <tool_name>`), check if a `- type:` line exists between `- command:` and `- version:`. If the `- type:` line is missing, insert `- type: cli` immediately after the `- command:` line.

Write the updated file back with the Write tool. If any changes were made, commit:
```bash
git -C <storage_repo> add -A
git -C <storage_repo> diff --cached --quiet || git -C <storage_repo> commit -m "donna(migrate): backfill type: cli on existing tools"
```

If `auto_push` is true in config, also push.

After processing all pending migrations, update `~/.donna/state.md` with the Write tool: remove the completed entries from `pending_migrations`. If no entries remain, write:
```markdown
---
pending_migrations: []
---
```
</step>

<step name="detect-noted-tools">
Read `<storage_repo>/donna/role.md` and `<storage_repo>/donna/role-research.md` with the Read tool. If either file does not exist, skip reading that file.

Look for lines containing tool names noted by set-role's approve-tools step. These lines follow the pattern `✓ Noted: <ToolName>` or `- Noted: <ToolName>`. Collect the noted tool names as `<noted_tools>`.

If `<noted_tools>` has more than one entry and no specific tool name was provided as argument to the command, offer batch mode via AskUserQuestion:

```
Set-role noted these tools: <list>. Configure all of them now? (yes/no)
```

If yes, set batch mode active and process each tool sequentially through steps 4–11 below. If no, proceed to ask-tool-name for a single tool.
</step>

<step name="ask-tool-name">
If a tool name was provided as argument (e.g. `/donna:add-tool gh`), use it directly. Otherwise, use AskUserQuestion:

```
What tool would you like to add? (e.g. gh, jira, kubectl)
```

Store the answer as `<tool_name>`.

Resolve the CLI command — default to the tool name itself. If the tool name is in `<noted_tools>`, pre-fill any context from set-role notes. Use AskUserQuestion to confirm or override the CLI command:

```
CLI command for <tool_name>? (default: <tool_name>)
```

If the user presses enter without typing, use the default. Store the confirmed CLI command as `<command>`.
</step>

<step name="verify-installation">
Run via Bash:
```bash
which <command> && echo "INSTALLED=true" || echo "INSTALLED=false"
```

If INSTALLED=false, print:
```
! <command> is not installed. You can still save it, but data pulling won't work until you install it.
```
Continue (do not stop — user may want to pre-configure).

If INSTALLED=true, run:
```bash
<command> --version 2>/dev/null | head -1
```

Store the output as `<version>`. If the command does not support `--version`, store `<version>` as `unknown`.
</step>

<step name="auth-test">
For well-known tools, run the appropriate auth test via Bash with a 10-second timeout:

- `gh`: `timeout 10 gh api user --jq '.login' 2>&1`
- `jira`: `timeout 10 jira me 2>&1`
- `kubectl`: `timeout 10 kubectl auth whoami 2>&1`
- Other tools: skip auth test, print `ℹ No known auth test for <command>. Verify manually.`

On success (exit 0): print `✓ Authenticated as <output>`.

On failure (non-zero exit): print `! Authentication failed for <command>. Fix: <tool-specific fix instructions>`.

Fix instructions per tool:
- `gh` → run `gh auth login`
- `jira` → run `jira init`
- `kubectl` → check your kubeconfig

Continue (do not stop — user may want to save the tool despite auth issues).
</step>

<step name="ask-scope">
Ask the user to define the scope/context for this tool. Different tools need different scope:

- **gh**: Which GitHub orgs or repos to pull from (e.g., `mycompany`, `mycompany/api mycompany/web`)
- **jira**: Which Jira project(s) or board(s) (e.g., `AUTH`, `AUTH PLAT`)
- **kubectl**: Which namespace(s) or cluster(s) (e.g., `production`, `staging production`)
- **Other tools**: Any relevant filtering context

Use AskUserQuestion:
```
What scope should Donna use for <tool_name>?
(e.g., for gh: which orgs/repos; for jira: which projects)
Leave blank for no filtering.
```

Store the answer as `<scope>`. If blank, set to empty string.
</step>

<step name="learn-capabilities">
Determine if the tool is well-known (gh, jira, kubectl) or unknown. For well-known tools, synthesize capabilities from training data. Do NOT parse --help for well-known tools.

**gh (GitHub CLI) — training data baseline:**

If `<scope>` is set, add `--owner=<org>` to each search command for each org in scope (space-separated). If scope contains specific repos (format `owner/repo`), use `--repo=<owner/repo>` instead. If scope is empty, do not add owner/repo filters.

- list-assigned-prs: `gh search prs --assignee=@me --state=open --json number,title,url --limit 20`
- list-review-requests: `gh search prs --review-requested=@me --state=open --json number,title,url --limit 20`
- list-assigned-issues: `gh search issues --assignee=@me --state=open --json number,title,url --limit 20`

**jira (ankitpokhrel/jira-cli) — training data baseline:**

If `<scope>` is set, add `-p<project>` to each command for each project in scope (space-separated). If scope is empty, do not add project filters.

- list-sprint-issues: `jira sprint list --current -a$(jira me) --plain`
- list-my-issues: `jira issue list -a$(jira me) --plain`

**kubectl — training data baseline:**

If `<scope>` is set, replace `--all-namespaces` with `-n <namespace>` for each namespace in scope. If scope is empty, keep `--all-namespaces`.

- list-pods: `kubectl get pods --all-namespaces --field-selector=status.phase!=Succeeded -o wide`
- list-failing: `kubectl get pods --all-namespaces --field-selector=status.phase=Failed -o wide`

For **unknown tools**, run `<command> --help 2>&1 | head -80` via Bash and use Claude's understanding to identify 3–5 capabilities relevant to daily task management. If `<scope>` is set, incorporate the scope into the CLI invocations where appropriate. Format each as `name: <cli invocation>`.

Store the full list as `<available_capabilities>`.
</step>

<step name="select-capabilities">
Present `<available_capabilities>` to the user via AskUserQuestion with multi-select. All capabilities are checked by default. The question text:

```
Which capabilities should Donna use for <tool_name>? (deselect any you don't want, or type additional ones)
```

If the user types additional capabilities as free text, parse them into the same `name: command` format.

Store the final selections as `<selected_capabilities>`.
</step>

<step name="write-tools-md">
Read `<storage_repo>/donna/tools.md` with the Read tool. If the file does not exist, create it with:
```markdown
---
# tools.md — managed by donna:add-tool
---
```

Upsert (not overwrite) the tool's section. Each tool section has this format:
```markdown
## <tool_name>

- command: <command>
- type: cli
- version: <version>
- learned: <today's date YYYY-MM-DD>
- auth_test: <auth_test_command or "none">
- scope: <scope or "none">

### Capabilities
- <capability_name>: <cli_invocation>
```

If a section for this tool already exists in tools.md, replace it entirely. Write the full file back with the Write tool. Preserve all other tool sections unchanged.
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
git -C <storage_repo> commit -m "donna(add-tool): added <tool_name>"
```

If `auto_push` is true in config, also run:
```bash
git -C <storage_repo> push
```
</step>

<step name="confirm">
Print:
```
✓ Added <tool_name> to tools registry
  Command: <command>
  Version: <version>
  Capabilities: <count> configured

  Run /donna:begin-the-day to see tool data in your daily brief.
```

If in batch mode, repeat steps ask-tool-name through confirm for each remaining tool in `<noted_tools>`, then print a final summary:
```
✓ Configured <N> tools: <tool_name_1>, <tool_name_2>, ...
```
</step>
