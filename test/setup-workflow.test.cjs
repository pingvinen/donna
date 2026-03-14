"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const workflowPath = path.join(projectRoot, "workflows", "setup.md");

describe("workflow: workflows/setup.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(workflowPath), "Workflow file should exist at workflows/setup.md");
    });

    it("contains config/donna/config.md reference", () => {
        const content = fs.readFileSync(workflowPath, "utf8");
        assert.ok(
            content.includes("config/donna/config.md"),
            "Should reference config/donna/config.md (bootstrap config path)",
        );
    });

    it("contains daily/ directory creation", () => {
        const content = fs.readFileSync(workflowPath, "utf8");
        assert.ok(content.includes("daily/"), "Should reference daily/ directory creation");
    });

    it("contains git commit step", () => {
        const content = fs.readFileSync(workflowPath, "utf8");
        assert.ok(
            content.includes("git -C") || content.includes("git commit"),
            "Should contain a git commit step (git -C or git commit)",
        );
    });

    it("does not contain stub placeholder message", () => {
        const content = fs.readFileSync(workflowPath, "utf8");
        assert.ok(
            !content.toLowerCase().includes("this is a stub"),
            "Should NOT contain 'This is a stub' placeholder message",
        );
    });
});
