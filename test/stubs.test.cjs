"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const stubPath = path.join(projectRoot, "stubs", "claude-code", "donna", "setup.md");
const workflowPath = path.join(projectRoot, "workflows", "setup.md");

describe("stub: stubs/claude-code/donna/setup.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(stubPath), "Stub file should exist");
    });

    it('has YAML frontmatter with name "donna:setup"', () => {
        const content = fs.readFileSync(stubPath, "utf8");
        assert.ok(content.startsWith("---"), "Should start with YAML frontmatter delimiter");
        assert.ok(
            content.includes("name: donna:setup"),
            "Should have name: donna:setup in frontmatter",
        );
    });

    it("has description field in frontmatter", () => {
        const content = fs.readFileSync(stubPath, "utf8");
        assert.ok(content.includes("description:"), "Should have description field in frontmatter");
    });

    it("contains @~/.donna/workflows/setup.md reference", () => {
        const content = fs.readFileSync(stubPath, "utf8");
        assert.ok(
            content.includes("@~/.donna/workflows/setup.md"),
            "Should reference @~/.donna/workflows/setup.md",
        );
    });
});

describe("workflow: workflows/setup.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(workflowPath), "Workflow file should exist");
    });

    it("contains DONNA banner section", () => {
        const content = fs.readFileSync(workflowPath, "utf8");
        assert.ok(content.includes("DONNA"), "Should contain DONNA banner reference");
    });

    it("references version.md for version display", () => {
        const content = fs.readFileSync(workflowPath, "utf8");
        assert.ok(content.includes("version.md"), "Should reference version.md");
    });

    it('mentions "stub" indicating Phase 2 will add real logic', () => {
        const content = fs.readFileSync(workflowPath, "utf8");
        assert.ok(content.toLowerCase().includes("stub"), "Should mention stub");
    });
});
