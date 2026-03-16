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
        assert.equal(ver.lastMigration, 2);
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
        assert.ok(output.includes("Donna"), "should print banner");
        assert.ok(output.includes("\u2713"), "should print success checkmarks");
    });

    it("migration 002 creates state.md with pending_migrations", async () => {
        const { run } = require("../src/installer.cjs");
        await captureOutput(() => run({ homeDir: env.homeDir }));
        const statePath = path.join(env.donnaDir, "state.md");
        assert.ok(fs.existsSync(statePath), "state.md should exist after install");
        const content = fs.readFileSync(statePath, "utf8");
        assert.ok(
            content.includes("move-standing-files"),
            "state.md should contain move-standing-files",
        );
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
        assert.equal(ver.lastMigration, 2);
    });

    it("migration 002 creates state.md with pending_migrations on upgrade", async () => {
        const { run } = require("../src/installer.cjs");
        await captureOutput(() => run({ homeDir: env.homeDir }));
        const statePath = path.join(env.donnaDir, "state.md");
        assert.ok(fs.existsSync(statePath), "state.md should exist after upgrade");
        const content = fs.readFileSync(statePath, "utf8");
        assert.ok(
            content.includes("move-standing-files"),
            "state.md should contain move-standing-files",
        );
    });
});

describe("installer - idempotent", () => {
    let env;

    beforeEach(() => {
        const pkg = require("../package.json");
        env = makeTempHome({
            withClaude: true,
            withVersion: { version: pkg.version, lastMigration: 2 },
        });
        // Ensure migration dirs exist (as if previously installed)
        fs.mkdirSync(path.join(env.donnaDir, "workflows"), { recursive: true });
        fs.mkdirSync(path.join(env.donnaDir, "templates"), { recursive: true });
        fs.mkdirSync(path.join(env.donnaDir, "references"), { recursive: true });
        // Ensure state.md exists (as if migration 002 already ran)
        fs.writeFileSync(
            path.join(env.donnaDir, "state.md"),
            "---\npending_migrations:\n  - move-standing-files\n---\n",
            "utf8",
        );
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

    it("state.md still exists on idempotent run", async () => {
        const { run } = require("../src/installer.cjs");
        await captureOutput(() => run({ homeDir: env.homeDir }));
        const statePath = path.join(env.donnaDir, "state.md");
        assert.ok(fs.existsSync(statePath), "state.md should still exist after idempotent run");
        const content = fs.readFileSync(statePath, "utf8");
        assert.ok(
            content.includes("move-standing-files"),
            "state.md should still contain move-standing-files",
        );
    });
});

describe("installer - migration 002 state.md idempotency", () => {
    let env;

    beforeEach(() => {
        env = makeTempHome({ withClaude: true });
    });

    afterEach(() => {
        // Clear require cache so installer.cjs is re-evaluated fresh each time
        for (const key of Object.keys(require.cache)) {
            if (
                key.includes("installer") ||
                key.includes("migrator") ||
                key.includes("migrations")
            ) {
                delete require.cache[key];
            }
        }
        env.cleanup();
    });

    it("running installer twice does not duplicate move-standing-files entry", async () => {
        const { run: run1 } = require("../src/installer.cjs");
        await captureOutput(() => run1({ homeDir: env.homeDir }));

        // Clear cache so second run is a fresh require
        for (const key of Object.keys(require.cache)) {
            if (
                key.includes("installer") ||
                key.includes("migrator") ||
                key.includes("migrations")
            ) {
                delete require.cache[key];
            }
        }

        // Second run — migrations already applied (lastMigration=2), so migration 002 won't re-run.
        // But if it did, the idempotency guard in migration 002 should prevent duplication.
        const { run: run2 } = require("../src/installer.cjs");
        await captureOutput(() => run2({ homeDir: env.homeDir }));

        const statePath = path.join(env.donnaDir, "state.md");
        assert.ok(fs.existsSync(statePath), "state.md should exist");
        const content = fs.readFileSync(statePath, "utf8");

        // Count occurrences — should be exactly one
        const count = (content.match(/move-standing-files/g) || []).length;
        assert.equal(count, 1, "move-standing-files should appear exactly once in state.md");
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

        // Version should be written with last successful migration (002)
        const { readVersion } = require("../src/version.cjs");
        const ver = readVersion(env.donnaDir);
        assert.ok(ver, "version.md should exist after partial failure");
        assert.equal(ver.lastMigration, 2, "should record last successful migration as 2");
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

describe("bin/donna-assistant", () => {
    it("has shebang line", () => {
        const content = fs.readFileSync(
            path.join(__dirname, "..", "bin", "donna-assistant"),
            "utf8",
        );
        assert.ok(content.startsWith("#!/usr/bin/env node"), "should have node shebang");
    });

    it("is executable", () => {
        const stat = fs.statSync(path.join(__dirname, "..", "bin", "donna-assistant"));
        // Check owner execute bit
        const isExecutable = (stat.mode & 0o100) !== 0;
        assert.ok(isExecutable, "should be executable");
    });
});

describe("installer - changelog integration on upgrade", () => {
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

    it("calls changelog display during upgrade without throwing", async () => {
        const { run } = require("../src/installer.cjs");
        const lines = await captureOutput(() => run({ homeDir: env.homeDir }));
        const out = lines.join("\n");
        // CHANGELOG now has a 0.5.0 entry, so upgrading from 0.0.1 should show "What's new:".
        assert.ok(out.includes("Upgrading"), "should show upgrade header");
        assert.ok(out.includes("What's new:"), "should show changelog when upgrading to 0.5.0");
    });

    it("does not show What's new on fresh install", async () => {
        const freshEnv = makeTempHome({ withClaude: true });
        try {
            const { run } = require("../src/installer.cjs");
            const lines = await captureOutput(() => run({ homeDir: freshEnv.homeDir }));
            const out = lines.join("\n");
            assert.ok(!out.includes("What's new:"), "fresh install should not show changelog");
        } finally {
            freshEnv.cleanup();
        }
    });
});

describe("changelog - semverGt", () => {
    const { semverGt } = require("../src/changelog.cjs");

    it("returns true when a > b", () => {
        assert.equal(semverGt("0.5.0", "0.4.0"), true);
    });

    it("returns false when a < b", () => {
        assert.equal(semverGt("0.4.0", "0.5.0"), false);
    });

    it("returns false when a === b", () => {
        assert.equal(semverGt("0.5.0", "0.5.0"), false);
    });

    it("handles major version differences", () => {
        assert.equal(semverGt("1.0.0", "0.9.9"), true);
    });

    it("handles patch version differences", () => {
        assert.equal(semverGt("0.5.1", "0.5.0"), true);
    });
});

describe("changelog - displayChangelog", () => {
    const { displayChangelog } = require("../src/changelog.cjs");

    it("shows What's new for versions in range", () => {
        const lines = [];
        const orig = console.log;
        console.log = (...a) => lines.push(a.join(" "));
        try {
            displayChangelog("0.4.0", "0.5.0");
        } finally {
            console.log = orig;
        }
        // CHANGELOG has a 0.5.0 entry, so upgrading from 0.4.0 should show "What's new:"
        const combined = lines.join("\n");
        assert.ok(
            combined.includes("What's new:"),
            "should print header when changelog has entries in range",
        );
    });
});
