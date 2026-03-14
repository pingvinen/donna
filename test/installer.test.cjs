"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

/**
 * Helper: create a temp homeDir with optional .claude/ for provider detection.
 * Returns { homeDir, donnaDir, cleanup }.
 */
function makeTempHome({ withClaude = false, withVersion = null } = {}) {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "donna-test-"));
    const donnaDir = path.join(homeDir, ".donna");

    if (withClaude) {
        fs.mkdirSync(path.join(homeDir, ".claude", "commands"), {
            recursive: true,
        });
    }

    if (withVersion) {
        fs.mkdirSync(donnaDir, { recursive: true });
        const { writeVersion } = require("../src/version.cjs");
        writeVersion(donnaDir, withVersion.version, withVersion.lastMigration || 0);
    }

    return {
        homeDir,
        donnaDir,
        cleanup() {
            fs.rmSync(homeDir, { recursive: true, force: true });
        },
    };
}

/**
 * Helper: capture console.log output during a function call.
 */
async function captureOutput(fn) {
    const lines = [];
    const originalLog = console.log;
    console.log = (...args) => lines.push(args.join(" "));
    try {
        await fn();
    } finally {
        console.log = originalLog;
    }
    return lines;
}

describe("installer - fresh install", () => {
    let env;

    beforeEach(() => {
        env = makeTempHome({ withClaude: true });
    });

    afterEach(() => {
        env.cleanup();
    });

    it("creates ~/.donna/ directory", async () => {
        const { run } = require("../src/installer.cjs");
        await captureOutput(() => run({ homeDir: env.homeDir }));
        assert.ok(fs.existsSync(env.donnaDir), "~/.donna/ should exist");
    });

    it("runs all migrations (001-initial creates subdirs)", async () => {
        const { run } = require("../src/installer.cjs");
        await captureOutput(() => run({ homeDir: env.homeDir }));
        assert.ok(
            fs.existsSync(path.join(env.donnaDir, "workflows")),
            "workflows/ should exist from migration",
        );
        assert.ok(
            fs.existsSync(path.join(env.donnaDir, "templates")),
            "templates/ should exist from migration",
        );
        assert.ok(
            fs.existsSync(path.join(env.donnaDir, "references")),
            "references/ should exist from migration",
        );
    });

    it("writes version.md with correct version and last migration", async () => {
        const { run } = require("../src/installer.cjs");
        await captureOutput(() => run({ homeDir: env.homeDir }));
        const { readVersion } = require("../src/version.cjs");
        const ver = readVersion(env.donnaDir);
        assert.ok(ver, "version.md should exist");
        const pkg = require("../package.json");
        assert.equal(ver.version, pkg.version);
        assert.equal(ver.lastMigration, 1);
    });

    it("copies stubs to detected provider directories", async () => {
        const { run } = require("../src/installer.cjs");
        await captureOutput(() => run({ homeDir: env.homeDir }));
        const setupStub = path.join(env.homeDir, ".claude", "commands", "donna", "setup.md");
        assert.ok(fs.existsSync(setupStub), "donna:setup stub should be copied");
    });

    it("copies workflows to ~/.donna/workflows/", async () => {
        const { run } = require("../src/installer.cjs");
        await captureOutput(() => run({ homeDir: env.homeDir }));
        const setupWorkflow = path.join(env.donnaDir, "workflows", "setup.md");
        assert.ok(fs.existsSync(setupWorkflow), "setup.md should be copied to workflows/");
    });

    it("output includes banner and success checkmarks", async () => {
        const { run } = require("../src/installer.cjs");
        const lines = await captureOutput(() => run({ homeDir: env.homeDir }));
        const output = lines.join("\n");
        assert.ok(output.includes("DONNA"), "should print banner");
        assert.ok(output.includes("\u2713"), "should print success checkmarks");
    });
});

describe("installer - upgrade", () => {
    let env;

    beforeEach(() => {
        env = makeTempHome({
            withClaude: true,
            withVersion: { version: "0.0.1", lastMigration: 0 },
        });
    });

    afterEach(() => {
        env.cleanup();
    });

    it("detects older version and runs only pending migrations", async () => {
        const { run } = require("../src/installer.cjs");
        await captureOutput(() => run({ homeDir: env.homeDir }));
        // migrations should have run (001-initial creates subdirs)
        assert.ok(
            fs.existsSync(path.join(env.donnaDir, "workflows")),
            "migration should create workflows/",
        );
    });

    it("shows upgrade header with version arrow", async () => {
        const { run } = require("../src/installer.cjs");
        const lines = await captureOutput(() => run({ homeDir: env.homeDir }));
        const output = lines.join("\n");
        assert.ok(output.includes("0.0.1"), "should show old version");
        assert.ok(output.includes("\u2192"), "should show arrow");
    });

    it("shows migration descriptions as changelog lines", async () => {
        const { run } = require("../src/installer.cjs");
        const lines = await captureOutput(() => run({ homeDir: env.homeDir }));
        const output = lines.join("\n");
        assert.ok(
            output.includes("Initial directory structure"),
            "should show migration description",
        );
    });

    it("updates version.md with new version and last migration", async () => {
        const { run } = require("../src/installer.cjs");
        await captureOutput(() => run({ homeDir: env.homeDir }));
        const { readVersion } = require("../src/version.cjs");
        const ver = readVersion(env.donnaDir);
        const pkg = require("../package.json");
        assert.equal(ver.version, pkg.version);
        assert.equal(ver.lastMigration, 1);
    });
});

