"use strict";

const fs = require("node:fs");
const path = require("node:path");

function readVersion(donnaDir) {
    const versionPath = path.join(donnaDir, "version.md");
    if (!fs.existsSync(versionPath)) return null;

    const content = fs.readFileSync(versionPath, "utf8");
    const version = content.match(/\*\*Version:\*\* (.+)/)?.[1] || "0.0.0";
    const lastMigration = Number.parseInt(
        content.match(/\*\*Last migration:\*\* (\d+)/)?.[1] || "0",
        10,
    );
    const installed = content.match(/\*\*Installed:\*\* (.+)/)?.[1] || null;
    const updated = content.match(/\*\*Updated:\*\* (.+)/)?.[1] || null;

    return { version, lastMigration, installed, updated };
}

function writeVersion(donnaDir, version, lastMigration) {
    const versionPath = path.join(donnaDir, "version.md");
    const now = new Date().toISOString();

    let installed = now;

    // Preserve the original "Installed" timestamp if file already exists
    if (fs.existsSync(versionPath)) {
        const existing = readVersion(donnaDir);
        if (existing?.installed) {
            installed = existing.installed;
        }
    }

    const content = [
        "# Donna",
        "",
        `- **Version:** ${version}`,
        `- **Last migration:** ${String(lastMigration).padStart(3, "0")}`,
        `- **Installed:** ${installed}`,
        `- **Updated:** ${now}`,
        "",
    ].join("\n");

    fs.writeFileSync(versionPath, content);
}

module.exports = { readVersion, writeVersion };
