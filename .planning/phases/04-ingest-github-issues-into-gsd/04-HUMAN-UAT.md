---
status: partial
phase: 04-ingest-github-issues-into-gsd
source: [04-VERIFICATION.md]
started: 2026-03-26T22:00:00Z
updated: 2026-03-26T22:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Live issue ingestion
expected: Run gsd-custom:ingest-issues on a repo with open, unlabelled issues. Issues are classified, TODO files created with github_issue frontmatter and (ref: #N) in title, ingested label applied last, comment posted on each issue.
result: [pending]

### 2. Release workflow integration
expected: Run release workflow on a branch with done/ TODOs that have github_issue fields. post-release-comments.cjs closes matching issues with "Resolved in vX.Y.Z" and comments on merged PRs with "Released in vX.Y.Z".
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
