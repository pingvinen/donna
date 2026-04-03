#!/usr/bin/env node
"use strict";

/**
 * Interactive TODO review: lists pending TODOs with github_issue fields
 * and writes the .last-reviewed marker when confirmed.
 *
 * Run before a release to verify no resolved TODOs were left in pending/.
 * The pre-release check (pre-release-check.cjs) gates on this marker.
 */

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const { scanForIssueLinks } = require("./pre-release-check.cjs");

function writeMarker(markerPath) {
    const timestamp = new Date().toISOString();
    fs.writeFileSync(markerPath, `${timestamp}\n`, "utf8");
    return timestamp;
}

// CLI entry point
if (require.main === module) {
    const planningDir = path.join(process.cwd(), ".planning");
    const pendingDir = path.join(planningDir, "todos", "pending");
    const markerPath = path.join(planningDir, "todos", ".last-reviewed");

    const issueLinked = scanForIssueLinks(pendingDir);

    if (issueLinked.length === 0) {
        console.log("No pending TODOs with github_issue fields. Nothing to review.");
        const ts = writeMarker(markerPath);
        console.log(`Review marker updated: ${ts}`);
        process.exit(0);
    }

    console.log("Pending TODOs with github_issue fields:\n");
    for (const { file, issue } of issueLinked) {
        console.log(`  #${issue}  ${file}`);
    }
    console.log("\nConfirm that all of these are genuinely still pending.");
    console.log("If any are resolved, move them to done/ first, then re-run.\n");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question("All confirmed pending? (y/n) ", (answer) => {
        rl.close();
        if (answer.toLowerCase().startsWith("y")) {
            const ts = writeMarker(markerPath);
            console.log(`\nReview marker updated: ${ts}`);
            console.log("Pre-release check will now pass.");
        } else {
            console.log("\nReview not confirmed. Move resolved TODOs to done/ and try again.");
            process.exit(1);
        }
    });
}

module.exports = { writeMarker };
