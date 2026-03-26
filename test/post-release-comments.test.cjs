"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const { scanDoneTodos } = require("../scripts/post-release-comments.cjs");

describe("scanDoneTodos", () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "donna-test-"));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("returns empty object for non-existent directory", () => {
        const result = scanDoneTodos("/non/existent/path");
        assert.deepStrictEqual(result, {});
    });

    it("returns empty object for empty directory", () => {
        const result = scanDoneTodos(tmpDir);
        assert.deepStrictEqual(result, {});
    });

    it("extracts github_issue from frontmatter", () => {
        fs.writeFileSync(
            path.join(tmpDir, "test-todo.md"),
            [
                "---",
                "created: 2026-03-26T00:00:00.000Z",
                "title: Fix something (ref: #42)",
                "github_issue: 42",
                "files: []",
                "---",
                "",
                "## Problem",
                "Something is broken",
            ].join("\n"),
        );

        const result = scanDoneTodos(tmpDir);
        assert.deepStrictEqual(result, { 42: ["test-todo.md"] });
    });

    it("groups multiple TODOs by issue number", () => {
        fs.writeFileSync(path.join(tmpDir, "todo-a.md"), "---\ngithub_issue: 10\n---\n");
        fs.writeFileSync(path.join(tmpDir, "todo-b.md"), "---\ngithub_issue: 10\n---\n");

        const result = scanDoneTodos(tmpDir);
        assert.strictEqual(result[10].length, 2);
    });

    it("skips files without github_issue field", () => {
        fs.writeFileSync(path.join(tmpDir, "no-issue.md"), "---\ntitle: Something\n---\n");

        const result = scanDoneTodos(tmpDir);
        assert.deepStrictEqual(result, {});
    });

    it("skips non-md files", () => {
        fs.writeFileSync(path.join(tmpDir, "notes.txt"), "github_issue: 99");

        const result = scanDoneTodos(tmpDir);
        assert.deepStrictEqual(result, {});
    });
});
