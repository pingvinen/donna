"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const stubPath = path.join(projectRoot, "stubs", "claude-code", "donna", "setup.md");
const workflowPath = path.join(projectRoot, "workflows", "setup.md");
const addToolStubPath = path.join(projectRoot, "stubs", "claude-code", "donna", "add-tool.md");
const addToolWorkflowPath = path.join(projectRoot, "workflows", "add-tool.md");
const relearnToolsStubPath = path.join(
    projectRoot,
    "stubs",
    "claude-code",
    "donna",
    "relearn-tools.md",
);
const relearnToolsWorkflowPath = path.join(projectRoot, "workflows", "relearn-tools.md");
const runToolsStubPath = path.join(projectRoot, "stubs", "claude-code", "donna", "run-tools.md");
const runToolsWorkflowPath = path.join(projectRoot, "workflows", "run-tools.md");

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

// ─── set-role stub ────────────────────────────────────────────────────────────

const setRoleStubPath = path.join(projectRoot, "stubs", "claude-code", "donna", "set-role.md");
const setRoleWorkflowPath = path.join(projectRoot, "workflows", "set-role.md");

describe("stub: stubs/claude-code/donna/set-role.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(setRoleStubPath), "set-role stub should exist");
    });

    it('has YAML frontmatter with name "donna:set-role"', () => {
        const content = fs.readFileSync(setRoleStubPath, "utf8");
        assert.ok(content.startsWith("---"), "Should start with YAML frontmatter delimiter");
        assert.ok(
            content.includes("name: donna:set-role"),
            "Should have name: donna:set-role in frontmatter",
        );
    });

    it("has description field in frontmatter", () => {
        const content = fs.readFileSync(setRoleStubPath, "utf8");
        assert.ok(content.includes("description:"), "Should have description field");
    });

    it("has WebSearch in allowed-tools", () => {
        const content = fs.readFileSync(setRoleStubPath, "utf8");
        assert.ok(
            content.includes("- WebSearch"),
            "Should have WebSearch in allowed-tools (critical for research step)",
        );
    });

    it("has AskUserQuestion in allowed-tools", () => {
        const content = fs.readFileSync(setRoleStubPath, "utf8");
        assert.ok(
            content.includes("- AskUserQuestion"),
            "Should have AskUserQuestion in allowed-tools",
        );
    });

    it("has Read in allowed-tools", () => {
        const content = fs.readFileSync(setRoleStubPath, "utf8");
        assert.ok(content.includes("- Read"), "Should have Read in allowed-tools");
    });

    it("has Write in allowed-tools", () => {
        const content = fs.readFileSync(setRoleStubPath, "utf8");
        assert.ok(content.includes("- Write"), "Should have Write in allowed-tools");
    });

    it("has Bash in allowed-tools", () => {
        const content = fs.readFileSync(setRoleStubPath, "utf8");
        assert.ok(content.includes("- Bash"), "Should have Bash in allowed-tools");
    });

    it("contains @~/.donna/workflows/set-role.md reference", () => {
        const content = fs.readFileSync(setRoleStubPath, "utf8");
        assert.ok(
            content.includes("@~/.donna/workflows/set-role.md"),
            "Should reference @~/.donna/workflows/set-role.md",
        );
    });
});

