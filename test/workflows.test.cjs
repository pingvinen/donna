"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const workflowsDir = path.join(__dirname, "..", ".github", "workflows");

function readWorkflow(name) {
    return fs.readFileSync(path.join(workflowsDir, name), "utf8");
}

describe("pr-lint.yml", () => {
    const content = readWorkflow("pr-lint.yml");

    it("exists and is readable", () => {
        assert.ok(content.length > 0);
    });

    it("triggers on pull_request", () => {
        assert.ok(content.includes("pull_request:"));
    });

    it("has pr-lint job using semantic-pull-request action", () => {
        assert.ok(content.includes("pr-lint:"));
        assert.ok(content.includes("amannn/action-semantic-pull-request"));
    });
});

describe("pr-validate.yml", () => {
    const content = readWorkflow("pr-validate.yml");

    it("exists and is readable", () => {
        assert.ok(content.length > 0);
    });

    it("triggers on pull_request", () => {
        assert.ok(content.includes("pull_request:"));
    });

    it("has lint, test, and build jobs", () => {
        assert.ok(content.includes("npm run lint"));
        assert.ok(content.includes("npm test"));
        assert.ok(content.includes("npm pack --dry-run"));
    });
});

describe("release.yml", () => {
    const content = readWorkflow("release.yml");

    it("exists and is readable", () => {
        assert.ok(content.length > 0);
    });

    it("triggers on workflow_dispatch", () => {
        assert.ok(content.includes("workflow_dispatch"));
    });

    it("has contents: write permission", () => {
        assert.ok(content.includes("contents: write"));
    });

    it("runs pre-release-check before version bump", () => {
        const checkIdx = content.indexOf("node scripts/pre-release-check.cjs");
        const bumpIdx = content.indexOf("node scripts/determine-bump.cjs");
        assert.ok(checkIdx > -1, "pre-release-check step exists");
        assert.ok(checkIdx < bumpIdx, "pre-release-check runs before determine-bump");
    });

    it("runs determine-bump.cjs script", () => {
        assert.ok(content.includes("node scripts/determine-bump.cjs"));
    });

    it("runs generate-changelog.cjs script", () => {
        assert.ok(content.includes("node scripts/generate-changelog.cjs"));
    });

    it("creates a GitHub release with gh", () => {
        assert.ok(content.includes("gh release create"));
    });

    it("runs post-release-comments.cjs script", () => {
        assert.ok(content.includes("node scripts/post-release-comments.cjs"));
    });

    it("passes version to post-release-comments script", () => {
        assert.ok(
            content.includes("post-release-comments.cjs ${{ steps.bump.outputs.new_version }}"),
        );
    });
});

describe("deploy.yml", () => {
    const content = readWorkflow("deploy.yml");

    it("exists and is readable", () => {
        assert.ok(content.length > 0);
    });

    it("triggers on release published", () => {
        assert.ok(content.includes("release:"));
        assert.ok(content.includes("published"));
    });

    it("has id-token: write permission for OIDC", () => {
        assert.ok(content.includes("id-token: write"));
    });

    it("runs npm publish with provenance and public access", () => {
        assert.ok(content.includes("npm publish --provenance --access public"));
    });

    it("sets up registry-url for npm", () => {
        assert.ok(content.includes("registry-url"));
        assert.ok(content.includes("registry.npmjs.org"));
    });
});
