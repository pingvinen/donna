"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const output = require("./output.cjs");
const version = require("./version.cjs");
const migrator = require("./migrator.cjs");
const providers = require("./providers/index.cjs");
const changelog = require("./changelog.cjs");

/**
 * Main installer orchestration.
 *
 * @param {object} [options]
 * @param {string} [options.homeDir] - Override home directory (for testing)
 * @param {boolean} [options.force] - Force re-install even if version matches
 * @returns {Promise<void>}
 */
async function run(options = {}) {
    const homeDir = options.homeDir || os.homedir();
    const force = options.force || false;
    const donnaDir = path.join(homeDir, ".donna");
    const migrationsDir = path.join(__dirname, "..", "migrations");
    const workflowsSource = path.join(__dirname, "..", "workflows");
    const pkg = require("../package.json");
    const packageVersion = pkg.version;

    // Print banner
    output.banner();

    // Create donnaDir if it doesn't exist
    fs.mkdirSync(donnaDir, { recursive: true });

    // Read current version
    const current = version.readVersion(donnaDir);
    const currentVersion = current?.version || null;
    const lastMigration = current?.lastMigration || 0;

    // Check if already up to date
    if (currentVersion === packageVersion && !force) {
        // Check for pending migrations too
        const pendingResults = migrator.runMigrations(migrationsDir, donnaDir, lastMigration);
        if (pendingResults.length === 0) {
            output.info(`Already up to date at ${packageVersion}`);
            return;
        }
    }

    // If upgrading (current version exists but differs)
    if (currentVersion && currentVersion !== packageVersion) {
        output.upgradeHeader(currentVersion, packageVersion);
        changelog.displayChangelog(currentVersion, packageVersion);
    }

    // Run migrations
    const results = migrator.runMigrations(migrationsDir, donnaDir, lastMigration);

    // Track last successful migration number
    let lastSuccessful = lastMigration;

    for (const result of results) {
        if (result.ok) {
            output.migrationLine(result.description);
            lastSuccessful = result.num;
        } else {
            output.fail(`Migration ${result.num} failed: ${result.error.message}`);
            // Write version.md with last successful migration
            version.writeVersion(donnaDir, packageVersion, lastSuccessful);
            throw result.error;
        }
    }

    // Detect providers and copy stubs
    const detected = providers.detectProviders(homeDir);

    if (detected.length > 0) {
        for (const provider of detected) {
            fs.cpSync(provider.stubSource, provider.stubTarget, { recursive: true });
            output.success(
                `Copied donna skills (setup, add-task, done, set-role, begin-the-day, add-tool, relearn-tools, run-tools, help, contribute-idea, adjust-tool, focus) to ${provider.stubTarget}`,
            );
        }
    } else {
        output.info("No supported AI providers detected");
        output.info("Install Claude Code and re-run to add donna skills");
    }

    // Copy workflows to donnaDir/workflows/
    const workflowsTarget = path.join(donnaDir, "workflows");
    fs.mkdirSync(workflowsTarget, { recursive: true });
    fs.cpSync(workflowsSource, workflowsTarget, { recursive: true });
    output.success("Installed workflows to ~/.donna/workflows/");

    // Write version.md
    version.writeVersion(donnaDir, packageVersion, lastSuccessful);
    output.success(`Version ${packageVersion} installed`);

    // Final message — suppress setup prompt if already configured (D-04)
    const configPath = path.join(homeDir, ".config", "donna", "config.md");
    const isConfigured =
        fs.existsSync(configPath) && fs.readFileSync(configPath, "utf8").includes("storage_repo:");

    if (!isConfigured) {
        console.log("");
        output.info("Run /donna:setup in Claude Code to get started.");
    }
}

module.exports = { run };
