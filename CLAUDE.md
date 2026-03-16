# Donna — Project Conventions

## Naming
- Always write "Donna" (capital D, lowercase rest) in display text and documentation — never "DONNA". Shell variables like `DONNA_DIR` are fine (bash convention).

## Documentation
- Update README.md whenever features are added, removed, or renamed. Include README changes in the same commit or PR as the code change.

## File Format
- All Donna runtime files (`~/.donna/` and storage repo) must be Obsidian-compatible: plain markdown with YAML frontmatter, standard folder structure. No proprietary formats.
- Daily files go in a flat folder (e.g., `daily/`) — Obsidian Calendar plugin is folder-sensitive.

## Development Approach
- **Real skills, not throwaway dummies:** When a placeholder is needed to prove the pipeline, stub a real skill — don't create a dummy skill that needs cleanup later.
- **No formal milestones:** Work from a backlog, ship what's important. Releases happen organically when enough value has accumulated. Archive completed phase artifacts periodically for context hygiene, not as milestone ceremony.
- **Run code linting:** PR validation runs a linting check, so make sure to run `npm run lint:fix` before committing.

## Version & Dependency Checks
- Never assume a dependency or tool version is "the latest" based on training data. Always verify against the authoritative source (GitHub releases, npm registry, etc.).

## Git & CI
- **Stage early, commit often:** Stage changes with `git add` frequently. Commit at natural checkpoints throughout a task — not only at the end. This protects against token exhaustion mid-work.
- **No git commit/push from subagents:** Git operations that require signing (commit, push) must run in the main conversation context. Subagents can stage files but must leave committing to the orchestrator. (Commit signing tools like 1Password require interactive approval that hangs in subprocesses.)
- **Push main before phase execution:** Planning/research artifacts are committed on main. Before creating a feature branch for execution, ensure main is pushed to origin so metadata is available remotely.
- **PR assignment:** Always include `--assignee @me` when creating pull requests with `gh pr create`.
- **PR titles:** Must follow conventional commits with `<type>(<scope>): <description>` where `scope` is the GSD phase number.
