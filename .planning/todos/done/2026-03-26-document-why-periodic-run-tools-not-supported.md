---
created: 2026-03-26T22:30:00.000Z
title: Document why automated periodic run-tools invocations are not supported (ref: #23)
area: docs
github_issue: 23
files: []
---

## Problem

There is no documentation explaining why Donna does not support automated, periodic invocations of run-tools. Users may expect this feature and need to understand the design rationale.

## Solution

Document the decision and rationale: scheduling complexity across OSes, headless invocation incompatible with certificate-based signing/pushing, and the workarounds all reduce security — which conflicts with Donna's "zero friction" UX goal. The issue body already contains the full explanation to incorporate.
