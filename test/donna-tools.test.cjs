"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

/**
 * Helper: create a temp homeDir for testing donna-tools.
 * Returns { homeDir, donnaDir, configDir, storageRepo, cleanup }.
 */
function makeTempEnv({ withConfig = null, withVersionCheck = null, withSecrets = null } = {}) {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "donna-tools-test-"));
    const donnaDir = path.join(homeDir, ".donna");
    const configDir = path.join(homeDir, ".config", "donna");
    const storageRepo = path.join(homeDir, "storage");

    fs.mkdirSync(donnaDir, { recursive: true });
    fs.mkdirSync(configDir, { recursive: true });
    fs.mkdirSync(storageRepo, { recursive: true });

    if (withConfig) {
        const configContent = [
            "---",
            `storage_repo: ${withConfig.storage_repo || storageRepo}`,
            `daily_folder: ${withConfig.daily_folder || "daily"}`,
            `auto_push: ${withConfig.auto_push !== undefined ? withConfig.auto_push : "false"}`,
            "---",
            "",
            "# Donna Configuration",
        ].join("\n");
        fs.writeFileSync(path.join(configDir, "config.md"), configContent);
    }

    if (withVersionCheck) {
        const cacheContent = [
            "---",
            `checked_on: ${withVersionCheck.checked_on}`,
            `latest_version: ${withVersionCheck.latest_version}`,
            "---",
        ].join("\n");
        fs.writeFileSync(path.join(donnaDir, "version-check.md"), cacheContent);
    }

    if (withSecrets) {
        const donnaSubDir = path.join(storageRepo, "donna");
        fs.mkdirSync(donnaSubDir, { recursive: true });
        fs.writeFileSync(path.join(donnaSubDir, "secrets.md"), withSecrets);
    }

    return {
        homeDir,
        donnaDir,
        configDir,
        storageRepo,
        cleanup() {
            fs.rmSync(homeDir, { recursive: true, force: true });
        },
    };
}

// Load the module under test
const donnaTools = require("../src/donna-tools.cjs");
const { runInit, runCommit, runDailyPath, runResolveSecret } = donnaTools;

// ─────────────────────────────────────────────────────────────────────────────
// init subcommand
// ─────────────────────────────────────────────────────────────────────────────

describe("donna-tools init - no config", () => {
    let env;

    beforeEach(() => {
        env = makeTempEnv();
    });

    afterEach(() => {
        env.cleanup();
    });

    it("returns error not_configured when config.md does not exist", async () => {
        const result = await runInit([], { homeDir: env.homeDir });
        assert.equal(result.error, "not_configured");
        assert.equal(result.storage_repo, null);
    });
});

describe("donna-tools init - valid config", () => {
    let env;

    beforeEach(() => {
        env = makeTempEnv({ withConfig: {} });
    });

    afterEach(() => {
        env.cleanup();
    });

    it("returns storage_repo from config.md", async () => {
        const result = await runInit([], { homeDir: env.homeDir });
        assert.equal(result.error, null);
        assert.equal(typeof result.storage_repo, "string");
        assert.ok(result.storage_repo.length > 0);
    });

    it("returns daily_folder from config.md", async () => {
        const result = await runInit([], { homeDir: env.homeDir });
        assert.equal(result.daily_folder, "daily");
    });

    it("returns auto_push from config.md", async () => {
        const result = await runInit([], { homeDir: env.homeDir });
        assert.equal(result.auto_push, false);
    });

    it("returns migrations_applied array", async () => {
        const result = await runInit([], { homeDir: env.homeDir });
        assert.ok(Array.isArray(result.migrations_applied));
    });
});

