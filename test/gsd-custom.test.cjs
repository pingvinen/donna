"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const gsdCustomDir = path.join(__dirname, "..", ".claude", "commands", "gsd-custom");

function readCommand(name) {
    return fs.readFileSync(path.join(gsdCustomDir, name), "utf8");
}

describe("gsd-custom:ingest-issues", () => {
    const content = readCommand("ingest-issues.md");

    it("exists and is readable", () => {
        assert.ok(content.length > 0);
    });

    it("has name: gsd-custom:ingest-issues in frontmatter", () => {
        assert.ok(content.includes("name: gsd-custom:ingest-issues"));
    });

    it("lists AskUserQuestion in allowed-tools", () => {
        assert.ok(content.includes("- AskUserQuestion"));
    });

    it("lists Write in allowed-tools", () => {
        assert.ok(content.includes("- Write"));
    });

    it("lists Bash in allowed-tools", () => {
        assert.ok(content.includes("- Bash"));
    });

    it("contains gh auth status for authentication check", () => {
        assert.ok(content.includes("gh auth status"));
    });

    it("contains gh label create for idempotent label creation (D-06)", () => {
        assert.ok(content.includes("gh label create"));
    });

    it("contains || true for idempotent label creation (D-06)", () => {
        assert.ok(content.includes("|| true"));
    });

    it("contains gh issue list referencing pingvinen/donna", () => {
        assert.ok(content.includes("gh issue list"));
        assert.ok(content.includes("pingvinen/donna"));
    });

    it("contains github_issue: frontmatter field in TODO template (D-04)", () => {
        assert.ok(content.includes("github_issue:"));
    });

    it("contains (ref: # title pattern for human-readable provenance (D-04)", () => {
        assert.ok(content.includes("(ref: #"));
    });

    it('contains --add-label "ingested" for label application (D-05)', () => {
        assert.ok(content.includes('--add-label "ingested"'));
    });

    it("contains not-for-ingestion for skip label (D-05)", () => {
        assert.ok(content.includes("not-for-ingestion"));
    });

    it("contains gh issue comment for posting TODO list (D-07)", () => {
        assert.ok(content.includes("gh issue comment"));
    });

    it("contains git add for staging TODO files", () => {
        assert.ok(content.includes("git add"));
    });

    it("does NOT contain git commit (CLAUDE.md SSH signing constraint)", () => {
        assert.ok(!content.includes("git commit"));
    });
});
