#!/usr/bin/env node
"use strict";

const { run } = require("../src/installer.cjs");

run().catch((err) => {
    console.error(`\nInstallation failed: ${err.message}`);
    process.exit(1);
});
