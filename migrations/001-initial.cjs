"use strict";

module.exports = {
    version: "0.1.0",
    description: "Initial directory structure",
    up(ctx) {
        const dirs = ["workflows", "templates", "references"];
        for (const dir of dirs) {
            ctx.fs.mkdirSync(ctx.path.join(ctx.donnaDir, dir), { recursive: true });
        }
    },
};
