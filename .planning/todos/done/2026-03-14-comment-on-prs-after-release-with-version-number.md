---
created: 2026-03-14T15:37:32.079Z
title: Comment on PRs after release with version number (ref: #21)
area: tooling
github_issue: 21
files:
  - .github/workflows/release.yml
  - .github/workflows/deploy.yml
---

## Problem

When a release is published, contributors and reviewers have no automatic notification that their PR was included. They have to manually check release notes to see if their work shipped.

## Solution

After a successful release/deploy, use `gh` to find all PRs merged since the previous release tag and post a comment on each one, e.g. "This PR was released as part of v0.3.3". This could be a step in the existing release or deploy workflow, or a separate workflow triggered by the `release: published` event.
