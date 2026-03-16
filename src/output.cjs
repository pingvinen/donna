"use strict";

function banner() {
    console.log("");
    console.log("━━━ Donna ━━━");
    console.log("");
}

function success(msg) {
    console.log(`  \u2713 ${msg}`);
}

function fail(msg) {
    console.log(`  \u2717 ${msg}`);
}

function info(msg) {
    console.log(`  ${msg}`);
}

function upgradeHeader(from, to) {
    console.log(`  Upgrading ${from} \u2192 ${to}:`);
}

function migrationLine(desc) {
    console.log(`  \u2713 ${desc}`);
}

function changelogHeader() {
    console.log("");
    console.log("  What's new:");
}

module.exports = { banner, success, fail, info, upgradeHeader, migrationLine, changelogHeader };
