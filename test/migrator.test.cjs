"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const { runMigrations } = require("../src/migrator.cjs");
const { detectProviders } = require("../src/providers/index.cjs");

describe("migrator", () => {
    let tmpDir;
    let migrationsDir;
    let donnaDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "donna-migrator-"));
        migrationsDir = path.join(tmpDir, "migrations");
        donnaDir = path.join(tmpDir, "donna");
        fs.mkdirSync(migrationsDir);
        fs.mkdirSync(donnaDir);
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("returns empty array when no migrations pending", () => {
        const results = runMigrations(migrationsDir, donnaDir, 999);
        assert.deepEqual(results, []);
    });

    it("runs migrations in numeric order (001 before 002 before 010)", () => {
        // Create migrations in reverse order to test sorting
        fs.writeFileSync(
            path.join(migrationsDir, "010-third.cjs"),
            "module.exports = { version: '0.3.0', description: 'Third', up(ctx) { ctx.fs.writeFileSync(ctx.path.join(ctx.donnaDir, 'third'), '3'); } };",
        );
        fs.writeFileSync(
            path.join(migrationsDir, "001-first.cjs"),
            "module.exports = { version: '0.1.0', description: 'First', up(ctx) { ctx.fs.writeFileSync(ctx.path.join(ctx.donnaDir, 'first'), '1'); } };",
        );
        fs.writeFileSync(
            path.join(migrationsDir, "002-second.cjs"),
            "module.exports = { version: '0.2.0', description: 'Second', up(ctx) { ctx.fs.writeFileSync(ctx.path.join(ctx.donnaDir, 'second'), '2'); } };",
        );

        const results = runMigrations(migrationsDir, donnaDir, 0);
        assert.equal(results.length, 3);
        assert.equal(results[0].num, 1);
        assert.equal(results[1].num, 2);
        assert.equal(results[2].num, 10);
    });

    it("skips migrations at or below lastMigration number", () => {
        fs.writeFileSync(
            path.join(migrationsDir, "001-first.cjs"),
            "module.exports = { version: '0.1.0', description: 'First', up(ctx) {} };",
        );
        fs.writeFileSync(
            path.join(migrationsDir, "002-second.cjs"),
            "module.exports = { version: '0.2.0', description: 'Second', up(ctx) {} };",
        );
        fs.writeFileSync(
            path.join(migrationsDir, "003-third.cjs"),
            "module.exports = { version: '0.3.0', description: 'Third', up(ctx) {} };",
        );

        const results = runMigrations(migrationsDir, donnaDir, 2);
        assert.equal(results.length, 1);
        assert.equal(results[0].num, 3);
        assert.equal(results[0].description, "Third");
    });

    it("stops on first failure and returns partial results with error", () => {
        fs.writeFileSync(
            path.join(migrationsDir, "001-ok.cjs"),
            "module.exports = { version: '0.1.0', description: 'OK', up(ctx) {} };",
        );
        fs.writeFileSync(
            path.join(migrationsDir, "002-fail.cjs"),
            "module.exports = { version: '0.2.0', description: 'Fails', up(ctx) { throw new Error('boom'); } };",
        );
        fs.writeFileSync(
            path.join(migrationsDir, "003-never.cjs"),
            "module.exports = { version: '0.3.0', description: 'Never runs', up(ctx) {} };",
        );

        const results = runMigrations(migrationsDir, donnaDir, 0);
        assert.equal(results.length, 2);
        assert.equal(results[0].ok, true);
        assert.equal(results[1].ok, false);
        assert.ok(results[1].error instanceof Error);
        assert.equal(results[1].error.message, "boom");
    });

    it("each result has num, description, ok, and optionally error", () => {
        fs.writeFileSync(
            path.join(migrationsDir, "001-test.cjs"),
            "module.exports = { version: '0.1.0', description: 'Test migration', up(ctx) {} };",
        );

        const results = runMigrations(migrationsDir, donnaDir, 0);
        assert.equal(results.length, 1);
        assert.equal(results[0].num, 1);
        assert.equal(results[0].description, "Test migration");
        assert.equal(results[0].ok, true);
        assert.equal(results[0].error, undefined);
    });

    it("migration up() receives ctx with donnaDir, fs, path, os", () => {
        fs.writeFileSync(
            path.join(migrationsDir, "001-ctx.cjs"),
            `module.exports = {
        version: '0.1.0',
        description: 'Context check',
        up(ctx) {
          if (typeof ctx.donnaDir !== 'string') throw new Error('missing donnaDir');
          if (typeof ctx.fs.writeFileSync !== 'function') throw new Error('missing fs');
          if (typeof ctx.path.join !== 'function') throw new Error('missing path');
          if (typeof ctx.os.homedir !== 'function') throw new Error('missing os');
        }
      };`,
        );

        const results = runMigrations(migrationsDir, donnaDir, 0);
        assert.equal(results[0].ok, true);
    });
});

describe("provider detection", () => {
    let tmpHome;

    beforeEach(() => {
        tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "donna-provider-"));
    });

    afterEach(() => {
        fs.rmSync(tmpHome, { recursive: true, force: true });
    });

    it("detectProviders returns Claude Code when ~/.claude/ dir exists", () => {
        fs.mkdirSync(path.join(tmpHome, ".claude"));
        const providers = detectProviders(tmpHome);
        assert.equal(providers.length, 1);
        assert.equal(providers[0].name, "Claude Code");
    });

    it("detectProviders returns empty array when no provider dirs exist", () => {
        const providers = detectProviders(tmpHome);
        assert.deepEqual(providers, []);
    });

    it("each detected provider has name, stubSource, stubTarget", () => {
        fs.mkdirSync(path.join(tmpHome, ".claude"));
        const providers = detectProviders(tmpHome);
        const provider = providers[0];
        assert.ok(typeof provider.name === "string");
        assert.ok(typeof provider.stubSource === "string");
        assert.ok(typeof provider.stubTarget === "string");
    });
});
