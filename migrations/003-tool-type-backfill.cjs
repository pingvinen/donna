"use strict";

module.exports = {
    version: "0.7.0",
    description: "Backfill type: cli on existing tool sections in tools.md",
    up(ctx) {
        // tools.md lives in the user's storage repo, which is not accessible
        // from the migration context. We write a pending flag to state.md so that
        // workflows can detect and execute the backfill on next skill run.
        const statePath = ctx.path.join(ctx.donnaDir, "state.md");

        if (ctx.fs.existsSync(statePath)) {
            const content = ctx.fs.readFileSync(statePath, "utf8");
            if (content.includes("backfill-tool-type")) {
                // Already queued — idempotent, nothing to do
                return;
            }
        }

        const pendingFlag = "---\npending_migrations:\n  - backfill-tool-type\n---\n";
        ctx.fs.writeFileSync(statePath, pendingFlag, "utf8");
    },
};