describe("workflow: workflows/set-role.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(setRoleWorkflowPath), "set-role workflow should exist");
    });

    it("references config/donna/config.md", () => {
        const content = fs.readFileSync(setRoleWorkflowPath, "utf8");
        assert.ok(
            content.includes("config/donna/config.md"),
            "Should reference config/donna/config.md",
        );
    });

    it("contains WebSearch usage for research", () => {
        const content = fs.readFileSync(setRoleWorkflowPath, "utf8");
        assert.ok(
            content.includes("WebSearch"),
            "Should contain WebSearch usage for research step",
        );
    });

    it("contains AskUserQuestion for interactive flow", () => {
        const content = fs.readFileSync(setRoleWorkflowPath, "utf8");
        assert.ok(
            content.includes("AskUserQuestion"),
            "Should use AskUserQuestion for interactive flow",
        );
    });

    it("contains role.md write reference", () => {
        const content = fs.readFileSync(setRoleWorkflowPath, "utf8");
        assert.ok(content.includes("role.md"), "Should reference role.md for persistence");
    });

    it("contains role-research.md write reference", () => {
        const content = fs.readFileSync(setRoleWorkflowPath, "utf8");
        assert.ok(
            content.includes("role-research.md"),
            "Should reference role-research.md for research persistence",
        );
    });

    it("contains recurring.md write reference", () => {
        const content = fs.readFileSync(setRoleWorkflowPath, "utf8");
        assert.ok(
            content.includes("recurring.md"),
            "Should reference recurring.md for recurring tasks persistence",
        );
    });

    it("contains git commit step", () => {
        const content = fs.readFileSync(setRoleWorkflowPath, "utf8");
        assert.ok(
            content.includes("git") && content.includes("commit"),
            "Should contain git commit step",
        );
    });

    it("reads only specific files, not full repo (STORE-03)", () => {
        const content = fs.readFileSync(setRoleWorkflowPath, "utf8");
        assert.ok(
            !content.includes("ls <storage_repo>") && !content.includes("glob"),
            "Should not glob or ls the full storage repo — only read specific named files",
        );
    });
});

// ─── begin-the-day stub ───────────────────────────────────────────────────────

const beginTheDayStubPath = path.join(
    projectRoot,
    "stubs",
    "claude-code",
    "donna",
    "begin-the-day.md",
);
const beginTheDayWorkflowPath = path.join(projectRoot, "workflows", "begin-the-day.md");

describe("stub: stubs/claude-code/donna/begin-the-day.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(beginTheDayStubPath), "begin-the-day stub should exist");
    });

    it('has YAML frontmatter with name "donna:begin-the-day"', () => {
        const content = fs.readFileSync(beginTheDayStubPath, "utf8");
        assert.ok(content.startsWith("---"), "Should start with YAML frontmatter delimiter");
        assert.ok(
            content.includes("name: donna:begin-the-day"),
            "Should have name: donna:begin-the-day in frontmatter",
        );
    });

    it("has description field in frontmatter", () => {
        const content = fs.readFileSync(beginTheDayStubPath, "utf8");
        assert.ok(content.includes("description:"), "Should have description field in frontmatter");
    });

    it("contains @~/.donna/workflows/begin-the-day.md reference", () => {
        const content = fs.readFileSync(beginTheDayStubPath, "utf8");
        assert.ok(
            content.includes("@~/.donna/workflows/begin-the-day.md"),
            "Should reference @~/.donna/workflows/begin-the-day.md",
        );
    });
});

describe("workflow: workflows/begin-the-day.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(beginTheDayWorkflowPath), "begin-the-day workflow should exist");
    });

    it("references config/donna/config.md", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        assert.ok(
            content.includes("config/donna/config.md"),
            "Should reference config/donna/config.md",
        );
    });

    it("contains carry-forward logic referencing previous daily file", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        assert.ok(
            content.toLowerCase().includes("carry") || content.toLowerCase().includes("previous"),
            "Should contain carry-forward logic (references 'carry' or 'previous')",
        );
    });

    it("references recurring.md for due-today tasks", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        assert.ok(
            content.includes("recurring.md"),
            "Should reference recurring.md for due-today recurring tasks",
        );
    });

    it("contains deduplication logic", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        assert.ok(
            content.toLowerCase().includes("dedup") || content.toLowerCase().includes("normalize"),
            "Should contain deduplication logic (references 'dedup' or 'normalize')",
        );
    });

    it("contains git commit step", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        assert.ok(
            content.includes("git") && content.includes("commit"),
            "Should contain git commit step",
        );
    });

    it("reads only specific files — no full-repo scan (STORE-03)", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        // Must NOT glob or ls the entire storage repo
        // (ls inside the daily_folder to find previous file is acceptable and expected)
        assert.ok(
            !content.includes("ls <storage_repo>/*.md") &&
                !content.includes("glob") &&
                !content.includes("find <storage_repo>"),
            "Should not glob or ls the full storage repo — only targeted daily_folder listing and specific named files",
        );
    });
});

