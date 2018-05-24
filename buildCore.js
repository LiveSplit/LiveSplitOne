const { spawnSync } = require("child_process");
const fs = require("fs");

spawnSync(
    "cargo",
    ["run"],
    {
        cwd: "livesplit-core/capi/bind_gen",
        stdio: "inherit",
    },
);

fs
    .createReadStream("livesplit-core/capi/bindings/wasm/livesplit_core.ts")
    .pipe(fs.createWriteStream("src/livesplit.ts"));

spawnSync(
    "cargo",
    [
        "build",
        "-p", "cdylib",
        "--target", "wasm32-unknown-unknown",
        "--release",
    ],
    {
        cwd: "livesplit-core",
        stdio: "inherit",
    },
);

fs
    .createReadStream("livesplit-core/target/wasm32-unknown-unknown/release/livesplit_core.wasm")
    .pipe(fs.createWriteStream("src/livesplit_core.wasm"));
