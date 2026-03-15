"use strict";

module.exports = {
    version: "0.4.0",
    description: "Standing files moved to donna/ subfolder in storage repo",
    up(ctx) {
        // Nothing to do in ~/.donna/ for this migration.
        // Standing files live in the user's storage repo, which is not
        // accessible from the migration context. The actual file moves
        // happen at workflow runtime (set-role.md, begin-the-day.md)
        // via a one-time migration guard step.
    },
};
