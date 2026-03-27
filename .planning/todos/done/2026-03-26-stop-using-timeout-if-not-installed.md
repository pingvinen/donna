---
created: 2026-03-26T22:30:00.000Z
title: Stop wrapping commands in "timeout" if timeout is not installed (ref: #18)
area: general
github_issue: 18
files: []
---

## Problem

Claude frequently wraps commands in `timeout`, which is a reasonable safeguard but fails on systems where `timeout` is not installed (e.g. macOS without coreutils). This causes repeated errors during skill execution.

## Solution

Check for `timeout` availability before using it, or find an alternative approach (e.g. shell built-in TMOUT, or simply not using timeout for commands that are known to complete quickly).
