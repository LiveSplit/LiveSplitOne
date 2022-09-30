import { execSync } from "child_process";
import fs from "fs";

let buildFlags = "";
let targetFolder = "debug";
if (process.argv.some((v) => v === "--production")) {
    buildFlags = "--release";
    targetFolder = "release";
}

execSync(
    "cargo run",
    {
        cwd: "livesplit-core/capi/bind_gen",
        stdio: "inherit",
    },
);

execSync(
    `cargo rustc -p livesplit-core-capi --crate-type cdylib --features wasm-web --target wasm32-unknown-unknown ${buildFlags}`,
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
    `wasm-bindgen livesplit-core/target/wasm32-unknown-unknown/${targetFolder}/livesplit_core.wasm --out-dir src/livesplit-core`,
    {
        stdio: "inherit",
    },
);

fs
    .createReadStream("livesplit-core/capi/bindings/wasm_bindgen/index.ts")
    .pipe(fs.createWriteStream("src/livesplit-core/index.ts"));
