#!/usr/bin/env node
"use strict";

/**
 * Generates a markdown changelog from conventional commit messages.
 *
 * Pure function `generateChangelog(messages)` is exported for testing.
 * When run directly, reads git log and writes to GITHUB_OUTPUT.
 */

function extractScope(msg) {
    const match = msg.match(/^[a-z]+\((.+?)\)/);
    return match ? match[1] : null;
}

function generateChangelog(messages) {
    const groups = {
        Features: [],
        Fixes: [],
    };

    for (const msg of messages) {
        if (/^feat(\(.+\))?!?:/.test(msg)) {
            const description = msg.replace(/^feat(\(.+\))?!?:\s*/, "");
            const scope = extractScope(msg);
            groups.Features.push(scope ? `**${scope}:** ${description}` : description);
        } else if (/^fix(\(.+\))?!?:/.test(msg)) {
            const description = msg.replace(/^fix(\(.+\))?!?:\s*/, "");
            const scope = extractScope(msg);
            groups.Fixes.push(scope ? `**${scope}:** ${description}` : description);
        }
    }

    const sections = [];
    for (const [heading, items] of Object.entries(groups)) {
        if (items.length > 0) {
            sections.push(`### ${heading}\n${items.map((i) => `- ${i}`).join("\n")}`);
        }
    }

    return sections.join("\n\n");
}

// CLI mode: when run directly (not imported)
if (require.main === module) {
    const { execSync } = require("node:child_process");

    // Get last tag, or use initial commit if no tags
    let lastTag;
    try {
        lastTag = execSync("git describe --tags --abbrev=0", {
            encoding: "utf8",
        }).trim();
    } catch {
        lastTag = execSync("git rev-list --max-parents=0 HEAD", {
            encoding: "utf8",
        }).trim();
    }

    // Get commit messages since last tag
    const log = execSync(`git log ${lastTag}..HEAD --pretty=format:"%s"`, {
        encoding: "utf8",
    });
    const messages = log.split("\n").filter(Boolean);

    const changelog = generateChangelog(messages);
    console.log(changelog);
}

module.exports = { generateChangelog, extractScope };