describe("donna-tools init - version check cache hit", () => {
    let env;
    const today = new Date().toISOString().slice(0, 10);

    beforeEach(() => {
        env = makeTempEnv({
            withConfig: {},
            withVersionCheck: { checked_on: today, latest_version: "9.9.9" },
        });
    });

    afterEach(() => {
        env.cleanup();
    });

    it("returns update_available null when cache has today's date and version matches current", async () => {
        // Cache says 9.9.9 is latest. Since 9.9.9 > current package version, it should be returned.
        // But if the mock says update_available is null (cache hit, no network), it should stay null.
        // We just need to verify the cache IS used (no network call happens).
        // Inject a mock fetcher that throws to confirm it isn't called.
        const mockFetch = () => {
            throw new Error("should not call network on cache hit");
        };
        const result = await runInit([], { homeDir: env.homeDir, fetchLatestVersion: mockFetch });
        // 9.9.9 > current version, so update_available should be "9.9.9"
        assert.equal(result.update_available, "9.9.9");
    });
});

describe("donna-tools init - version check cache miss", () => {
    let env;

    beforeEach(() => {
        env = makeTempEnv({ withConfig: {} });
    });

    afterEach(() => {
        env.cleanup();
    });

    it("calls fetcher when no cache file exists", async () => {
        let fetchCalled = false;
        const mockFetch = async () => {
            fetchCalled = true;
            return null;
        };
        await runInit([], { homeDir: env.homeDir, fetchLatestVersion: mockFetch });
        assert.ok(fetchCalled, "fetcher should be called when no cache");
    });

    it("returns update_available null when network returns null", async () => {
        const mockFetch = async () => null;
        const result = await runInit([], { homeDir: env.homeDir, fetchLatestVersion: mockFetch });
        assert.equal(result.update_available, null);
    });

    it("returns update_available null when fetcher throws", async () => {
        const mockFetch = async () => {
            throw new Error("network error");
        };
        const result = await runInit([], { homeDir: env.homeDir, fetchLatestVersion: mockFetch });
        assert.equal(result.update_available, null);
    });

    it("writes version-check.md cache after fetching", async () => {
        const mockFetch = async () => "1.2.3";
        await runInit([], { homeDir: env.homeDir, fetchLatestVersion: mockFetch });
        const cachePath = path.join(env.donnaDir, "version-check.md");
        assert.ok(fs.existsSync(cachePath), "version-check.md should be written");
        const content = fs.readFileSync(cachePath, "utf8");
        assert.ok(content.includes("1.2.3"), "cache should contain fetched version");
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// commit subcommand
// ─────────────────────────────────────────────────────────────────────────────

describe("donna-tools commit", () => {
    let env;

    beforeEach(() => {
        env = makeTempEnv({ withConfig: {} });
        // Initialize a real git repo in storageRepo
        const { execSync } = require("node:child_process");
        execSync("git init", { cwd: env.storageRepo });
        execSync("git config user.email 'test@test.com'", { cwd: env.storageRepo });
        execSync("git config user.name 'Test'", { cwd: env.storageRepo });
        // Create initial commit so HEAD exists
        fs.writeFileSync(path.join(env.storageRepo, "README.md"), "# Test\n");
        execSync("git add README.md", { cwd: env.storageRepo });
        execSync("git commit -m 'initial'", { cwd: env.storageRepo });
    });

    afterEach(() => {
        env.cleanup();
    });

    it("returns committed false when nothing to commit", async () => {
        const result = await runCommit(["test message"], { homeDir: env.homeDir });
        assert.equal(result.committed, false);
        assert.equal(result.reason, "nothing_to_commit");
    });

    it("commits staged files and returns committed true", async () => {
        const testFile = path.join(env.storageRepo, "test.md");
        fs.writeFileSync(testFile, "# Test\n");
        const result = await runCommit(["test message", "--files", "test.md"], {
            homeDir: env.homeDir,
        });
        assert.equal(result.committed, true);
        assert.equal(result.message, "test message");
    });

    it("skips commit when porcelain is empty after staging files", async () => {
        // File exists and is tracked/unchanged — nothing to commit
        const result = await runCommit(["test message", "--files", "README.md"], {
            homeDir: env.homeDir,
        });
        assert.equal(result.committed, false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// daily-path subcommand
// ─────────────────────────────────────────────────────────────────────────────

describe("donna-tools daily-path", () => {
    let env;

    beforeEach(() => {
        env = makeTempEnv({ withConfig: {} });
    });

    afterEach(() => {
        env.cleanup();
    });

    it("returns path with today's date in YYYY-MM-DD format", async () => {
        const result = await runDailyPath([], { homeDir: env.homeDir });
        const today = new Date().toISOString().slice(0, 10);
        assert.ok(
            result.path.includes(today),
            `path should contain today's date ${today}, got: ${result.path}`,
        );
    });

    it("returns path ending in .md", async () => {
        const result = await runDailyPath([], { homeDir: env.homeDir });
        assert.ok(result.path.endsWith(".md"), `path should end with .md, got: ${result.path}`);
    });

    it("creates the daily directory if missing", async () => {
        const result = await runDailyPath([], { homeDir: env.homeDir });
        const dir = path.dirname(result.path);
        assert.ok(fs.existsSync(dir), `directory ${dir} should exist`);
    });

    it("returns path with storage_repo and daily_folder", async () => {
        const result = await runDailyPath([], { homeDir: env.homeDir });
        assert.ok(result.path.includes(env.storageRepo), "path should be under storage_repo");
        assert.ok(result.path.includes("daily"), "path should include daily_folder");
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolve-secret subcommand
// ─────────────────────────────────────────────────────────────────────────────

describe("donna-tools resolve-secret", () => {
    let env;

    beforeEach(() => {
        env = makeTempEnv({
            withConfig: {},
            withSecrets: [
                "# Secrets",
                "",
                "- MY_TOKEN: actual-secret-value",
                "- PLACEHOLDER_KEY: your-token-here",
                "- ANOTHER: TODO",
                "- EMPTY_KEY: PLACEHOLDER",
            ].join("\n"),
        });
    });

    afterEach(() => {
        env.cleanup();
    });

    it("returns the value for a known key", async () => {
        const result = await runResolveSecret(["MY_TOKEN"], { homeDir: env.homeDir });
        assert.equal(result.key, "MY_TOKEN");
        assert.equal(result.value, "actual-secret-value");
        assert.equal(result.error, undefined);
    });

    it("returns error key_not_found for unknown key", async () => {
        const result = await runResolveSecret(["UNKNOWN_KEY"], { homeDir: env.homeDir });
        assert.equal(result.error, "key_not_found");
        assert.equal(result.key, "UNKNOWN_KEY");
    });

    it("returns error placeholder_value for placeholder like your-token-here", async () => {
        const result = await runResolveSecret(["PLACEHOLDER_KEY"], { homeDir: env.homeDir });
        assert.equal(result.error, "placeholder_value");
        assert.equal(result.key, "PLACEHOLDER_KEY");
    });

    it("returns error placeholder_value for TODO value", async () => {
        const result = await runResolveSecret(["ANOTHER"], { homeDir: env.homeDir });
        assert.equal(result.error, "placeholder_value");
    });

    it("returns error placeholder_value for PLACEHOLDER value", async () => {
        const result = await runResolveSecret(["EMPTY_KEY"], { homeDir: env.homeDir });
        assert.equal(result.error, "placeholder_value");
    });

    it("returns error when secrets.md does not exist", async () => {
        // Remove secrets.md
        const secretsPath = path.join(env.storageRepo, "donna", "secrets.md");
        fs.rmSync(secretsPath);
        const result = await runResolveSecret(["MY_TOKEN"], { homeDir: env.homeDir });
        assert.ok(result.error, "should return error when secrets.md missing");
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLI entry point sanity check
// ─────────────────────────────────────────────────────────────────────────────

describe("donna-tools CLI", () => {
    it("exports main function", () => {
        const { main } = require("../src/donna-tools.cjs");
        assert.equal(typeof main, "function");
    });

    it("exports all subcommand handlers", () => {
        const mod = require("../src/donna-tools.cjs");
        assert.equal(typeof mod.runInit, "function");
        assert.equal(typeof mod.runCommit, "function");
        assert.equal(typeof mod.runDailyPath, "function");
        assert.equal(typeof mod.runResolveSecret, "function");
    });
});
