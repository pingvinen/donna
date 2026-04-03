"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const { scanForIssueLinks } = require("../scripts/pre-release-check.cjs");

describe("scanForIssueLinks", () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "donna-test-"));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("returns empty array for non-existent directory", () => {
        const result = scanForIssueLinks("/non/existent/path");
        assert.deepStrictEqual(result, []);
    });

    it("returns empty array for empty directory", () => {
        const result = scanForIssueLinks(tmpDir);
        assert.deepStrictEqual(result, []);
    });

    it("finds TODOs with github_issue fields", () => {
        fs.writeFileSync(
            path.join(tmpDir, "add-feature.md"),
            "---\ntitle: Add feature\ngithub_issue: 27\n---\n",
        );

        const result = scanForIssueLinks(tmpDir);
        assert.deepStrictEqual(result, [{ file: "add-feature.md", issue: 27 }]);
    });

    it("returns multiple matches", () => {
        fs.writeFileSync(path.join(tmpDir, "todo-a.md"), "---\ngithub_issue: 10\n---\n");
        fs.writeFileSync(path.join(tmpDir, "todo-b.md"), "---\ngithub_issue: 20\n---\n");

        const result = scanForIssueLinks(tmpDir);
        assert.strictEqual(result.length, 2);
        const issues = result.map((r) => r.issue).sort();
        assert.deepStrictEqual(issues, [10, 20]);
    });

    it("skips files without github_issue field", () => {
        fs.writeFileSync(path.join(tmpDir, "no-issue.md"), "---\ntitle: Something\n---\n");

        const result = scanForIssueLinks(tmpDir);
        assert.deepStrictEqual(result, []);
    });

    it("skips non-md files", () => {
        fs.writeFileSync(path.join(tmpDir, "notes.txt"), "github_issue: 99");

        const result = scanForIssueLinks(tmpDir);
        assert.deepStrictEqual(result, []);
    });
});
