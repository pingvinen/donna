---
created: 2026-03-26T22:30:00.000Z
title: Refactor skill bootstrap (config, migrations) into reusable module (ref: #30)
area: tooling
github_issue: 30
files: []
---

## Problem

Every skill starts with the same large block of "make sure we are configured and migrated" logic. This duplicated bootstrap code increases maintenance burden and bloats context windows during skill execution.

## Solution

Extract the shared configuration-checking and migration-running logic into one or more foundational skills or scripts that other skills can invoke, without hurting context usage or execution speed.
