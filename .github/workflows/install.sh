set -ex

main() {
    cd $HOME
    git -C binaryen pull || git clone https://github.com/WebAssembly/binaryen binaryen
    cd binaryen
    cmake .
    make wasm-opt

    cargo install wasm-gc
    cargo install wasm-bindgen-cli
}

main
