"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

/**
 * Run pending migrations from migrationsDir against donnaDir.
 * Skips migrations with numeric prefix <= lastMigration.
 * Stops on first failure.
 *
 * @param {string} migrationsDir - Directory containing numbered .cjs migration files
 * @param {string} donnaDir - The ~/.donna/ directory
 * @param {number} lastMigration - Last successfully applied migration number
 * @returns {Array<{num: number, description: string, ok: boolean, error?: Error}>}
 */
function runMigrations(migrationsDir, donnaDir, lastMigration) {
    if (!fs.existsSync(migrationsDir)) return [];

    const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".cjs"))
        .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));

    const pending = files.filter((f) => Number.parseInt(f, 10) > lastMigration);
    const results = [];

    for (const file of pending) {
        const migration = require(path.join(migrationsDir, file));
        const num = Number.parseInt(file, 10);

        try {
            migration.up({ donnaDir, fs, path, os });
            results.push({ num, description: migration.description, ok: true });
        } catch (err) {
            results.push({ num, description: migration.description, ok: false, error: err });
            break;
        }
    }

    return results;
}

module.exports = { runMigrations };
