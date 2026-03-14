"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const { readVersion, writeVersion } = require("../src/version.cjs");

describe("version", () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "donna-test-"));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("readVersion returns null when file does not exist", () => {
        const result = readVersion(tmpDir);
        assert.equal(result, null);
    });

    it("readVersion parses version, lastMigration, installed, updated from markdown format", () => {
        const content = [
            "# Donna",
            "",
            "- **Version:** 0.2.0",
            "- **Last migration:** 003",
            "- **Installed:** 2026-01-01T10:00:00.000Z",
            "- **Updated:** 2026-03-14T12:00:00.000Z",
            "",
        ].join("\n");
        fs.writeFileSync(path.join(tmpDir, "version.md"), content);

        const result = readVersion(tmpDir);
        assert.equal(result.version, "0.2.0");
        assert.equal(result.lastMigration, 3);
        assert.equal(result.installed, "2026-01-01T10:00:00.000Z");
        assert.equal(result.updated, "2026-03-14T12:00:00.000Z");
    });

    it("writeVersion creates correct markdown with version, lastMigration, timestamps", () => {
        writeVersion(tmpDir, "0.1.0", 1);

        const content = fs.readFileSync(path.join(tmpDir, "version.md"), "utf8");
        assert.ok(content.includes("# Donna"));
        assert.ok(content.includes("**Version:** 0.1.0"));
        assert.ok(content.includes("**Last migration:** 001"));
        assert.ok(content.includes("**Installed:**"));
        assert.ok(content.includes("**Updated:**"));
    });

    it('writeVersion on existing file updates "Updated" timestamp but preserves "Installed" timestamp', () => {
        const originalInstalled = "2026-01-01T10:00:00.000Z";
        const existingContent = [
            "# Donna",
            "",
            "- **Version:** 0.1.0",
            "- **Last migration:** 001",
            `- **Installed:** ${originalInstalled}`,
            "- **Updated:** 2026-01-01T10:00:00.000Z",
            "",
        ].join("\n");
        fs.writeFileSync(path.join(tmpDir, "version.md"), existingContent);

        writeVersion(tmpDir, "0.2.0", 3);

        const result = readVersion(tmpDir);
        assert.equal(result.version, "0.2.0");
        assert.equal(result.lastMigration, 3);
        assert.equal(result.installed, originalInstalled);
        assert.notEqual(result.updated, originalInstalled);
    });
});
