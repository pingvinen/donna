---
created: 2026-03-14T21:09:44.063Z
title: Document how a developer of Donna can test things locally
area: docs
files: []
---

## Problem

There is no documentation describing how a developer working on Donna can test their changes locally. This includes things like how to run the skills against a local storage repo, how to simulate the daily workflow, and how to verify changes before pushing. Without this, onboarding new contributors or even resuming work after a break requires rediscovering the local dev workflow each time.

## Solution

Create a developer guide (e.g., CONTRIBUTING.md or docs/development.md) covering:
- How to set up a local storage repo for testing
- How to run individual skills (add-task, done, etc.) locally
- How to verify Obsidian compatibility of generated files
- Any environment variables or config needed for local dev
