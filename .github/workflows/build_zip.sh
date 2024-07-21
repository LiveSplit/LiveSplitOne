set -ex

main() {
    local src=$(pwd) \
          stage=

    if [[ $OS_NAME =~ ^macos\-.*$ ]]; then
        stage=$(mktemp -d -t tmp)
    else
        stage=$(mktemp -d)
    fi

    cp "src-tauri/target/release/LiveSplit One.exe" "$stage/LiveSplit One.exe" 2>/dev/null || :
    cp "src-tauri/target/release/LiveSplit One" "$stage/LiveSplit One" 2>/dev/null || :
    cp "src-tauri/target/release/live-split-one" "$stage/livesplit-one" 2>/dev/null || :

    cd $stage
    if [ "$OS_NAME" = "windows-latest" ]; then
        7z a $src/LiveSplitOne-$TARGET.zip *
    else
        tar czf $src/LiveSplitOne-$TARGET.tar.gz *
    fi
    cd $src

    rm -rf $stage
}

main
