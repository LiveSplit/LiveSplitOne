set -ex

doCompile() {
    npm install
    npm run build:core
    npm run publish

    WASM_FILE=$(ls dist/*.wasm)
    ~/binaryen/bin/wasm-opt -O4 "$WASM_FILE" -o "$WASM_FILE"
    wasm-gc "$WASM_FILE"
}

doCompile
