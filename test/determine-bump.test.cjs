"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { determineBump } = require("../scripts/determine-bump.cjs");
const { generateChangelog, extractScope } = require("../scripts/generate-changelog.cjs");

describe("determineBump", () => {
    it("fix commits produce patch bump", () => {
        const result = determineBump(["fix: correct typo"], "0.1.0");
        assert.equal(result.bump, "patch");
        assert.equal(result.newVersion, "0.1.1");
    });

    it("feat commits produce minor bump", () => {
        const result = determineBump(["feat: add new feature"], "0.1.0");
        assert.equal(result.bump, "minor");
        assert.equal(result.newVersion, "0.2.0");
    });

    it("feat! breaking commits produce minor when version starts with 0.", () => {
        const result = determineBump(["feat!: breaking change"], "0.1.0");
        assert.equal(result.bump, "minor");
        assert.equal(result.newVersion, "0.2.0");
    });

    it("BREAKING CHANGE in commit body produces minor when version starts with 0.", () => {
        const result = determineBump(
            ["feat: something\n\nBREAKING CHANGE: old api removed"],
            "0.3.0",
        );
        assert.equal(result.bump, "minor");
        assert.equal(result.newVersion, "0.4.0");
    });

    it("mix of fix and feat commits produces minor (highest wins)", () => {
        const result = determineBump(
            ["fix: a bug", "feat: a feature", "fix: another bug"],
            "0.1.0",
        );
        assert.equal(result.bump, "minor");
        assert.equal(result.newVersion, "0.2.0");
    });

    it("no conventional commits found throws error", () => {
        assert.throws(() => determineBump([], "0.1.0"), /no commits/i);
    });

    it("chore, docs, ci commits produce patch bump", () => {
        const result = determineBump(
            ["chore: update deps", "docs: fix readme", "ci: update workflow"],
            "0.1.0",
        );
        assert.equal(result.bump, "patch");
        assert.equal(result.newVersion, "0.1.1");
    });

    it("version calculation is correct for patch", () => {
        const result = determineBump(["fix: something"], "0.1.0");
        assert.equal(result.newVersion, "0.1.1");
    });

    it("version calculation is correct for minor", () => {
        const result = determineBump(["feat: something"], "0.1.0");
        assert.equal(result.newVersion, "0.2.0");
    });
});

describe("generateChangelog", () => {
    it("groups feat and fix commits into Features and Fixes", () => {
        const changelog = generateChangelog(["feat: add login", "fix: correct password check"]);
        assert.ok(changelog.includes("### Features"));
        assert.ok(changelog.includes("### Fixes"));
        assert.ok(changelog.includes("add login"));
        assert.ok(changelog.includes("correct password check"));
    });

    it("drops chore/docs/other commits", () => {
        const changelog = generateChangelog([
            "feat: add login",
            "chore: update deps",
            "docs: update readme",
            "ci: fix pipeline",
        ]);
        assert.ok(!changelog.includes("update deps"));
        assert.ok(!changelog.includes("update readme"));
        assert.ok(!changelog.includes("fix pipeline"));
    });

    it("includes bold scopes when present", () => {
        const changelog = generateChangelog([
            "feat(capture): add meeting log",
            "fix(ci): fix workflow issues (#1)",
        ]);
        assert.ok(changelog.includes("**capture:** add meeting log"));
        assert.ok(changelog.includes("**ci:** fix workflow issues (#1)"));
    });

    it("outputs formatted markdown", () => {
        const changelog = generateChangelog(["feat: add login", "fix: correct bug"]);
        assert.ok(changelog.includes("- "));
        assert.ok(changelog.includes("### "));
    });

    it("omits empty sections", () => {
        const changelog = generateChangelog(["feat: add login"]);
        assert.ok(changelog.includes("### Features"));
        assert.ok(!changelog.includes("### Fixes"));
    });
});

describe("extractScope", () => {
    it("extracts scope from conventional commit", () => {
        assert.equal(extractScope("feat(ci): something"), "ci");
        assert.equal(extractScope("fix(auth): something"), "auth");
    });

    it("returns null when no scope", () => {
        assert.equal(extractScope("feat: something"), null);
    });
});