describe("installer - idempotent", () => {
    let env;

    beforeEach(() => {
        const pkg = require("../package.json");
        env = makeTempHome({
            withClaude: true,
            withVersion: { version: pkg.version, lastMigration: 1 },
        });
        // Ensure migration dirs exist (as if previously installed)
        fs.mkdirSync(path.join(env.donnaDir, "workflows"), { recursive: true });
        fs.mkdirSync(path.join(env.donnaDir, "templates"), { recursive: true });
        fs.mkdirSync(path.join(env.donnaDir, "references"), { recursive: true });
    });

    afterEach(() => {
        env.cleanup();
    });

    it("prints 'already up to date' when version matches", async () => {
        const { run } = require("../src/installer.cjs");
        const lines = await captureOutput(() => run({ homeDir: env.homeDir }));
        const output = lines.join("\n");
        assert.ok(
            output.toLowerCase().includes("already up to date"),
            "should say already up to date",
        );
    });

    it("does not re-run migrations on idempotent run", async () => {
        const { run } = require("../src/installer.cjs");
        // Get version.md mtime before
        const versionPath = path.join(env.donnaDir, "version.md");
        const mtimeBefore = fs.statSync(versionPath).mtimeMs;

        // Small delay to ensure mtime would differ
        await new Promise((r) => setTimeout(r, 50));

        await captureOutput(() => run({ homeDir: env.homeDir }));

        // Version file should NOT be rewritten on idempotent run
        const mtimeAfter = fs.statSync(versionPath).mtimeMs;
        assert.equal(mtimeBefore, mtimeAfter, "version.md should not be rewritten");
    });
});

describe("installer - no provider", () => {
    let env;

    beforeEach(() => {
        env = makeTempHome({ withClaude: false });
    });

    afterEach(() => {
        env.cleanup();
    });

    it("still creates ~/.donna/ and runs migrations", async () => {
        const { run } = require("../src/installer.cjs");
        await captureOutput(() => run({ homeDir: env.homeDir }));
        assert.ok(fs.existsSync(env.donnaDir), "~/.donna/ should exist");
        assert.ok(
            fs.existsSync(path.join(env.donnaDir, "workflows")),
            "migrations should still run",
        );
    });

    it("prints warning about no providers detected", async () => {
        const { run } = require("../src/installer.cjs");
        const lines = await captureOutput(() => run({ homeDir: env.homeDir }));
        const output = lines.join("\n");
        assert.ok(
            output.toLowerCase().includes("no supported ai providers"),
            "should warn about no providers",
        );
    });
});

describe("installer - migration failure", () => {
    let env;
    let badMigrationPath;

    beforeEach(() => {
        env = makeTempHome({ withClaude: true });
        // Create a bad migration file that will fail
        const migrationsDir = path.join(__dirname, "..", "migrations");
        badMigrationPath = path.join(migrationsDir, "999-bad-test.cjs");
        fs.writeFileSync(
            badMigrationPath,
            `"use strict";
module.exports = {
  version: "0.1.0",
  description: "Bad migration for testing",
  up(ctx) { throw new Error("Intentional test failure"); }
};`,
        );
    });

    afterEach(() => {
        // Clean up bad migration
        if (fs.existsSync(badMigrationPath)) {
            fs.unlinkSync(badMigrationPath);
        }
        // Clear require cache for migrations
        for (const key of Object.keys(require.cache)) {
            if (key.includes("migrations")) {
                delete require.cache[key];
            }
        }
        env.cleanup();
    });

    it("stops at failed migration and records last successful in version.md", async () => {
        const { run } = require("../src/installer.cjs");
        const lines = [];
        const originalLog = console.log;
        console.log = (...args) => lines.push(args.join(" "));

        let threw = false;
        try {
            await run({ homeDir: env.homeDir });
        } catch {
            threw = true;
        } finally {
            console.log = originalLog;
        }

        assert.ok(threw, "should throw on migration failure");

        // Version should be written with last successful migration (001)
        const { readVersion } = require("../src/version.cjs");
        const ver = readVersion(env.donnaDir);
        assert.ok(ver, "version.md should exist after partial failure");
        assert.equal(ver.lastMigration, 1, "should record last successful migration as 1");
    });

    it("prints failure message with cross prefix", async () => {
        const { run } = require("../src/installer.cjs");
        const lines = [];
        const originalLog = console.log;
        console.log = (...args) => lines.push(args.join(" "));

        try {
            await run({ homeDir: env.homeDir });
        } catch {
            // expected
        } finally {
            console.log = originalLog;
        }

        const output = lines.join("\n");
        assert.ok(output.includes("\u2717"), "should print failure with cross");
    });
});

describe("bin/install.cjs", () => {
    it("has shebang line", () => {
        const content = fs.readFileSync(path.join(__dirname, "..", "bin", "install.cjs"), "utf8");
        assert.ok(content.startsWith("#!/usr/bin/env node"), "should have node shebang");
    });

    it("is executable", () => {
        const stat = fs.statSync(path.join(__dirname, "..", "bin", "install.cjs"));
        // Check owner execute bit
        const isExecutable = (stat.mode & 0o100) !== 0;
        assert.ok(isExecutable, "should be executable");
    });
});