// ─── add-tool stub ────────────────────────────────────────────────────────────

describe("stub: stubs/claude-code/donna/add-tool.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(addToolStubPath), "add-tool stub should exist");
    });

    it('has YAML frontmatter with name "donna:add-tool"', () => {
        const content = fs.readFileSync(addToolStubPath, "utf8");
        assert.ok(content.startsWith("---"), "Should start with YAML frontmatter delimiter");
        assert.ok(
            content.includes("name: donna:add-tool"),
            "Should have name: donna:add-tool in frontmatter",
        );
    });

    it("has description field in frontmatter", () => {
        const content = fs.readFileSync(addToolStubPath, "utf8");
        assert.ok(content.includes("description:"), "Should have description field");
    });

    it("has Read in allowed-tools", () => {
        const content = fs.readFileSync(addToolStubPath, "utf8");
        assert.ok(content.includes("- Read"), "Should have Read in allowed-tools");
    });

    it("has Write in allowed-tools", () => {
        const content = fs.readFileSync(addToolStubPath, "utf8");
        assert.ok(content.includes("- Write"), "Should have Write in allowed-tools");
    });

    it("has Bash in allowed-tools", () => {
        const content = fs.readFileSync(addToolStubPath, "utf8");
        assert.ok(content.includes("- Bash"), "Should have Bash in allowed-tools");
    });

    it("has AskUserQuestion in allowed-tools", () => {
        const content = fs.readFileSync(addToolStubPath, "utf8");
        assert.ok(
            content.includes("- AskUserQuestion"),
            "Should have AskUserQuestion in allowed-tools",
        );
    });

    it("does NOT have WebSearch in allowed-tools", () => {
        const content = fs.readFileSync(addToolStubPath, "utf8");
        assert.ok(
            !content.includes("- WebSearch"),
            "Should NOT have WebSearch — add-tool is not a research skill",
        );
    });

    it("contains @~/.donna/workflows/add-tool.md reference", () => {
        const content = fs.readFileSync(addToolStubPath, "utf8");
        assert.ok(
            content.includes("@~/.donna/workflows/add-tool.md"),
            "Should reference @~/.donna/workflows/add-tool.md",
        );
    });
});

describe("workflow: workflows/add-tool.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(addToolWorkflowPath), "add-tool workflow should exist");
    });

    it("references config/donna/config.md", () => {
        const content = fs.readFileSync(addToolWorkflowPath, "utf8");
        assert.ok(
            content.includes("config/donna/config.md"),
            "Should reference config/donna/config.md",
        );
    });

    it("contains check-pending-migrations step", () => {
        const content = fs.readFileSync(addToolWorkflowPath, "utf8");
        assert.ok(
            content.includes("check-pending-migrations"),
            "Should contain check-pending-migrations step",
        );
    });

    it("contains verify-installation step with which command", () => {
        const content = fs.readFileSync(addToolWorkflowPath, "utf8");
        assert.ok(
            content.includes("which") && content.includes("verify-installation"),
            "Should verify tool installation with which command",
        );
    });

    it("contains auth-test step", () => {
        const content = fs.readFileSync(addToolWorkflowPath, "utf8");
        assert.ok(
            content.includes("auth-test") && content.includes("gh api user"),
            "Should contain auth-test step with gh api user example",
        );
    });

    it("contains learn-capabilities step with training data baseline", () => {
        const content = fs.readFileSync(addToolWorkflowPath, "utf8");
        assert.ok(
            content.includes("training data") && content.includes("learn-capabilities"),
            "Should use training data baseline for known tools (TOOL-02)",
        );
    });

    it("contains select-capabilities step with AskUserQuestion", () => {
        const content = fs.readFileSync(addToolWorkflowPath, "utf8");
        assert.ok(
            content.includes("AskUserQuestion") && content.includes("select-capabilities"),
            "Should use AskUserQuestion for capability selection",
        );
    });

    it("references donna/tools.md for persistence", () => {
        const content = fs.readFileSync(addToolWorkflowPath, "utf8");
        assert.ok(
            content.includes("donna/tools.md"),
            "Should reference donna/tools.md for tool knowledge persistence",
        );
    });

    it("contains git commit step", () => {
        const content = fs.readFileSync(addToolWorkflowPath, "utf8");
        assert.ok(
            content.includes("git") && content.includes("commit"),
            "Should contain git commit step",
        );
    });

    it("contains detect-noted-tools step referencing role.md", () => {
        const content = fs.readFileSync(addToolWorkflowPath, "utf8");
        assert.ok(
            content.includes("detect-noted-tools") && content.includes("role.md"),
            "Should detect tools noted by set-role",
        );
    });
});

