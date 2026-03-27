"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const https = require("node:https");
const { execSync } = require("node:child_process");

const { readVersion } = require("./version.cjs");
const { runMigrations } = require("./migrator.cjs");
const { semverGt } = require("./changelog.cjs");

// ─────────────────────────────────────────────────────────────────────────────
// Config reader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read and parse ~/.config/donna/config.md YAML frontmatter.
 *
 * @param {string} homeDir - Home directory override (for testing)
 * @returns {{ storage_repo: string|null, daily_folder: string, auto_push: boolean }|null}
 */
function readConfig(homeDir) {
    const configPath = path.join(homeDir, ".config", "donna", "config.md");
    if (!fs.existsSync(configPath)) return null;

    const content = fs.readFileSync(configPath, "utf8");

    const storage_repo = content.match(/^storage_repo:\s*(.+)$/m)?.[1]?.trim() || null;
    const daily_folder = content.match(/^daily_folder:\s*(.+)$/m)?.[1]?.trim() || "daily";
    const auto_push_str = content.match(/^auto_push:\s*(.+)$/m)?.[1]?.trim() || "false";
    const auto_push = auto_push_str === "true";

    return { storage_repo, daily_folder, auto_push };
}

// ─────────────────────────────────────────────────────────────────────────────
// Version check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the latest version from npm registry.
 * Returns the latest version string or null on any failure.
 *
 * @param {number} [timeout=3000] - Socket timeout in ms
 * @returns {Promise<string|null>}
 */
function fetchLatestVersionFromRegistry(timeout = 3000) {
    return new Promise((resolve) => {
        const req = https.get(
            "https://registry.npmjs.org/@pingvinen%2Fdonna-assistant",
            { headers: { Accept: "application/json" } },
            (res) => {
                if (res.statusCode !== 200) {
                    resolve(null);
                    return;
                }
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    try {
                        const latest = JSON.parse(data)["dist-tags"]?.latest || null;
                        resolve(latest);
                    } catch {
                        resolve(null);
                    }
                });
            },
        );
        req.setTimeout(timeout, () => {
            req.destroy();
            resolve(null);
        });
        req.on("error", () => resolve(null));
    });
}

/**
 * Read version-check.md cache from donnaDir.
 * Returns { date, latest } or null if file doesn't exist or can't be parsed.
 *
 * @param {string} donnaDir
 * @returns {{ date: string, latest: string }|null}
 */
function readVersionCache(donnaDir) {
    const cachePath = path.join(donnaDir, "version-check.md");
    if (!fs.existsSync(cachePath)) return null;

    const content = fs.readFileSync(cachePath, "utf8");
    const date = content.match(/^checked_on:\s*(.+)$/m)?.[1]?.trim();
    const latest = content.match(/^latest_version:\s*(.+)$/m)?.[1]?.trim();
    if (!date || !latest) return null;
    return { date, latest };
}

/**
 * Write version-check.md cache to donnaDir.
 *
 * @param {string} donnaDir
 * @param {string} date - YYYY-MM-DD
 * @param {string} latestVersion
 */
