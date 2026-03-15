"use strict";

module.exports = {
    version: "0.4.0",
    description: "Queue standing file move to donna/ subfolder (runs on next skill use)",
    up(ctx) {
        // Standing files live in the user's storage repo, which is not accessible
        // from the migration context. We write a pending flag to state.md so that
        // workflows can detect and execute the move on next skill run.
        const statePath = ctx.path.join(ctx.donnaDir, "state.md");

        if (ctx.fs.existsSync(statePath)) {
            const content = ctx.fs.readFileSync(statePath, "utf8");
            if (content.includes("move-standing-files")) {
                // Already queued — idempotent, nothing to do
                return;
            }
        }

        const pendingFlag = `---\npending_migrations:\n  - move-standing-files\n---\n`;
        ctx.fs.writeFileSync(statePath, pendingFlag, "utf8");
    },
};
