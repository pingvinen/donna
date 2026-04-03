"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const {
    readReviewTimestamp,
    readStateTimestamp,
    scanForIssueLinks,
} = require("../scripts/pre-release-check.cjs");

describe("scanForIssueLinks", () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "donna-test-"));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("returns empty array for non-existent directory", () => {
        assert.deepStrictEqual(scanForIssueLinks("/non/existent/path"), []);
    });

    it("returns empty array for empty directory", () => {
        assert.deepStrictEqual(scanForIssueLinks(tmpDir), []);
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
        assert.deepStrictEqual(scanForIssueLinks(tmpDir), []);
    });

    it("skips non-md files", () => {
        fs.writeFileSync(path.join(tmpDir, "notes.txt"), "github_issue: 99");
        assert.deepStrictEqual(scanForIssueLinks(tmpDir), []);
    });
});

describe("readReviewTimestamp", () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "donna-test-"));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("returns null for non-existent file", () => {
        assert.strictEqual(readReviewTimestamp(path.join(tmpDir, "nope")), null);
    });

    it("reads valid ISO timestamp", () => {
        const ts = "2026-03-28T10:00:00.000Z";
        fs.writeFileSync(path.join(tmpDir, "marker"), `${ts}\n`);
        const result = readReviewTimestamp(path.join(tmpDir, "marker"));
        assert.deepStrictEqual(result, new Date(ts));
    });

    it("returns null for invalid content", () => {
        fs.writeFileSync(path.join(tmpDir, "marker"), "not a date\n");
        assert.strictEqual(readReviewTimestamp(path.join(tmpDir, "marker")), null);
    });
});

describe("readStateTimestamp", () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "donna-test-"));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("returns null for non-existent file", () => {
        assert.strictEqual(readStateTimestamp(path.join(tmpDir, "nope")), null);
    });

    it("reads last_updated from frontmatter", () => {
        const state = ["---", 'last_updated: "2026-03-27T20:19:54.511Z"', "---", "# State"].join(
            "\n",
        );
        fs.writeFileSync(path.join(tmpDir, "STATE.md"), state);
        const result = readStateTimestamp(path.join(tmpDir, "STATE.md"));
        assert.deepStrictEqual(result, new Date("2026-03-27T20:19:54.511Z"));
    });

    it("returns null when last_updated is missing", () => {
        fs.writeFileSync(path.join(tmpDir, "STATE.md"), "---\nstatus: done\n---\n");
        assert.strictEqual(readStateTimestamp(path.join(tmpDir, "STATE.md")), null);
    });
});

describe("pre-release check integration", () => {
    let tmpDir;
    let pendingDir;
    let markerPath;
    let statePath;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "donna-test-"));
        pendingDir = path.join(tmpDir, "todos", "pending");
        markerPath = path.join(tmpDir, "todos", ".last-reviewed");
        statePath = path.join(tmpDir, "STATE.md");
        fs.mkdirSync(pendingDir, { recursive: true });
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("passes when no issue-linked TODOs exist", () => {
        fs.writeFileSync(path.join(pendingDir, "plain.md"), "---\ntitle: No issue\n---\n");
        const linked = scanForIssueLinks(pendingDir);
        assert.strictEqual(linked.length, 0);
    });

    it("detects stale review (review before phase completion)", () => {
        fs.writeFileSync(path.join(pendingDir, "todo.md"), "---\ngithub_issue: 42\n---\n");
        fs.writeFileSync(markerPath, "2026-03-26T10:00:00.000Z\n");
        fs.writeFileSync(statePath, '---\nlast_updated: "2026-03-27T20:00:00.000Z"\n---\n');

        const linked = scanForIssueLinks(pendingDir);
        const reviewDate = readReviewTimestamp(markerPath);
        const stateDate = readStateTimestamp(statePath);

        assert.ok(linked.length > 0);
        assert.ok(reviewDate < stateDate, "review should be stale");
    });

    it("passes when review is after phase completion", () => {
        fs.writeFileSync(path.join(pendingDir, "todo.md"), "---\ngithub_issue: 42\n---\n");
        fs.writeFileSync(markerPath, "2026-03-28T10:00:00.000Z\n");
        fs.writeFileSync(statePath, '---\nlast_updated: "2026-03-27T20:00:00.000Z"\n---\n');

        const reviewDate = readReviewTimestamp(markerPath);
        const stateDate = readStateTimestamp(statePath);

        assert.ok(reviewDate >= stateDate, "review should be current");
    });
});
