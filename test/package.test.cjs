"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const pkg = require("../package.json");

describe("package.json", () => {
    it('has name "@pingvinen/donna-assistant"', () => {
        assert.equal(pkg.name, "@pingvinen/donna-assistant");
    });

    it('bin field maps "donna-assistant" to "./bin/donna-assistant"', () => {
        assert.equal(pkg.bin["donna-assistant"], "./bin/donna-assistant");
    });

    it("files field includes bin/, src/, stubs/, workflows/, migrations/, templates/, references/", () => {
        const required = [
            "bin/",
            "src/",
            "stubs/",
            "workflows/",
            "migrations/",
            "templates/",
            "references/",
        ];
        for (const entry of required) {
            assert.ok(pkg.files.includes(entry), `Missing files entry: ${entry}`);
        }
    });

    it("engines requires node >= 18", () => {
        assert.ok(pkg.engines.node, "engines.node should be defined");
        assert.ok(pkg.engines.node.includes("18"), "engines.node should reference 18");
    });

    it('publishConfig has access "public"', () => {
        assert.equal(pkg.publishConfig.access, "public");
    });
});
