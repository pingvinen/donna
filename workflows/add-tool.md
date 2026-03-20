# Donna Add-Tool Workflow

<objective>
Declare an external tool (CLI, REST API, GraphQL API, or MCP server), verify its connectivity, learn its capabilities, and persist the result to tools.md in the storage repo.
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

**`backfill-tool-type`:** Backfill `type` on existing tool sections in tools.md using heuristic detection.

Read `<storage_repo>/donna/tools.md` with the Read tool. If the file does not exist or has no tool sections, skip this handler.

For each tool section (starting with `## <tool_name>`), check if a `- type:` line already exists. If the `- type:` line is missing, detect the correct type:

1. If the tool section contains a `- command:` line where the value starts with `mcp:` (e.g., `- command: mcp:linear`), insert `- type: mcp` immediately after the `- command:` line.
2. Else, if the tool section contains a `- base_url:` line:
   - If the capabilities section contains entries that look like GraphQL queries (contain `query {` or `mutation {`), insert `- type: graphql` immediately after `## <tool_name>` (REST/GraphQL tools have no `- command:` line).
   - Otherwise, insert `- type: rest` immediately after `## <tool_name>`.
3. Else (no `mcp:` prefix, no `base_url` field), insert `- type: cli` immediately after the `- command:` line.

Write the updated file back with the Write tool. If any changes were made, commit:
```bash
git -C <storage_repo> add -A
git -C <storage_repo> diff --cached --quiet || git -C <storage_repo> commit -m "donna(migrate): backfill tool types on existing tools"
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
</step>

<step name="ask-tool-type">
Use AskUserQuestion:
```
What type of tool is <tool_name>?

1. CLI — runs shell commands (e.g., gh, jira, kubectl)
2. REST API — HTTP endpoints (e.g., GitHub API, Slack API)
3. GraphQL API — GraphQL endpoint (e.g., Linear, GitHub GraphQL)
4. MCP server — Claude Code MCP tool (e.g., linear, postgres)
```

Store the answer as `<tool_type>`: one of `cli`, `rest`, `graphql`, `mcp`.

**If type is `cli`:** Use AskUserQuestion to confirm or override the CLI command:
```
CLI command for <tool_name>? (default: <tool_name>)
```
If the tool name is in `<noted_tools>`, pre-fill any context from set-role notes. If the user presses enter without typing, use the default. Store the confirmed CLI command as `<command>`.

**If type is `rest` or `graphql`:**

The base URL is the root API endpoint (for example, https://api.github.com for GitHub REST or https://api.linear.app/graphql for Linear). Guide the user if they seem unsure, but do not include examples in the AskUserQuestion prompt text — inline examples render as picker options in Claude Code.

Use AskUserQuestion:
```
What is the base URL for <tool_name>?
```
Store as `<base_url>`. Set `<command>` to `<base_url>` (for display purposes).

**If type is `mcp`:** Skip the command question. Set `<command>` to `mcp`.
</step>

<step name="verify-installation">
If `<tool_type>` is not `cli`, skip this step.

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
**If `<tool_type>` is `cli`:**

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

**If `<tool_type>` is `rest` or `graphql`:**

Common auth headers include Authorization (for Bearer tokens) and X-API-Key. Do not include examples in the prompt text.

Use AskUserQuestion to ask for the auth header name:
```
What auth header does <tool_name> use? Default: Authorization
```
Store as `<auth_header>` (default: `Authorization` if blank).

The key name should match the service convention (e.g., GITHUB_TOKEN, SLACK_TOKEN, LINEAR_API_KEY). Guide the user if needed but keep examples out of the prompt.

Use AskUserQuestion to ask for the secret key name:
```
What should the secret key be called in secrets.md for <tool_name>?
```
Store as `<auth_secret>`.

**Set up secrets.md:**
Read `<storage_repo>/donna/secrets.md` with the Read tool. If the file does not exist, create it with:
```markdown
---
# secrets.md -- managed by user, never by donna
# Auto-added to .gitignore
---
```

Check if `<auth_secret>` already appears in secrets.md. If not, append a placeholder line:
```
<auth_secret>: REPLACE_WITH_YOUR_SECRET
```

Write the updated secrets.md.

**Ensure secrets.md is gitignored:**
Read `<storage_repo>/.gitignore` with the Read tool. If the file does not exist or does not contain `donna/secrets.md`, append `donna/secrets.md` to `.gitignore` and write back. If `.gitignore` does not exist, create it with `donna/secrets.md` as its sole content.

**Validate API connectivity:**
Read `<storage_repo>/donna/secrets.md` to get the current value for `<auth_secret>`. If the value is `REPLACE_WITH_YOUR_SECRET` or the key is absent, print:
```
! No secret set for <auth_secret> — edit donna/secrets.md before testing connectivity.
```
Skip validation.

If a real secret value exists, run via Bash:
```bash
curl -s -o /dev/null -w "%{http_code}" -H "<auth_header>: <resolved_secret>" <base_url> 2>&1
```
- 200-299: print `✓ API reachable at <base_url>`
- 401/403: print `! Authentication failed — check <auth_secret> in donna/secrets.md`
- Other/timeout: print `! Could not reach <base_url>`

**If `<tool_type>` is `mcp`:**
Print `ℹ MCP server auth is managed in Claude Code settings. Skipping auth test.`
</step>

<step name="ask-scope">
**If `<tool_type>` is `cli`:**

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

**If `<tool_type>` is `rest` or `graphql`:**

Use AskUserQuestion:
```
What scope should Donna use for <tool_name>? (e.g., specific endpoints or resource filters to apply)
Leave blank for no filtering.
```

**If `<tool_type>` is `mcp`:**

Use AskUserQuestion:
```
What scope should Donna use for <tool_name>? (e.g., specific resources to monitor)
Leave blank for no filtering.
```

Store the answer as `<scope>`. If blank, set to empty string.
</step>

<step name="learn-capabilities">
**If `<tool_type>` is `cli`:**

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

**If `<tool_type>` is `rest`:**

Use AskUserQuestion:
```
Define capabilities for <tool_name>. Each capability is a name and HTTP method + path.
Format: <name>: <METHOD> /path?params

