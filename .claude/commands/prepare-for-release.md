---
name: prepare-for-release
description: Review pending TODOs before release — move completed ones to done/ and stamp review marker
allowed-tools:
  - Bash
  - Skill
  - AskUserQuestion
---

<objective>
Prepare the repository for a release by checking whether pending TODOs
have been implemented. Uses `/gsd:do` to investigate and move completed
TODOs to `done/`, then stamps the review marker so the pre-release CI
check passes.
</objective>

<process>

<step name="check">
**Run the pre-release check:**

```bash
node scripts/pre-release-check.cjs
```

If the check already passes, tell the user and stop — no review needed.
</step>

<step name="review">
**Review pending TODOs using GSD:**

Invoke the Skill tool:
- skill: `gsd:fast`
- args: `Review all pending TODOs in .planning/todos/pending/. For each one, check whether the described work has been implemented in the codebase. Move any completed TODOs to .planning/todos/done/ and update the Pending Todos list in .planning/STATE.md. Do not commit — only stage changes.`
</step>

<step name="stamp">
**Write the review marker:**

```bash
date -u +%Y-%m-%dT%H:%M:%S.000Z > .planning/todos/.last-reviewed
git add .planning/todos/.last-reviewed
```

Verify:
```bash
node scripts/pre-release-check.cjs
```
</step>

<step name="remind">
**Next steps:**

```
Pre-release review complete. Next:
  1. Commit the staged changes (review marker + any TODO moves)
  2. Push to main
  3. Run the "Create Release" workflow in GitHub Actions
```
</step>

</process>

<critical_rules>
- **Do not commit.** Stage files but leave committing to the main context (SSH signing constraint).
- **Do not remove github_issue fields.** They are provenance needed by the release script when in done/.
</critical_rules>
