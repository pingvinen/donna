#!/usr/bin/env node
"use strict";

/**
 * Pre-release check: warns if any pending TODOs have github_issue fields.
 *
 * These TODOs reference GitHub issues that won't be auto-closed by the
 * release script (which only scans done/). This is expected for genuinely
 * pending work — the warning is informational so the releaser can verify
 * no resolved TODOs were accidentally left in pending/.
 *
 * Always exits 0 (warning only, never blocks the release).
 */

const fs = require("node:fs");
const path = require("node:path");

/**
 * Scans a directory for .md files with github_issue frontmatter.
 * Returns an array of { file, issue } objects.
 *
 * @param {string} dir - Path to scan
 * @returns {{ file: string, issue: number }[]}
 */
function scanForIssueLinks(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    let files;
    try {
        files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    } catch {
        return [];
    }

    const results = [];

    for (const file of files) {
        try {
            const content = fs.readFileSync(path.join(dir, file), "utf8");
            const match = content.match(/^github_issue:\s*(\d+)/m);
            if (match) {
                results.push({ file, issue: Number.parseInt(match[1], 10) });
            }
        } catch {
            // Skip unreadable files
        }
    }

    return results;
}

// CLI entry point
if (require.main === module) {
    const pendingDir = path.join(process.cwd(), ".planning", "todos", "pending");
    const orphaned = scanForIssueLinks(pendingDir);

    if (orphaned.length === 0) {
        console.log("Pre-release check passed: no orphaned issue-linked TODOs in pending/");
        process.exit(0);
    }

    console.warn("⚠ Pre-release WARNING: found pending TODOs with github_issue fields.");
    console.warn("These issues will NOT be auto-closed by the release script.\n");

    for (const { file, issue } of orphaned) {
        console.warn(`  #${issue}  ${file}`);
    }

    console.warn("\nIf any of these are resolved, move them to done/ before releasing.");
}

module.exports = { scanForIssueLinks };
