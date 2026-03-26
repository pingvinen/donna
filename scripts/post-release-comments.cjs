#!/usr/bin/env node
"use strict";

/**
 * Post-release script that closes resolved GitHub issues and comments on merged PRs.
 *
 * Pure functions `scanDoneTodos(doneDir)` and `findMergedPRs(prevTag)` are exported for testing.
 * When run directly, takes version as process.argv[2] and processes all done TODOs.
 *
 * Implements D-08 through D-12 from Phase 4 context:
 * - D-09: Scan .planning/todos/done/ for github_issue frontmatter
 * - D-10: Use completed/not-planned/duplicate close semantics
 * - D-11: Post "Resolved in vX.Y.Z" comment before closing
 * - D-12: Comment on merged PRs with "Released in vX.Y.Z"
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

/**
 * Wraps execSync("gh ...") with graceful error handling.
 * Returns stdout on success, null on error (logs error but does not throw).
 *
 * @param {string} args - Arguments to pass after "gh"
 * @returns {string|null} stdout or null on error
 */
function runGh(args) {
    try {
        return execSync(`gh ${args}`, {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
        });
    } catch (err) {
        const stderr = err.stderr ? err.stderr.trim() : String(err);
        console.error(`gh ${args.split(" ")[0]} failed: ${stderr}`);
        return null;
    }
}

/**
 * Scans a directory for .md files with github_issue frontmatter.
 * Returns an object keyed by issue number, values are arrays of TODO file basenames.
 *
 * @param {string} doneDir - Path to the done TODOs directory
 * @returns {Object} e.g. { 13: ["2026-03-26-add-ascii-art.md"], 21: [...] }
 */
function scanDoneTodos(doneDir) {
    if (!fs.existsSync(doneDir)) {
        return {};
    }

    let files;
    try {
        files = fs.readdirSync(doneDir).filter((f) => f.endsWith(".md"));
    } catch {
        return {};
    }

    if (files.length === 0) {
        return {};
    }

    const byIssue = {};

    for (const file of files) {
        try {
            const content = fs.readFileSync(path.join(doneDir, file), "utf8");
            const match = content.match(/^github_issue:\s*(\d+)/m);
            if (match) {
                const issueNum = Number.parseInt(match[1], 10);
                if (!byIssue[issueNum]) {
                    byIssue[issueNum] = [];
                }
                byIssue[issueNum].push(file);
            }
        } catch {
            // Skip unreadable files gracefully
        }
    }

    return byIssue;
}

/**
 * Finds PRs merged since the previous tag.
 * Uses gh pr list --state merged filtered by date of previous tag.
 *
 * @param {string} prevTag - Previous git tag (e.g., "v0.8.0")
 * @returns {number[]} Array of PR numbers merged after prevTag
 */
function findMergedPRs(prevTag) {
    if (!prevTag) {
        return [];
    }

    let prevTagDate;
    try {
        prevTagDate = execSync(`git log -1 --format=%aI ${prevTag}`, {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
        }).trim();
    } catch {
        return [];
    }

    if (!prevTagDate) {
        return [];
    }

    const prListJson = runGh(
        "pr list --repo pingvinen/donna --state merged --limit 100 --json number,mergedAt",
    );

    if (!prListJson) {
        return [];
    }

    let prs;
    try {
        prs = JSON.parse(prListJson);
    } catch {
        return [];
    }

    const cutoffDate = new Date(prevTagDate);

    return prs
        .filter((pr) => pr.mergedAt && new Date(pr.mergedAt) > cutoffDate)
        .map((pr) => pr.number);
}

// CLI entry point: when run directly (not imported)
if (require.main === module) {
    const version = process.argv[2];

    if (!version) {
        console.error("Usage: node scripts/post-release-comments.cjs <version>");
        console.error("Example: node scripts/post-release-comments.cjs 0.9.0");
        process.exit(1);
    }

    // Step 1: Scan done TODOs (D-09)
    const doneDir = path.join(process.cwd(), ".planning", "todos", "done");
    const issueMap = scanDoneTodos(doneDir);

    const issueNumbers = Object.keys(issueMap);
    if (issueNumbers.length === 0) {
        console.log("No issue-linked TODOs found in done/");
        // Don't exit — still need to comment on PRs (D-12)
    }

    // Step 2: Close resolved issues (D-10, D-11)
    let closedCount = 0;

    for (const issueNumStr of issueNumbers) {
        const issueNum = Number.parseInt(issueNumStr, 10);

        // Check if already closed (pitfall 6)
        const stateJson = runGh(
            `issue view ${issueNum} --repo pingvinen/donna --json state --jq ".state"`,
        );

        if (stateJson && stateJson.trim() === "CLOSED") {
            console.log(`Issue #${issueNum} already closed, skipping`);
            continue;
        }

        // Close with comment (D-11) — atomic comment+close per RESEARCH anti-patterns
        const result = runGh(
            `issue close ${issueNum} --repo pingvinen/donna --reason "completed" --comment "Resolved in [v${version}](https://github.com/pingvinen/donna/releases/tag/v${version})"`,
        );

        if (result !== null) {
            console.log(`Closed issue #${issueNum} as completed`);
            closedCount++;
        }
    }

    // Step 3: Comment on merged PRs (D-12)
    let prevTag = "";
    try {
        prevTag = execSync("git describe --abbrev=0 --tags HEAD^", {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
        }).trim();
    } catch {
        console.log("No previous tag found, skipping PR comments");
    }

    const prNumbers = findMergedPRs(prevTag);

    for (const prNum of prNumbers) {
        const result = runGh(
            `pr comment ${prNum} --repo pingvinen/donna --body "Released in [v${version}](https://github.com/pingvinen/donna/releases/tag/v${version})"`,
        );
        if (result !== null) {
            console.log(`Commented on PR #${prNum}`);
        }
    }

    // Step 4: Summary
    console.log(
        `Release v${version}: closed ${closedCount} issues, commented on ${prNumbers.length} PRs`,
    );
}

module.exports = { scanDoneTodos, findMergedPRs };
