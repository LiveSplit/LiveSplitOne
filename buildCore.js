const { execSync } = require("child_process");
const fs = require("fs");

execSync(
    "cargo run",
    {
        cwd: "livesplit-core/capi/bind_gen",
        stdio: "inherit",
    },
);

execSync(
    "cargo build -p cdylib --features wasm-web --target wasm32-unknown-unknown --release",
    {
        cwd: "livesplit-core",
        stdio: "inherit",
    },
);

execSync(
    "wasm-bindgen livesplit-core/target/wasm32-unknown-unknown/release/livesplit_core.wasm --out-dir src/livesplit-core",
    {
        stdio: "inherit",
    },
);

fs
    .createReadStream("livesplit-core/capi/bindings/wasm_bindgen/index.ts")
    .pipe(fs.createWriteStream("src/livesplit-core/index.ts"));
