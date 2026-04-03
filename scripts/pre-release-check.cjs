#!/usr/bin/env node
"use strict";

/**
 * Pre-release gate: blocks the release unless pending TODOs have been
 * reviewed after the last phase was completed.
 *
 * The release script auto-closes GitHub issues by scanning done/ TODOs.
 * If a resolved TODO is accidentally left in pending/, the linked issue
 * won't be closed. This check ensures someone has reviewed the TODO state
 * since the last phase shipped.
 *
 * Review marker: .planning/todos/.last-reviewed (ISO timestamp)
 * Phase timestamp: last_updated in .planning/STATE.md frontmatter
 *
 * Exits 1 if:
 *   - No review marker exists, or
 *   - The review is older than the last phase completion
 */

const fs = require("node:fs");
const path = require("node:path");

/**
 * Reads the last-reviewed timestamp from the marker file.
 * @param {string} markerPath
 * @returns {Date|null}
 */
function readReviewTimestamp(markerPath) {
    try {
        const content = fs.readFileSync(markerPath, "utf8").trim();
        const date = new Date(content);
        return Number.isNaN(date.getTime()) ? null : date;
    } catch {
        return null;
    }
}

/**
 * Reads the last_updated timestamp from STATE.md frontmatter.
 * @param {string} statePath
 * @returns {Date|null}
 */
function readStateTimestamp(statePath) {
    try {
        const content = fs.readFileSync(statePath, "utf8");
        const match = content.match(/^last_updated:\s*"?([^"\n]+)"?/m);
        if (!match) return null;
        const date = new Date(match[1]);
        return Number.isNaN(date.getTime()) ? null : date;
    } catch {
        return null;
    }
}

/**
 * Scans a directory for .md files with github_issue frontmatter.
 * @param {string} dir
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
    const planningDir = path.join(process.cwd(), ".planning");
    const pendingDir = path.join(planningDir, "todos", "pending");
    const markerPath = path.join(planningDir, "todos", ".last-reviewed");
    const statePath = path.join(planningDir, "STATE.md");

    // If no pending TODOs have github_issue fields, nothing can go wrong — pass
    const issueLinked = scanForIssueLinks(pendingDir);
    if (issueLinked.length === 0) {
        console.log("Pre-release check passed: no issue-linked TODOs in pending/");
        process.exit(0);
    }

    const reviewDate = readReviewTimestamp(markerPath);
    const stateDate = readStateTimestamp(statePath);

    if (!reviewDate) {
        console.error("Pre-release check FAILED: pending TODOs have never been reviewed.");
        console.error(`Found ${issueLinked.length} pending TODO(s) with github_issue fields:\n`);
        for (const { file, issue } of issueLinked) {
            console.error(`  #${issue}  ${file}`);
        }
        console.error("\nRun 'node scripts/review-todos.cjs' to review and confirm.");
        process.exit(1);
    }

    if (stateDate && reviewDate < stateDate) {
        console.error("Pre-release check FAILED: TODO review is stale.");
        console.error(`  Last reviewed:        ${reviewDate.toISOString()}`);
        console.error(`  Last phase completed: ${stateDate.toISOString()}`);
        console.error(`\nFound ${issueLinked.length} pending TODO(s) with github_issue fields:\n`);
        for (const { file, issue } of issueLinked) {
            console.error(`  #${issue}  ${file}`);
        }
        console.error("\nRun 'node scripts/review-todos.cjs' to review and confirm.");
        process.exit(1);
    }

    console.log("Pre-release check passed: TODO review is current");
    console.log(`  Last reviewed:        ${reviewDate.toISOString()}`);
    if (stateDate) {
        console.log(`  Last phase completed: ${stateDate.toISOString()}`);
    }
}

module.exports = { readReviewTimestamp, readStateTimestamp, scanForIssueLinks };
