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

    it("has Write in allowed-tools", () => {
        const content = fs.readFileSync(stubPath, "utf8");
        assert.ok(content.includes("- Write"), "Should have Write in allowed-tools");
    });

    it("has AskUserQuestion in allowed-tools", () => {
        const content = fs.readFileSync(stubPath, "utf8");
        assert.ok(
            content.includes("- AskUserQuestion"),
            "Should have AskUserQuestion in allowed-tools",
        );
    });
});

describe("workflow: workflows/setup.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(workflowPath), "Workflow file should exist");
    });

    it("contains Donna banner section", () => {
        const content = fs.readFileSync(workflowPath, "utf8");
        assert.ok(content.includes("Donna"), "Should contain Donna banner reference");
    });

    it("contains AskUserQuestion step for interactive prompts", () => {
        const content = fs.readFileSync(workflowPath, "utf8");
        assert.ok(
            content.includes("AskUserQuestion"),
            "Should use AskUserQuestion for interactive prompts",
        );
    });

    it("references config/donna/config.md proving real setup logic present", () => {
        const content = fs.readFileSync(workflowPath, "utf8");
        assert.ok(
            content.includes("config/donna/config.md"),
            "Should reference config/donna/config.md (real setup logic, not stub placeholder)",
        );
    });
});

// ─── add-task stub ───────────────────────────────────────────────────────────

const addTaskStubPath = path.join(projectRoot, "stubs", "claude-code", "donna", "add-task.md");
const addTaskWorkflowPath = path.join(projectRoot, "workflows", "add-task.md");

describe("stub: stubs/claude-code/donna/add-task.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(addTaskStubPath), "add-task stub should exist");
    });

    it('has YAML frontmatter with name "donna:add-task"', () => {
        const content = fs.readFileSync(addTaskStubPath, "utf8");
        assert.ok(content.startsWith("---"), "Should start with YAML frontmatter delimiter");
        assert.ok(
            content.includes("name: donna:add-task"),
            "Should have name: donna:add-task in frontmatter",
        );
    });

    it("has description field in frontmatter", () => {
        const content = fs.readFileSync(addTaskStubPath, "utf8");
        assert.ok(content.includes("description:"), "Should have description field");
    });

    it("has Read in allowed-tools", () => {
        const content = fs.readFileSync(addTaskStubPath, "utf8");
        assert.ok(content.includes("- Read"), "Should have Read in allowed-tools");
    });

    it("has Write in allowed-tools", () => {
        const content = fs.readFileSync(addTaskStubPath, "utf8");
        assert.ok(content.includes("- Write"), "Should have Write in allowed-tools");
    });

    it("has Bash in allowed-tools", () => {
        const content = fs.readFileSync(addTaskStubPath, "utf8");
        assert.ok(content.includes("- Bash"), "Should have Bash in allowed-tools");
    });

    it("contains @~/.donna/workflows/add-task.md reference", () => {
        const content = fs.readFileSync(addTaskStubPath, "utf8");
        assert.ok(
            content.includes("@~/.donna/workflows/add-task.md"),
            "Should reference @~/.donna/workflows/add-task.md",
        );
    });
});

describe("workflow: workflows/add-task.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(addTaskWorkflowPath), "add-task workflow should exist");
    });

    it("references config/donna/config.md", () => {
        const content = fs.readFileSync(addTaskWorkflowPath, "utf8");
        assert.ok(
            content.includes("config/donna/config.md"),
            "Should reference config/donna/config.md",
        );
    });

    it("references daily_folder from config", () => {
        const content = fs.readFileSync(addTaskWorkflowPath, "utf8");
        assert.ok(content.includes("daily_folder"), "Should reference daily_folder from config");
    });

    it("contains git commit step", () => {
        const content = fs.readFileSync(addTaskWorkflowPath, "utf8");
        assert.ok(
            content.includes("git") && content.includes("commit"),
            "Should contain git commit step",
        );
    });
});

// ─── done stub ───────────────────────────────────────────────────────────────

const doneStubPath = path.join(projectRoot, "stubs", "claude-code", "donna", "done.md");
const doneWorkflowPath = path.join(projectRoot, "workflows", "done.md");

describe("stub: stubs/claude-code/donna/done.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(doneStubPath), "done stub should exist");
    });

    it('has YAML frontmatter with name "donna:done"', () => {
        const content = fs.readFileSync(doneStubPath, "utf8");
        assert.ok(content.startsWith("---"), "Should start with YAML frontmatter delimiter");
        assert.ok(
            content.includes("name: donna:done"),
            "Should have name: donna:done in frontmatter",
        );
    });

    it("has description field in frontmatter", () => {
        const content = fs.readFileSync(doneStubPath, "utf8");
        assert.ok(content.includes("description:"), "Should have description field");
    });

    it("has Read in allowed-tools", () => {
        const content = fs.readFileSync(doneStubPath, "utf8");
        assert.ok(content.includes("- Read"), "Should have Read in allowed-tools");
    });

    it("has Write in allowed-tools", () => {
        const content = fs.readFileSync(doneStubPath, "utf8");
        assert.ok(content.includes("- Write"), "Should have Write in allowed-tools");
    });

    it("has Bash in allowed-tools", () => {
        const content = fs.readFileSync(doneStubPath, "utf8");
        assert.ok(content.includes("- Bash"), "Should have Bash in allowed-tools");
    });

    it("has AskUserQuestion in allowed-tools", () => {
        const content = fs.readFileSync(doneStubPath, "utf8");
        assert.ok(
            content.includes("- AskUserQuestion"),
            "Should have AskUserQuestion in allowed-tools",
        );
    });

    it("contains @~/.donna/workflows/done.md reference", () => {
        const content = fs.readFileSync(doneStubPath, "utf8");
        assert.ok(
            content.includes("@~/.donna/workflows/done.md"),
            "Should reference @~/.donna/workflows/done.md",
        );
    });
});

describe("workflow: workflows/done.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(doneWorkflowPath), "done workflow should exist");
    });

    it("references config/donna/config.md", () => {
        const content = fs.readFileSync(doneWorkflowPath, "utf8");
        assert.ok(
            content.includes("config/donna/config.md"),
            "Should reference config/donna/config.md",
        );
    });

    it("contains git commit step", () => {
        const content = fs.readFileSync(doneWorkflowPath, "utf8");
        assert.ok(
            content.includes("git") && content.includes("commit"),
            "Should contain git commit step",
        );
    });
});
