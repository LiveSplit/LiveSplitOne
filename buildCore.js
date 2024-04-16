import { execSync } from "child_process";
import fs from "fs";

let toolchain = "";
let targetFolder = "debug";
let cargoFlags = "";
let rustFlags = "-C target-feature=+bulk-memory,+mutable-globals,+nontrapping-fptoint,+sign-ext,+simd128,+extended-const";
let wasmBindgenFlags = "";

if (process.argv.some((v) => v === "--max-opt")) {
    // Do a fully optimized build ready for deployment.
    targetFolder = "max-opt";
    cargoFlags = "--profile max-opt";
} else if (process.argv.some((v) => v === "--release")) {
    // Do an optimized build.
    targetFolder = "release";
    cargoFlags = "--release";
} else {
    // Do a debug build.
    wasmBindgenFlags += " --keep-debug";
}

// Use WASM features that may not be supported by all the browsers.
if (process.argv.some((v) => v === "--unstable")) {
    // Relaxed SIMD is not supported by Firefox and Safari yet.
    // Tail calls are not supported by Safari and wasm-bindgen yet.
    rustFlags += ",+relaxed-simd"; //,+tail-call";
}

// Use the nightly toolchain, which enables some more optimizations.
if (process.argv.some((v) => v === "--nightly")) {
    toolchain = "+nightly";
    cargoFlags += " -Z build-std=std,panic_abort -Z build-std-features=panic_immediate_abort";
    // Multivalue is not supported by wasm-bindgen yet:
    // https://github.com/rustwasm/wasm-bindgen/issues/3552
    // rustFlags += ",+multivalue";

    // Virtual function elimination requires LTO, so we can only do it for
    // max-opt builds.
    if (targetFolder == "max-opt") {
        // Seems like cargo itself calls rustc to check for file name patterns,
        // but it forgets to pass the LTO flag that we specified in the
        // Cargo.toml, so the virtual-function-elimination complains that it's
        // only compatible with LTO, so we have to specify lto here too.
        rustFlags += " -Z virtual-function-elimination -C lto";
    }
}

execSync(
    `cargo ${toolchain} run`,
    {
        cwd: "livesplit-core/capi/bind_gen",
        stdio: "inherit",
    },
);

execSync(
    `cargo ${toolchain} rustc -p livesplit-core-capi --crate-type cdylib --features wasm-web --target wasm32-unknown-unknown ${cargoFlags}`,
    {
        cwd: "livesplit-core",
        stdio: "inherit",
        env: {
            ...process.env,
            'RUSTFLAGS': rustFlags,
        },
    },
);

execSync(
    `wasm-bindgen ${wasmBindgenFlags} livesplit-core/target/wasm32-unknown-unknown/${targetFolder}/livesplit_core.wasm --out-dir src/livesplit-core`,
    {
        stdio: "inherit",
    },
);

fs
    .createReadStream("livesplit-core/capi/bindings/wasm_bindgen/index.ts")
    .pipe(fs.createWriteStream("src/livesplit-core/index.ts"));