function writeVersionCache(donnaDir, date, latestVersion) {
    const cachePath = path.join(donnaDir, "version-check.md");
    fs.writeFileSync(
        cachePath,
        `---\nchecked_on: ${date}\nlatest_version: ${latestVersion}\n---\n`,
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Obsidian daily-notes sync
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sync Obsidian daily-notes.json with the configured daily_folder.
 * Mutates the configMd file if the folder differs.
 *
 * @param {string} storageRepo
 * @param {string} configPath
 * @param {string} dailyFolder
 * @returns {string} - Possibly updated daily_folder
 */
function syncObsidianDailyNotes(storageRepo, configPath, dailyFolder) {
    const obsidianDir = path.join(storageRepo, ".obsidian");
    const dailyNotesJson = path.join(obsidianDir, "daily-notes.json");

    if (fs.existsSync(dailyNotesJson)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(dailyNotesJson, "utf8"));
            if (parsed.folder && parsed.folder !== dailyFolder) {
                // Sync config to Obsidian's value
                const configContent = fs.readFileSync(configPath, "utf8");
                const updated = configContent.replace(
                    /^daily_folder:\s*.+$/m,
                    `daily_folder: ${parsed.folder}`,
                );
                fs.writeFileSync(configPath, updated);
                return parsed.folder;
            }
        } catch {
            // Parse error — ignore
        }
    } else if (fs.existsSync(obsidianDir)) {
        // .obsidian/ exists but no daily-notes.json — write it
        try {
            fs.writeFileSync(dailyNotesJson, JSON.stringify({ folder: dailyFolder }, null, 2));
        } catch {
            // Ignore errors writing Obsidian config
        }
    }

    return dailyFolder;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcommand handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the `init` subcommand.
 *
 * Reads config, runs migrations, syncs Obsidian, checks for updates.
 *
 * @param {string[]} _args
 * @param {object} [options]
 * @param {string} [options.homeDir] - Override home directory (for testing)
 * @param {Function} [options.fetchLatestVersion] - Override for network call (for testing)
 * @returns {Promise<object>}
 */
async function runInit(_args, options = {}) {
    const homeDir = options.homeDir || os.homedir();
    const donnaDir = path.join(homeDir, ".donna");
    const migrationsDir = path.join(__dirname, "..", "migrations");
    const fetchLatestVersion = options.fetchLatestVersion || fetchLatestVersionFromRegistry;

    // Read config
    const config = readConfig(homeDir);
    if (!config || !config.storage_repo) {
        return { error: "not_configured", storage_repo: null };
    }

    let { storage_repo, daily_folder, auto_push } = config;

    // Sync Obsidian daily-notes
    const configPath = path.join(homeDir, ".config", "donna", "config.md");
    daily_folder = syncObsidianDailyNotes(storage_repo, configPath, daily_folder);

    // Run migrations
    const versionInfo = readVersion(donnaDir);
    const lastMigration = versionInfo?.lastMigration || 0;
    const migrationResults = runMigrations(migrationsDir, donnaDir, lastMigration);
    const migrations_applied = migrationResults.filter((r) => r.ok).map((r) => r.description);

    // Version check (once per day, non-blocking)
    let update_available = null;
    try {
        const today = new Date().toISOString().slice(0, 10);
        const cache = readVersionCache(donnaDir);

        let latestVersion;
        if (cache && cache.date === today) {
            // Cache hit — use cached value
            latestVersion = cache.latest;
        } else {
            // Cache miss — fetch from registry
            latestVersion = await fetchLatestVersion();
            if (latestVersion) {
                writeVersionCache(donnaDir, today, latestVersion);
            }
        }

        if (latestVersion) {
            const pkg = require("../package.json");
            const currentVersion = versionInfo?.version || pkg.version;
            if (semverGt(latestVersion, currentVersion)) {
                update_available = latestVersion;
            }
        }
    } catch {
        // Never throw from version check — treat as no update available
        update_available = null;
    }

    return {
        storage_repo,
        daily_folder,
        auto_push,
        update_available,
        migrations_applied,
        error: null,
    };
}

/**
 * Run the `commit` subcommand.
 *
 * Args: commit <msg> --files f1 f2 ...
 *
 * @param {string[]} args
 * @param {object} [options]
 * @param {string} [options.homeDir] - Override home directory (for testing)
 * @returns {Promise<object>}
 */
async function runCommit(args, options = {}) {
    const homeDir = options.homeDir || os.homedir();
    const config = readConfig(homeDir);
    if (!config || !config.storage_repo) {
        return { error: "not_configured" };
    }

    const { storage_repo, auto_push } = config;

    // Parse message and files
    const filesIdx = args.indexOf("--files");
    const message = args[0] || "";
    const files = filesIdx !== -1 ? args.slice(filesIdx + 1) : [];

    try {
        // Stage files
        if (files.length > 0) {
            for (const file of files) {
                execSync(`git -C ${JSON.stringify(storage_repo)} add ${JSON.stringify(file)}`, {
                    stdio: "pipe",
                });
            }
        } else {
            execSync(`git -C ${JSON.stringify(storage_repo)} add -A`, { stdio: "pipe" });
        }

        // Check if there's anything to commit
        const status = execSync(`git -C ${JSON.stringify(storage_repo)} status --porcelain`, {
            stdio: "pipe",
            encoding: "utf8",
        });

        if (!status || status.trim() === "") {
            return { committed: false, reason: "nothing_to_commit" };
        }

        // Commit
        execSync(`git -C ${JSON.stringify(storage_repo)} commit -m ${JSON.stringify(message)}`, {
            stdio: "pipe",
        });

        // Push if auto_push
        if (auto_push) {
            execSync(`git -C ${JSON.stringify(storage_repo)} push`, { stdio: "pipe" });
        }

        return { committed: true, message };
    } catch (err) {
        return { error: err.message, committed: false };
    }
}

/**
 * Run the `daily-path` subcommand.
 *
 * @param {string[]} _args
 * @param {object} [options]
 * @param {string} [options.homeDir] - Override home directory (for testing)
 * @returns {Promise<object>}
 */
async function runDailyPath(_args, options = {}) {
    const homeDir = options.homeDir || os.homedir();
    const config = readConfig(homeDir);
    if (!config || !config.storage_repo) {
        return { error: "not_configured" };
    }

    const { storage_repo, daily_folder } = config;
    const today = new Date().toISOString().slice(0, 10);
    const dailyDir = path.join(storage_repo, daily_folder);
    const filePath = path.join(dailyDir, `${today}.md`);

    // Create directory if it doesn't exist
    fs.mkdirSync(dailyDir, { recursive: true });

    return { path: filePath };
}

/**
 * Run the `resolve-secret` subcommand.
 *
 * Args: resolve-secret <key>
 *
 * @param {string[]} args
 * @param {object} [options]
 * @param {string} [options.homeDir] - Override home directory (for testing)
 * @returns {Promise<object>}
 */
async function runResolveSecret(args, options = {}) {
    const homeDir = options.homeDir || os.homedir();
    const config = readConfig(homeDir);
    if (!config || !config.storage_repo) {
        return { error: "not_configured" };
    }

    const { storage_repo } = config;
    const key = args[0];

    if (!key) {
        return { error: "missing_key" };
    }

    const secretsPath = path.join(storage_repo, "donna", "secrets.md");
    if (!fs.existsSync(secretsPath)) {
        return { error: "secrets_not_found", key };
    }

    const content = fs.readFileSync(secretsPath, "utf8");

    // Parse "- KEY: value" pattern (allowing optional spaces)
    const pattern = new RegExp(`^-\\s+${key}:\\s*(.+)$`, "m");
    const match = content.match(pattern);

    if (!match) {
        return { error: "key_not_found", key };
    }

    const value = match[1].trim();

    // Check for placeholder patterns
    if (
        /^your-.+-here$/i.test(value) ||
        value === "TODO" ||
        value === "PLACEHOLDER" ||
        value === "xxx" ||
        /^<.+>$/.test(value)
    ) {
        return { error: "placeholder_value", key, value };
    }

    return { key, value };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main CLI entry point. Routes subcommands and prints JSON to stdout.
 */
async function main() {
    const args = process.argv.slice(2);
    const cmd = args[0];

    if (cmd === "init") {
        const result = await runInit(args.slice(1));
        console.log(JSON.stringify(result));
        return;
    }

    if (cmd === "commit") {
        const result = await runCommit(args.slice(1));
        console.log(JSON.stringify(result));
        return;
    }

    if (cmd === "daily-path") {
        const result = await runDailyPath(args.slice(1));
        console.log(JSON.stringify(result));
        return;
    }

    if (cmd === "resolve-secret") {
        const result = await runResolveSecret(args.slice(1));
        console.log(JSON.stringify(result));
        return;
    }

    process.stderr.write(`Unknown command: ${cmd}\n`);
    process.exit(1);
}

main.catch = undefined; // prevent accidental chaining — the module handles it below

module.exports = { main, runInit, runCommit, runDailyPath, runResolveSecret };

// Only run main when invoked directly (not when require()'d in tests)
if (require.main === module) {
    main().catch((err) => {
        process.stderr.write(`${err.message}\n`);
        process.exit(1);
    });
}
