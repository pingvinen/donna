# Donna Setup Workflow

<objective>
Guide the user through configuring Donna: set the storage repo path, initialize the file structure, and write the bootstrap config at ~/.config/donna/config.md.
</objective>

<step name="banner">
Print the DONNA banner:
```
━━━ DONNA ▸ Setup ━━━
```
</step>

<step name="check-existing-config">
Read `~/.config/donna/config.md`.

If the file exists, proceed to the re-run menu (step: rerun-menu).
If the file does not exist, proceed to first-run setup (step: ask-storage-path).
</step>

<step name="rerun-menu">
An existing Donna configuration was found. Use AskUserQuestion to present the user with this menu:

```
Donna is already configured. What would you like to do?

1. Change storage repo path
2. View current config
3. Reset (start over — deletes config and re-runs full setup)
4. Cancel
```

Handle each option:

- **Option 1:** Ask the user for the new storage repo path using AskUserQuestion. Validate and expand the path (run `echo <path>` via Bash to expand ~). Update `~/.config/donna/config.md` with the new storage_repo value. Print `✓ Storage repo updated.` then print the summary (step: summary).

- **Option 2:** Display the contents of `~/.config/donna/config.md`. Then stop.

- **Option 3:** Run `rm ~/.config/donna/config.md` via Bash to delete the config. Proceed to first-run setup (step: ask-storage-path).

- **Option 4:** Print `Setup cancelled.` and stop.
</step>

<step name="ask-storage-path">
Use AskUserQuestion to ask the user:

```
Where is your Donna storage repo?

This is a local git repository where Donna stores your daily journal, tasks, and configuration. You can point to an existing git repo, an empty directory (Donna will initialize it), or a path that doesn't exist yet (Donna will create it).

Enter the path (e.g. ~/Documents/donna-notes):
```

Wait for the user's response. Store the path as `<storage_path>`.
</step>

<step name="expand-and-validate-path">
Expand the path provided by the user:

Run via Bash:
```bash
echo <storage_path>
```

Use the expanded absolute path for all subsequent steps. Store as `<repo>`.

Then check the path status:

- If `<repo>` is an existing git repo (test: `git -C <repo> rev-parse --is-inside-work-tree 2>/dev/null`): use it as-is. Print `✓ Using existing git repo at <repo>`.

- If `<repo>` exists as a directory but is not a git repo: run `git -C <repo> init`. Print `✓ Initialized git repo at <repo>`.

- If `<repo>` does not exist: run `mkdir -p <repo>` then `git -C <repo> init`. Print `✓ Created and initialized git repo at <repo>`.
</step>

<step name="create-storage-structure">
Create the daily directory:

Run via Bash:
```bash
mkdir -p <repo>/daily
```

Print:
```
✓ Created daily/ directory
```
</step>

<step name="write-bootstrap-config">
Create the config directory if it does not exist:

Run via Bash:
```bash
mkdir -p ~/.config/donna
```

Write `~/.config/donna/config.md` with the following content (substituting the actual expanded path for `<repo>`):

```markdown
---
storage_repo: <repo>
auto_push: false
---

# Donna Configuration

This file is managed by `/donna:setup`. All Donna skills read this file to find your storage repo.
```

Print:
```
✓ Wrote config at ~/.config/donna/config.md
```
</step>

<step name="initial-commit">
Check whether there is anything to commit:

Run via Bash:
```bash
git -C <repo> status --porcelain
```

If the output is non-empty (there are changes to commit):

Run:
```bash
git -C <repo> add -A
git -C <repo> commit -m "donna(setup): initialize storage"
```

Print:
```
✓ Committed initial structure
```

If the output is empty (nothing to commit), skip the commit and continue.
</step>

<step name="summary">
Print the completion summary:

```
✓ Donna is ready!

Storage repo: <repo>
Config: ~/.config/donna/config.md

Next steps:
  - Run /donna:add-task to capture your first task
  - Run /donna:done to mark tasks complete
```
</step>
