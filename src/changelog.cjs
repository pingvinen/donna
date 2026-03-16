"use strict";

const output = require("./output.cjs");

/**
 * Changelog data keyed by version string.
 * Each entry has categories as keys and arrays of change descriptions as values.
 */
const CHANGELOG = {
    "0.5.0": {
        "New skills": [
            "donna:help — conversational troubleshooting and diagnostics",
            "donna:contribute-idea — submit feature ideas via GitHub Issues",
        ],
        Improvements: [
            "CONTRIBUTING.md developer guide added",
            "Upgrade changelog shown during version bumps",
        ],
    },
};

/**
 * Compare two semver strings. Returns true if a > b.
 *
 * @param {string} a - First version string
 * @param {string} b - Second version string
 * @returns {boolean}
 */
function semverGt(a, b) {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
        if (pa[i] > pb[i]) return true;
        if (pa[i] < pb[i]) return false;
    }
    return false;
}

/**
 * Display changelog entries for versions between fromVersion (exclusive)
 * and toVersion (inclusive).
 *
 * @param {string} fromVersion - Previous version (exclusive)
 * @param {string} toVersion - New version (inclusive)
 */
function displayChangelog(fromVersion, toVersion) {
    const versionsToShow = Object.keys(CHANGELOG)
        .filter((v) => semverGt(v, fromVersion) && !semverGt(v, toVersion))
        .sort((a, b) => (semverGt(a, b) ? 1 : -1));

    if (versionsToShow.length === 0) return;

    console.log("");
    output.info("What's new:");

    for (const ver of versionsToShow) {
        const entry = CHANGELOG[ver];
        for (const [category, items] of Object.entries(entry)) {
            output.info(`  ${category}:`);
            for (const item of items) {
                const prefix = category.toLowerCase().includes("new") ? "+" : "\u00b7";
                output.info(`    ${prefix} ${item}`);
            }
        }
    }

    console.log("");
}

module.exports = { CHANGELOG, displayChangelog, semverGt };
