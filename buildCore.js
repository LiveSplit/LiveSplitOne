import { execSync } from "child_process";
import fs from "fs";

let toolchain = "";
let profile = "debug";
let cargoFlags = "";
let rustFlags =
    "-C target-feature=+bulk-memory,+mutable-globals,+nontrapping-fptoint,+sign-ext,+simd128,+extended-const,+multivalue";
let wasmBindgenFlags = "";
let target = "wasm32-unknown-unknown";
let targetFolder = target;

if (process.argv.some((v) => v === "--max-opt")) {
    // Do a fully optimized build ready for deployment.
    profile = "max-opt";
    cargoFlags = "--profile max-opt";
} else if (process.argv.some((v) => v === "--release")) {
    // Do an optimized build.
    profile = "release";
    cargoFlags = "--release";
} else {
    // Do a debug build.
    wasmBindgenFlags += " --keep-debug";
}

// Use WASM features that may not be supported by all the browsers.
if (process.argv.some((v) => v === "--unstable")) {
    // Relaxed SIMD is not supported by Firefox and Safari yet.
    rustFlags += ",+relaxed-simd";

    // Tail calls are not supported by Safari yet.
    rustFlags += ",+tail-call";

    // Reference types are broken in webpack (or rather its underlying webassemblyjs):
    // https://github.com/LiveSplit/LiveSplitOne/issues/630
    // wasmBindgenFlags += " --reference-types";
}

// Use the nightly toolchain, which enables some more optimizations.
if (process.argv.some((v) => v === "--nightly")) {
    toolchain = "+nightly";
    cargoFlags +=
        " -Z build-std=std,panic_abort -Z build-std-features=panic_immediate_abort";
    rustFlags += " -Z wasm-c-abi=spec";
    target = "../wasm32-multivalue.json";
    targetFolder = "wasm32-multivalue";

    // Virtual function elimination requires LTO, so we can only do it for
    // max-opt builds.
    if (profile == "max-opt") {
        // Seems like cargo itself calls rustc to check for file name patterns,
        // but it forgets to pass the LTO flag that we specified in the
        // Cargo.toml, so the virtual-function-elimination complains that it's
        // only compatible with LTO, so we have to specify lto here too.
        // FIXME: Seems to be broken at the moment.
        // rustFlags += " -Z virtual-function-elimination -C lto";
    }
}

execSync(`cargo ${toolchain} run`, {
    cwd: "livesplit-core/capi/bind_gen",
    stdio: "inherit",
});

execSync(
    `cargo ${toolchain} rustc -p livesplit-core-capi --crate-type cdylib --features wasm-web,web-rendering --target ${target} ${cargoFlags}`,
    {
        cwd: "livesplit-core",
        stdio: "inherit",
        env: {
            ...process.env,
            RUSTFLAGS: rustFlags,
        },
    }
);

execSync(
    `wasm-bindgen ${wasmBindgenFlags} livesplit-core/target/${targetFolder}/${profile}/livesplit_core.wasm --out-dir src/livesplit-core`,
    {
        stdio: "inherit",
    }
);

fs.createReadStream("livesplit-core/capi/bindings/wasm_bindgen/index.ts").pipe(
    fs.createWriteStream("src/livesplit-core/index.ts")
);