// ─── relearn-tools stub ───────────────────────────────────────────────────────

describe("stub: stubs/claude-code/donna/relearn-tools.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(relearnToolsStubPath), "relearn-tools stub should exist");
    });

    it('has YAML frontmatter with name "donna:relearn-tools"', () => {
        const content = fs.readFileSync(relearnToolsStubPath, "utf8");
        assert.ok(content.startsWith("---"), "Should start with YAML frontmatter delimiter");
        assert.ok(
            content.includes("name: donna:relearn-tools"),
            "Should have name: donna:relearn-tools in frontmatter",
        );
    });

    it("has description field in frontmatter", () => {
        const content = fs.readFileSync(relearnToolsStubPath, "utf8");
        assert.ok(content.includes("description:"), "Should have description field in frontmatter");
    });

    it("has Read in allowed-tools", () => {
        const content = fs.readFileSync(relearnToolsStubPath, "utf8");
        assert.ok(content.includes("- Read"), "Should have Read in allowed-tools");
    });

    it("has Write in allowed-tools", () => {
        const content = fs.readFileSync(relearnToolsStubPath, "utf8");
        assert.ok(content.includes("- Write"), "Should have Write in allowed-tools");
    });

    it("has Bash in allowed-tools", () => {
        const content = fs.readFileSync(relearnToolsStubPath, "utf8");
        assert.ok(content.includes("- Bash"), "Should have Bash in allowed-tools");
    });

    it("does NOT have AskUserQuestion in allowed-tools (non-interactive)", () => {
        const content = fs.readFileSync(relearnToolsStubPath, "utf8");
        assert.ok(
            !content.includes("- AskUserQuestion"),
            "Should NOT have AskUserQuestion — relearn-tools is non-interactive",
        );
    });

    it("contains @~/.donna/workflows/relearn-tools.md reference", () => {
        const content = fs.readFileSync(relearnToolsStubPath, "utf8");
        assert.ok(
            content.includes("@~/.donna/workflows/relearn-tools.md"),
            "Should reference @~/.donna/workflows/relearn-tools.md",
        );
    });
});

describe("workflow: workflows/relearn-tools.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(relearnToolsWorkflowPath), "relearn-tools workflow should exist");
    });

    it("references config/donna/config.md", () => {
        const content = fs.readFileSync(relearnToolsWorkflowPath, "utf8");
        assert.ok(
            content.includes("config/donna/config.md"),
            "Should reference config/donna/config.md",
        );
    });

    it("contains check-pending-migrations step", () => {
        const content = fs.readFileSync(relearnToolsWorkflowPath, "utf8");
        assert.ok(
            content.includes("check-pending-migrations"),
            "Should contain check-pending-migrations step",
        );
    });

    it("contains version comparison logic (--version present)", () => {
        const content = fs.readFileSync(relearnToolsWorkflowPath, "utf8");
        assert.ok(
            content.includes("--version"),
            "Should contain --version for installed version comparison",
        );
    });

    it("references donna/tools.md", () => {
        const content = fs.readFileSync(relearnToolsWorkflowPath, "utf8");
        assert.ok(
            content.includes("donna/tools.md"),
            "Should reference donna/tools.md for tool registry",
        );
    });

    it("contains git commit step", () => {
        const content = fs.readFileSync(relearnToolsWorkflowPath, "utf8");
        assert.ok(
            content.includes("git") && content.includes("commit"),
            "Should contain git commit step",
        );
    });
});

