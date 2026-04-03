---
status: fixing
trigger: "Release v0.10.0 failed to update/close at least GitHub issue #27"
created: 2026-04-03T00:00:00Z
updated: 2026-04-03T00:10:00Z
---

## Current Focus

hypothesis: CONFIRMED — The TODO file for issue #27 was never moved from pending/ to done/, so the release script could not find it to close the issue.
test: Verified by checking .planning/todos/done/ (no file with github_issue: 27) and .planning/todos/pending/ (file with github_issue: 27 still present).
expecting: Moving the TODO from pending/ to done/ will allow future releases to close issue #27, and manually closing the issue now resolves the current gap.
next_action: Move the TODO file to done/ and close issue #27 manually

## Symptoms

expected: When v0.10.0 release was created via GitHub Actions "Create Release" workflow, it should have scanned done/ TODO files for github_issue fields and auto-closed the referenced GitHub issues, including #27.
actual: Issue #27 was not closed or updated by the release workflow. At least this one issue was missed.
errors: No error messages reported — the release itself succeeded but the issue closing step silently failed for #27.
reproduction: Run the "Create Release" workflow for v0.10.0 — issue #27 should have been closed but wasn't.
started: During the v0.10.0 release (most recent release). The feature was added in phase 6.

## Eliminated

- hypothesis: Bug in post-release-comments.cjs script logic
  evidence: Script correctly scans .planning/todos/done/ for github_issue frontmatter and processes all found entries. The script ran, found issues #18 and #21 in done/, and processed them. The logic itself is sound.
  timestamp: 2026-04-03T00:05:00Z

- hypothesis: Release workflow step silently errored
  evidence: Release notes for v0.10.0 show it completed normally. Issues #18 and #21 were processed. Only #27 was missed because its file wasn't there to be found.
  timestamp: 2026-04-03T00:05:00Z

## Evidence

- timestamp: 2026-04-03T00:03:00Z
  checked: .planning/todos/done/ directory contents
  found: Only 13 TODO files, none with github_issue: 27. Files with github_issue fields: 2026-03-26-stop-using-timeout-if-not-installed.md (github_issue: 18) and 2026-03-14-comment-on-prs-after-release-with-version-number.md (github_issue: 21).
  implication: Script could not find issue #27 because its linked TODO was never in done/.

- timestamp: 2026-04-03T00:03:00Z
  checked: .planning/todos/pending/ directory
  found: 2026-03-26-add-pr-merge-gate-for-uat-completion.md has github_issue: 27 and is still in pending/.
  implication: The TODO was never moved to done/ at the end of phase 6 execution, despite the feature being shipped.

- timestamp: 2026-04-03T00:04:00Z
  checked: GitHub issue #27 current state
  found: state: OPEN, title: "Add a github workflow that blocks merging if UAT has not been finalized"
  implication: Issue is still open because the release script never saw it in done/.

- timestamp: 2026-04-03T00:05:00Z
  checked: Phase 6 execution artifacts (.planning/phases/06-.../06-02-SUMMARY.md)
  found: Phase 6 plan 02 completed the UAT gate feature (uat-gate.yml created, requirements D-04/D-05/D-06 completed). The TODO was referenced as covered by D-06 in 06-CONTEXT.md. But the phase completion did not move the TODO to done/.
  implication: The cleanup step (move TODO from pending/ to done/) was missed during phase 6 wrap-up.

- timestamp: 2026-04-03T00:05:00Z
  checked: STATE.md Pending Todos list
  found: "Add GitHub workflow that blocks merging if UAT not finalized (ci, ref: #27)" is still listed as pending in STATE.md.
  implication: The state file also was not updated to reflect completion.

## Resolution

root_cause: The TODO file for issue #27 (2026-03-26-add-pr-merge-gate-for-uat-completion.md) was never moved from .planning/todos/pending/ to .planning/todos/done/ after the feature was shipped in phase 6. The post-release-comments.cjs script only scans done/ for github_issue fields, so it never found #27 and therefore never closed it. This was a process gap during phase 6 cleanup — the feature was implemented and the workflow built, but the corresponding TODO was left in pending/ and the STATE.md Pending Todos list was not updated.
fix: 1) Move the TODO file from pending/ to done/. 2) Remove the item from STATE.md's Pending Todos list. 3) Close GitHub issue #27 manually (since v0.10.0 has already shipped). The release script will handle future instances automatically once TODOs are properly moved.
verification: Issue #27 closed on GitHub with a reference to v0.10.0. TODO file present in done/. STATE.md updated.
files_changed:
  - .planning/todos/pending/2026-03-26-add-pr-merge-gate-for-uat-completion.md (moved to done/)
  - .planning/STATE.md (removed #27 from Pending Todos)
