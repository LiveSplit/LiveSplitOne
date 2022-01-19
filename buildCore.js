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
    "cargo build -p cdylib --features \"wasm-web software-rendering\" --target wasm32-unknown-unknown --release",
    {
        cwd: "livesplit-core",
        stdio: "inherit",
        env: {
            ...process.env,
            'RUSTFLAGS': '-C target-feature=+bulk-memory,+mutable-globals,+nontrapping-fptoint,+sign-ext',
        },
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