// ─── run-tools stub ──────────────────────────────────────────────────────────

describe("stub: stubs/claude-code/donna/run-tools.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(runToolsStubPath), "run-tools stub should exist");
    });

    it('has YAML frontmatter with name "donna:run-tools"', () => {
        const content = fs.readFileSync(runToolsStubPath, "utf8");
        assert.ok(content.startsWith("---"), "Should start with YAML frontmatter delimiter");
        assert.ok(
            content.includes("name: donna:run-tools"),
            "Should have name: donna:run-tools in frontmatter",
        );
    });

    it("has description field in frontmatter", () => {
        const content = fs.readFileSync(runToolsStubPath, "utf8");
        assert.ok(content.includes("description:"), "Should have description field in frontmatter");
    });

    it("has Read in allowed-tools", () => {
        const content = fs.readFileSync(runToolsStubPath, "utf8");
        assert.ok(content.includes("- Read"), "Should have Read in allowed-tools");
    });

    it("has Write in allowed-tools", () => {
        const content = fs.readFileSync(runToolsStubPath, "utf8");
        assert.ok(content.includes("- Write"), "Should have Write in allowed-tools");
    });

    it("has Bash in allowed-tools", () => {
        const content = fs.readFileSync(runToolsStubPath, "utf8");
        assert.ok(content.includes("- Bash"), "Should have Bash in allowed-tools");
    });

    it("does NOT have AskUserQuestion in allowed-tools (non-interactive)", () => {
        const content = fs.readFileSync(runToolsStubPath, "utf8");
        assert.ok(
            !content.includes("- AskUserQuestion"),
            "Should NOT have AskUserQuestion — run-tools is non-interactive",
        );
    });

    it("contains @~/.donna/workflows/run-tools.md reference", () => {
        const content = fs.readFileSync(runToolsStubPath, "utf8");
        assert.ok(
            content.includes("@~/.donna/workflows/run-tools.md"),
            "Should reference @~/.donna/workflows/run-tools.md",
        );
    });
});

describe("workflow: workflows/run-tools.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(runToolsWorkflowPath), "run-tools workflow should exist");
    });

    it("references config/donna/config.md", () => {
        const content = fs.readFileSync(runToolsWorkflowPath, "utf8");
        assert.ok(
            content.includes("config/donna/config.md"),
            "Should reference config/donna/config.md",
        );
    });

    it("contains check-pending-migrations step", () => {
        const content = fs.readFileSync(runToolsWorkflowPath, "utf8");
        assert.ok(
            content.includes("check-pending-migrations"),
            "Should contain check-pending-migrations step",
        );
    });

    it("contains smart-merge step", () => {
        const content = fs.readFileSync(runToolsWorkflowPath, "utf8");
        assert.ok(content.includes("smart-merge"), "Should contain smart-merge step");
    });

    it('references "## From Tools" section format', () => {
        const content = fs.readFileSync(runToolsWorkflowPath, "utf8");
        assert.ok(
            content.includes("## From Tools"),
            "Should reference ## From Tools section format",
        );
    });

    it('references "## Resolved" section format', () => {
        const content = fs.readFileSync(runToolsWorkflowPath, "utf8");
        assert.ok(content.includes("## Resolved"), "Should reference ## Resolved section format");
    });

    it("contains timeout for failure isolation", () => {
        const content = fs.readFileSync(runToolsWorkflowPath, "utf8");
        assert.ok(
            content.includes("timeout"),
            "Should contain timeout for per-tool failure isolation",
        );
    });

    it("contains git commit step", () => {
        const content = fs.readFileSync(runToolsWorkflowPath, "utf8");
        assert.ok(
            content.includes("git") && content.includes("commit"),
            "Should contain git commit step",
        );
    });
});

// ─── cross-cutting: done.md counter-strip ────────────────────────────────────

