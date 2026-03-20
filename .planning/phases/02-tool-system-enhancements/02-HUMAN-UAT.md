---
status: partial
phase: 02-tool-system-enhancements
source: [02-VERIFICATION.md]
started: 2026-03-20T18:30:00Z
updated: 2026-03-20T18:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-end GraphQL relearn with live API (public and authenticated)
expected: Running /donna:relearn-tools with a public GraphQL tool fires without auth header; with an authenticated tool fires with auth header; schema changes reported; interactive update offered
result: [pending]

### 2. adjust-tool type change with capability format repair
expected: Changing a tool's type detects capability format mismatches, presents mismatch with 3 repair options, and applies chosen repair
result: [pending]

### 3. Parallel execution with 3 tools in begin-the-day
expected: All 3 tools queried concurrently; daily file assembled after 2-minute timeout or all Tasks return; failures per tool do not block others
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
