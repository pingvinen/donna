"use strict";

const fs = require("node:fs");
const path = require("node:path");

module.exports = {
    name: "Claude Code",

    detect(homeDir) {
        return fs.existsSync(path.join(homeDir, ".claude"));
    },

    stubSource: path.join(__dirname, "..", "..", "stubs", "claude-code"),

    getStubTarget(homeDir) {
        return path.join(homeDir, ".claude", "commands");
    },
};
