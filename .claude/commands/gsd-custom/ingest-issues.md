---
name: gsd-custom:ingest-issues
description: Ingest open GitHub issues into GSD as TODOs with provenance tracking
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Batch-process all open GitHub issues on `pingvinen/donna` that lack both `ingested` and `not-for-ingestion` labels. For each issue: classify it as a bug report, feature request, or neither; check for duplicate TODOs in the pending queue; create one or more TODO files with provenance; comment on the issue listing the TODOs created; and apply the appropriate label.

This is internal developer tooling — not a Donna product skill. It is not shipped via npm or registered in the installer.
</objective>

<process>

<step name="check-gh-auth">
Verify the GitHub CLI is authenticated before doing anything else. Run:

```bash
gh auth status
```

If this fails or shows "not logged in", stop immediately and tell the developer to run `gh auth login` first.
</step>

<step name="ensure-labels">
Auto-create the required labels if they do not already exist on the repo. These are idempotent — the `|| true` prevents failure if the label already exists:

```bash
gh label create "ingested" --description "Issue has been ingested into GSD" --color "1b157c" --repo pingvinen/donna 2>/dev/null || true
gh label create "not-for-ingestion" --description "Not suitable for GSD ingestion" --color "25b3f7" --repo pingvinen/donna 2>/dev/null || true
```
</step>

<step name="list-issues">
Fetch all open issues with their labels:

```bash
gh issue list --repo pingvinen/donna --state open --json number,title,body,labels --limit 100
```

Parse the JSON output and filter out any issues that already have either the `ingested` or `not-for-ingestion` label. Use Claude reasoning to identify which labels are present in the `labels` array.

If no issues remain after filtering, print: "No new issues to ingest." and stop — this is not an error.

Print how many issues will be processed before starting the main loop.
</step>

<step name="read-pending-todos">
Load all existing pending TODOs for use in duplicate detection. Use Glob to find all files matching `.planning/todos/pending/*.md`, then Read each one. Collect the `title` from each file's YAML frontmatter and the full content for semantic comparison.

If no pending TODOs exist yet, note that and continue — no duplicate check needed.
</step>

<step name="process-issues">
For each filtered issue, run through the following sub-steps in order. Apply the `ingested` label as the VERY LAST action per issue — this is the atomicity guard: if anything fails before the label is applied, the issue will be retried on the next run.

**5a. Read full issue details:**

```bash
gh issue view <number> --repo pingvinen/donna --json number,title,body,comments,labels
```

**5b. Classify the issue:**

Analyze the issue title and body to determine if it is:
- A **bug report** — describes unexpected behavior, errors, crashes, or things that are broken
- A **feature request** — describes new functionality, enhancements, or improvements
- **Neither** — a question, discussion, meta issue, documentation request, or anything that does not map to actionable development work

If **neither**: Apply the `not-for-ingestion` label immediately and skip to the next issue:
```bash
gh issue edit <number> --add-label "not-for-ingestion" --repo pingvinen/donna
```
Print: "Skipped issue #<number> '<title>' — applied not-for-ingestion label."

If **unclear** (could be bug or feature, or intent is ambiguous): Use AskUserQuestion to ask the developer inline:
"Issue #<number>: '<title>' — Classify as: bug, feature, or skip (not-for-ingestion)?"

Wait for the response and proceed accordingly. If the developer says "skip", apply `not-for-ingestion` and move on.

**5c. Duplicate check:**

Compare the issue title and description semantically against all pending TODO titles collected in step 4. Look for similar meaning, not just substring matches — account for synonyms, rephrasing, and partial overlap.

If a match is found, use AskUserQuestion:
"Issue #<number> '<title>' looks similar to existing TODO '<matching_todo_title>'. How should I proceed? Options: skip (don't ingest), merge (add ref to existing TODO), or create-anyway (create a new TODO regardless)"

- If **skip**: Print a note and move to the next issue. Do NOT apply `ingested` label (the issue will be available for future ingestion if needed).
- If **merge**: Add `github_issue: <number>` to the existing TODO's frontmatter and append `(also ref: #<number>)` to its title. Then proceed to step 5e (comment) and 5f (label).
- If **create-anyway**: Proceed with TODO creation below.

**5d. Create TODO file(s):**

One issue may describe multiple pieces of work. Use Claude reasoning to determine if the issue should be split into multiple TODOs. For each piece of work identified, create one TODO file.

Determine the current date in ISO format for the filename and `created` field.

For each TODO, write a file using the Write tool at:
`.planning/todos/pending/<YYYY-MM-DD>-<slugified-title>.md`

Slugify the title by lowercasing, replacing spaces with hyphens, and removing special characters. Keep it concise (max 50 chars for the slug portion).

TODO file format:

```markdown
---
created: <ISO timestamp e.g. 2026-03-26T19:00:00.000Z>
title: <Descriptive title summarizing the work> (ref: #<issue_number>)
area: <inferred area: general | tooling | ci | docs | testing>
github_issue: <issue_number as integer>
files: []
---

## Problem

<Summarize the problem from the issue title and body. Be concise — 2-4 sentences. Capture the "what is broken" or "what is missing".>

## Solution

<If the issue body describes an approach or solution, summarize it here. Otherwise write: TBD>
```

**5e. Comment on the issue:**

After all TODOs for this issue are written, post a comment listing them:

```bash
gh issue comment <number> --repo pingvinen/donna --body "Ingested into GSD:
- <TODO title 1>
- <TODO title 2>"
```

If only one TODO was created, the list will have a single item.

**5f. Apply the ingested label (LAST step):**

```bash
gh issue edit <number> --add-label "ingested" --repo pingvinen/donna
```

This MUST be the last step for each issue. The `ingested` label signals that the issue has been fully processed. If this step is skipped or fails, the issue will be retried on the next run (which is correct behavior — the TODO files are idempotent via the duplicate check).

Print: "Ingested issue #<number> '<title>' — created <N> TODO(s)."
</step>

<step name="stage-and-summarize">
Stage all new TODO files so they are ready to commit:

```bash
git add .planning/todos/pending/
```

Print a final summary:
```
Ingestion complete.
  Issues processed: X
  TODOs created: Y
  Issues skipped (not-for-ingestion): Z
  Issues skipped (duplicate/user): W

TODO files staged — ready to save. Create a commit in your main terminal to persist the new TODO files.
```

Do NOT invoke a VCS commit from this skill. The developer must commit manually in the main conversation context due to SSH signing requirements (1Password).
</step>

</process>
