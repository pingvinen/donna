---
status: resolved
trigger: "Running donna-assistant --force to upgrade from 0.4.0 -> 0.5.0 shows skill list but no What's new changelog section"
created: 2026-03-16T00:00:00Z
updated: 2026-03-16T00:00:00Z
---

## Current Focus

hypothesis: CHANGELOG data object in src/changelog.cjs is empty — no entries exist for any version, so displayChangelog returns early with no output
test: Read CHANGELOG object in src/changelog.cjs
expecting: Empty object with only commented-out example entries
next_action: Diagnosis complete — report findings

## Symptoms

expected: Installer upgrade path (0.4.0 -> 0.5.0) should display a "What's new:" section with changelog entries
actual: Upgrade shows the skill list but no "What's new:" section at all
errors: None — no crash, just missing output
reproduction: Run `donna-assistant --force` when upgrading from 0.4.0 to 0.5.0
started: Since changelog feature was added — it has never shown entries because none were added

## Eliminated

- hypothesis: displayChangelog is not called during upgrade
  evidence: src/installer.cjs line 54 calls `changelog.displayChangelog(currentVersion, packageVersion)` inside the `if (currentVersion && currentVersion !== packageVersion)` block. The call site is correct.
  timestamp: 2026-03-16T00:00:00Z

- hypothesis: Version range filtering logic in displayChangelog is broken
  evidence: The filter logic on line 48-49 is correct (`semverGt(v, fromVersion) && !semverGt(v, toVersion)`), and unit tests for semverGt pass. However this is moot because the CHANGELOG object has zero keys to iterate.
  timestamp: 2026-03-16T00:00:00Z

## Evidence

- timestamp: 2026-03-16T00:00:00Z
  checked: src/changelog.cjs CHANGELOG object (lines 9-21)
  found: The CHANGELOG object is completely empty — `const CHANGELOG = {}`. The only content is a commented-out example showing the intended format for version "0.6.0". No actual version entries exist (not for 0.5.0 or any other version).
  implication: displayChangelog is called correctly, but `Object.keys(CHANGELOG)` returns an empty array, `versionsToShow` is empty, and the function returns at line 52 before printing anything.

- timestamp: 2026-03-16T00:00:00Z
  checked: src/installer.cjs upgrade path (lines 52-55)
  found: The call to `changelog.displayChangelog(currentVersion, packageVersion)` is present and correctly placed. It receives the right arguments.
  implication: The call site is not the problem.

- timestamp: 2026-03-16T00:00:00Z
  checked: test/installer.test.cjs changelog integration tests (lines 439-515)
  found: The test on line 453 explicitly documents this behavior in its comment: "Changelog module is called but CHANGELOG is empty, so no 'What's new:' appears." The test on line 502 also confirms empty CHANGELOG produces no output. Tests are passing because they test against the current (empty) state — no test asserts that "What's new:" SHOULD appear.
  implication: Tests confirm the current behavior is "working as coded" — the feature scaffolding is in place but no data was ever populated.

## Resolution

root_cause: The CHANGELOG data object in src/changelog.cjs is empty. It contains zero version entries — only a commented-out example for a hypothetical "0.6.0" release. The displayChangelog function works correctly but has no data to display. When upgrading 0.4.0 -> 0.5.0, there is no "0.5.0" key (or any key) in the CHANGELOG object, so `versionsToShow` resolves to an empty array and the function exits silently at line 52.
fix:
verification:
files_changed: []
