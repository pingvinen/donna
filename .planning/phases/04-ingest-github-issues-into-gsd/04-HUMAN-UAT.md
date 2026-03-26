---
status: complete
phase: 04-ingest-github-issues-into-gsd
source: [04-VERIFICATION.md]
started: 2026-03-26T22:00:00Z
updated: 2026-03-26T22:40:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Live issue ingestion
expected: Run gsd-custom:ingest-issues on a repo with open, unlabelled issues. Issues are classified, TODO files created with github_issue frontmatter and (ref: #N) in title, ingested label applied last, comment posted on each issue.
result: pass

### 2. Release workflow integration
expected: Run release workflow on a branch with done/ TODOs that have github_issue fields. post-release-comments.cjs closes matching issues with "Resolved in vX.Y.Z" and comments on merged PRs with "Released in vX.Y.Z".
result: issue
reported: "CLAUDE.md workflow step 9 says 'ensure completed TODOs are removed' but post-release-comments.cjs scans .planning/todos/done/ — step 9 should say move to done/, and step 10 should note that done/ TODOs with github_issue fields are used by the release workflow to close issues"
severity: major

## Summary

total: 2
passed: 1
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "CLAUDE.md workflow correctly describes moving TODOs to done/ before release so post-release-comments.cjs can find them"
  status: failed
  reason: "User reported: CLAUDE.md workflow step 9 says 'ensure completed TODOs are removed' but post-release-comments.cjs scans .planning/todos/done/ — step 9 should say move to done/, and step 10 should note that done/ TODOs with github_issue fields are used by the release workflow to close issues"
  severity: major
  test: 2
  artifacts: []
  missing: []
