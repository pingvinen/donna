# Donna Help Workflow

<objective>
Provide interactive troubleshooting by inspecting Donna's state and guiding the user through diagnosing and resolving issues.
</objective>

<step name="banner">
Print the Donna banner:
```
━━━ Donna ▸ Help ━━━
```
</step>

<step name="read-config">
Read `~/.config/donna/config.md`.

If the file does not exist, print:
```
✗ Donna is not configured. Run /donna:setup first.
```
Stop.

Extract the `storage_repo`, `daily_folder` (default: `daily`), and `auto_push` (default: false) fields from the YAML frontmatter.
</step>

<step name="ask-problem">
Use AskUserQuestion:

```
What do you need help with?

Some things I can help diagnose:
- Configuration issues
- Storage repo problems
- Skills not working
- Tool integration issues
- General questions about how Donna works

Describe what's going on:
```

Store the response as `<user_problem>`.
</step>

<step name="diagnose">
Based on `<user_problem>`, inspect relevant state using keyword matching to determine the category and run the appropriate checks.

**Config issues** (keywords: config, setup, configure, path):

Run via Bash:
```bash
test -d <storage_repo> && echo "EXISTS" || echo "MISSING"
```
```bash
git -C <storage_repo> status 2>&1 | head -1
```

Display the contents of `~/.config/donna/config.md`. Report:
- Whether the storage_repo path exists
- Whether it is a valid git repository

**Storage issues** (keywords: storage, repo, git, daily, file, missing):

Run via Bash:
```bash
test -d <storage_repo> && echo "EXISTS" || echo "MISSING"
```
```bash
git -C <storage_repo> status 2>&1 | head -1
```
```bash
ls <storage_repo>/donna/ 2>/dev/null
```
```bash
ls <storage_repo>/<daily_folder>/ 2>/dev/null | tail -5
```
```bash
git -C <storage_repo> status --short 2>/dev/null
```

Report whether the storage repo exists and is a git repo, whether the donna/ subfolder is present, the most recent daily files, and any uncommitted changes.

**Skill issues** (keywords: skill, command, slash, workflow, not working, error):

Run via Bash:
```bash
ls ~/.claude/commands/donna/ 2>/dev/null
```
```bash
ls ~/.donna/workflows/ 2>/dev/null
```

Read `~/.donna/version.md` with the Read tool (if it exists).

Report the installed stubs and workflows, compare their counts, and print the Donna version.

**Tool issues** (keywords: tool, gh, jira, integration, pull, refresh):

Read `<storage_repo>/donna/tools.md` with the Read tool if it exists.

For each tool found in tools.md, run via Bash:
```bash
which <tool_name> 2>/dev/null
```

If `gh` is a configured tool, also run:
```bash
gh auth status 2>&1
```

Report which tools are installed and authenticated.

**General / no clear category** (catch-all when no keyword matches):

Run all checks from the above categories and present a full health summary. Include:
- Donna version (from `~/.donna/version.md`)
- Config status (file exists, storage_repo path valid)
- Storage status (git repo exists, donna/ and daily/ present, uncommitted changes)
- Installed skills count (stubs in `~/.claude/commands/donna/`, workflows in `~/.donna/workflows/`)
- Configured tools (from `<storage_repo>/donna/tools.md`)

After running diagnostics, present findings clearly:
- Use `✓` for things that look good
- Use `✗` for things that look broken
- Provide specific fix suggestions for each `✗` item
</step>

<step name="follow-up">
Use AskUserQuestion:

```
Did that help? You can:
1. Ask about something else
2. Submit a bug report or feature idea (I'll point you to /donna:contribute-idea)
3. Done — I'm all set

What would you like to do?
```

Handle each option:

- **Option 1:** Ask the user for a new description of their issue. Loop back to the diagnose step with the new question.

- **Option 2:** Print:
  ```
  Tip: Run /donna:contribute-idea to submit ideas or bug reports via GitHub Issues.
  ```
  Stop.

- **Option 3:** Print:
  ```
  ✓ Glad I could help!
  ```
  Stop.
</step>
