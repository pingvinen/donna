#!/usr/bin/env node
"use strict";

/**
 * Determines version bump type from conventional commit messages.
 *
 * Pure function `determineBump(messages, currentVersion)` is exported for testing.
 * When run directly, reads git log and writes to GITHUB_OUTPUT.
 */

function determineBump(messages, currentVersion) {
  if (!messages || messages.length === 0) {
    throw new Error("No commits found. Nothing to release.");
  }

  let bump = "patch";

  for (const msg of messages) {
    if (msg.includes("BREAKING CHANGE") || /^[a-z]+(\(.+\))?!:/.test(msg)) {
      bump = "major";
      break;
    }
    if (/^feat(\(.+\))?:/.test(msg)) {
      bump = "minor";
    }
  }

  // Pre-1.0 convention: breaking changes bump minor, not major
  if (bump === "major" && currentVersion.startsWith("0.")) {
    bump = "minor";
  }

  const [major, minor, patch] = currentVersion.split(".").map(Number);
  let newVersion;
  switch (bump) {
    case "major":
      newVersion = `${major + 1}.0.0`;
      break;
    case "minor":
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case "patch":
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }

  return { bump, newVersion };
}

// CLI mode: when run directly (not imported)
if (require.main === module) {
  const { execSync } = require("node:child_process");
  const fs = require("node:fs");
  const path = require("node:path");
  const pkg = require(path.join(process.cwd(), "package.json"));

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

  const { bump, newVersion } = determineBump(messages, pkg.version);

  // Write to GITHUB_OUTPUT if in CI, otherwise print
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `bump=${bump}\nnew_version=${newVersion}\n`);
  }

  console.log(`Bump: ${bump} (${pkg.version} -> ${newVersion})`);
  console.log(`Commits analyzed: ${messages.length}`);
}

module.exports = { determineBump };