describe("cross-cutting: done.md counter-strip", () => {
    it("strips (N times) suffix in select-tasks for fuzzy matching", () => {
        const content = fs.readFileSync(doneWorkflowPath, "utf8");
        assert.ok(
            content.includes("(N times)") || content.includes("\\d+ times"),
            "done.md should reference stripping the (N times) carry-forward counter suffix",
        );
    });

    it("strips [text](url) suffix in select-tasks for fuzzy matching", () => {
        const content = fs.readFileSync(doneWorkflowPath, "utf8");
        assert.ok(
            content.includes("[<text>](<url>)") || content.includes("[<identifier>](<url>)"),
            "done.md should reference stripping the [text](url) source link suffix",
        );
    });
});

// ─── cross-cutting: begin-the-day tool integration ───────────────────────────

describe("cross-cutting: begin-the-day tool integration", () => {
    it("contains pull-tool-data step", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        assert.ok(
            content.includes("pull-tool-data"),
            "begin-the-day should contain pull-tool-data step",
        );
    });

    it("references donna/tools.md for tool data", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        assert.ok(
            content.includes("donna/tools.md"),
            "begin-the-day should reference donna/tools.md",
        );
    });

    it("gracefully handles missing tools.md", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        assert.ok(
            content.includes("does not exist") && content.includes("tool"),
            "begin-the-day should handle missing tools.md gracefully",
        );
    });

    it("includes ## From Tools section in daily file", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        assert.ok(
            content.includes("## From Tools"),
            "begin-the-day should include ## From Tools section",
        );
    });

    it("includes timeout for failure isolation", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        assert.ok(
            content.includes("timeout 10") || content.includes("timeout"),
            "begin-the-day should use timeout for tool command failure isolation",
        );
    });

    it("includes ## Warnings section in daily file", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        assert.ok(
            content.includes("## Warnings"),
            "begin-the-day should include ## Warnings section in daily file for tool warning persistence",
        );
    });

    it("uses descriptive link text instead of tool name", () => {
        const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
        assert.ok(
            content.includes("owner/repo") && content.includes("#<number>"),
            "begin-the-day should use descriptive link text like [owner/repo#number](url) instead of [gh](url)",
        );
    });
});

describe("cross-cutting: add-tool scope", () => {
    it("contains ask-scope step", () => {
        const content = fs.readFileSync(addToolWorkflowPath, "utf8");
        assert.ok(
            content.includes("ask-scope"),
            "add-tool should contain ask-scope step for per-tool context",
        );
    });

    it("stores scope in tools.md", () => {
        const content = fs.readFileSync(addToolWorkflowPath, "utf8");
        assert.ok(content.includes("- scope:"), "add-tool should persist scope field in tools.md");
    });
});

// ─── cross-cutting: installer skill list ─────────────────────────────────────

const installerPath = path.join(projectRoot, "src", "installer.cjs");

describe("cross-cutting: installer skill list", () => {
    it('success message includes "set-role"', () => {
        const content = fs.readFileSync(installerPath, "utf8");
        assert.ok(
            content.includes("set-role"),
            "Installer success message should include set-role skill",
        );
    });

    it('success message includes "begin-the-day"', () => {
        const content = fs.readFileSync(installerPath, "utf8");
        assert.ok(
            content.includes("begin-the-day"),
            "Installer success message should include begin-the-day skill",
        );
    });

    it('success message includes "add-tool"', () => {
        const content = fs.readFileSync(installerPath, "utf8");
        assert.ok(
            content.includes("add-tool"),
            "Installer success message should include add-tool skill",
        );
    });

    it('success message includes "relearn-tools"', () => {
        const content = fs.readFileSync(installerPath, "utf8");
        assert.ok(
            content.includes("relearn-tools"),
            "Installer success message should include relearn-tools skill",
        );
    });

    it('success message includes "run-tools"', () => {
        const content = fs.readFileSync(installerPath, "utf8");
        assert.ok(
            content.includes("run-tools"),
            "Installer success message should include run-tools skill",
        );
    });
});
