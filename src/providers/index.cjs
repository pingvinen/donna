"use strict";

const claudeCode = require("./claude-code.cjs");

const PROVIDERS = [claudeCode];

/**
 * Detect which AI coding assistant providers are installed.
 *
 * @param {string} homeDir - The user's home directory
 * @returns {Array<{name: string, stubSource: string, stubTarget: string}>}
 */
function detectProviders(homeDir) {
    return PROVIDERS.filter((p) => p.detect(homeDir)).map((p) => ({
        name: p.name,
        stubSource: p.stubSource,
        stubTarget: p.getStubTarget(homeDir),
    }));
}

module.exports = { detectProviders };
