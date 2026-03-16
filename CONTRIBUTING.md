# Contributing to Donna

Thanks for your interest in contributing! This guide covers local setup, project structure, and how to add new skills.

## Prerequisites

- Node.js 18+
- An AI coding assistant (tested with [Claude Code](https://docs.anthropic.com/en/docs/claude-code))

## Local Development Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/pingvinen/donna.git && cd donna
   ```

2. **Install dev dependencies**
   ```bash
   npm install
   ```

3. **Link the package locally**
   ```bash
   npm link
   ```
   This makes `donna-assistant` available globally on your machine so you can test changes end-to-end.

4. **Run the installer in dev mode**
   ```bash
   donna-assistant
   ```
   Or, if the link is not in your PATH yet: `npx donna-assistant`

   This copies skill stubs from your local `stubs/` to `~/.claude/commands/donna/` and workflows from `workflows/` to `~/.donna/workflows/`.

5. **Iterate on a skill**
   - Edit the workflow file in `workflows/`
   - Re-run `donna-assistant` to copy the updated file into place
   - Invoke the skill in Claude Code to test it

## Project Structure

```
src/                        # Installer, migrator, version tracking, output helpers (CJS)
stubs/claude-code/donna/    # Skill stubs (copied to ~/.claude/commands/donna/ on install)
workflows/                  # Skill workflows (copied to ~/.donna/workflows/ on install)
migrations/                 # Cumulative migration scripts (run in order on upgrade)
templates/                  # File templates used by skills
references/                 # Reference docs bundled with install
test/                       # Tests using node:test + node:assert/strict
```

## Running Tests

```bash
npm test
```

Runs `node --test 'test/*.test.cjs'`. All tests must pass before merging.

## Adding a New Skill

1. Create a stub at `stubs/claude-code/donna/<name>.md` with YAML frontmatter:
   ```yaml
   ---
   name: donna:<name>
   description: One-line description of what the skill does
   allowed-tools: Bash, Read, Write, Edit
   ---
   ```

2. Create a workflow at `workflows/<name>.md` with an XML-tagged prompt structure using `<step>` blocks.

3. The installer's recursive copy picks up new files automatically — no changes to `installer.cjs` needed.

4. Update the skill list in the installer success message (in `src/installer.cjs`).

5. Add the skill to the "All commands" table in `README.md`.

6. Add test coverage in `test/stubs.test.cjs`.

## Conventions

See [CLAUDE.md](./CLAUDE.md) for the full list. Key highlights:

- Always write "Donna" (capital D, lowercase rest) in display text and documentation — never "DONNA"
- Update README.md whenever features are added, removed, or renamed
- No git operations from subagents — commits and pushes happen in the main conversation context

## Submitting Changes

1. Fork the repo and create a branch for your change
2. Make your changes (commit often)
3. Open a pull request with a semantic title (this repo uses `amannn/action-semantic-pull-request`)

PR titles should follow the format: `feat: add donna:my-skill`, `fix: handle missing version file`, `docs: update contributing guide`, etc.