Examples:
- list-issues: GET /repos/{owner}/{repo}/issues?state=open
- my-profile: GET /user

Enter capabilities (one per line, blank line when done):
```

**If `<tool_type>` is `graphql`:**

Use AskUserQuestion:
```
Define capabilities for <tool_name>. Each capability is a name and a GraphQL query (single line).
Format: <name>: query { ... }

Examples:
- my-issues: query { viewer { issues(first: 20, states: OPEN) { nodes { title url } } } }

Enter capabilities (one per line, blank line when done):
```

**If `<tool_type>` is `mcp`:**

Use AskUserQuestion:
```
Define capabilities for <tool_name>. Each capability is a name and an MCP tool reference.
Format: <name>: mcp:<server_name>/<tool_name>

Examples:
- list-issues: mcp:linear/list_issues
- search-docs: mcp:notion/search

Enter capabilities (one per line, blank line when done):
```

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

Upsert (not overwrite) the tool's section. Each tool section has a type-specific format:

**CLI tools:**
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

**REST API tools:**
```markdown
## <tool_name>

- type: rest
- base_url: <base_url>
- auth_header: <auth_header>
- auth_secret: <auth_secret>
- scope: <scope or "none">
- learned: <today's date YYYY-MM-DD>

### Capabilities
- <capability_name>: <METHOD> /path
```

**GraphQL API tools:**
```markdown
## <tool_name>

- type: graphql
- base_url: <base_url>
- auth_header: <auth_header>
- auth_secret: <auth_secret>
- scope: <scope or "none">
- learned: <today's date YYYY-MM-DD>

### Capabilities
- <capability_name>: <graphql_query>
```

**MCP server tools:**
```markdown
## <tool_name>

- type: mcp
- learned: <today's date YYYY-MM-DD>

### Capabilities
- <capability_name>: mcp:<server>/<tool>
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
**If `<tool_type>` is `cli`:**

Print:
```
✓ Added <tool_name> to tools registry
  Command: <command>
  Version: <version>
  Capabilities: <count> configured

  Run /donna:begin-the-day to see tool data in your daily brief.
```

**If `<tool_type>` is `rest` or `graphql`:**

Print:
```
✓ Added <tool_name> to tools registry (type: <tool_type>)
  Base URL: <base_url>
  Capabilities: <count> configured
  Secrets: Edit donna/secrets.md to set <auth_secret>

  Run /donna:begin-the-day to see tool data in your daily brief.
```

**If `<tool_type>` is `mcp`:**

Print:
```
✓ Added <tool_name> to tools registry (type: mcp)
  Capabilities: <count> configured

  Ensure the MCP server is configured in Claude Code settings.
  Run /donna:begin-the-day to see tool data in your daily brief.
```

If in batch mode, repeat steps ask-tool-name through confirm for each remaining tool in `<noted_tools>`, then print a final summary:
```
✓ Configured <N> tools: <tool_name_1>, <tool_name_2>, ...
```
</step>
