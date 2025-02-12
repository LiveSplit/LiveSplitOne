# <img src="https://raw.githubusercontent.com/LiveSplit/LiveSplitOne/master/src/assets/icon.svg" alt="LiveSplit" height="42" align="top"/> LiveSplit One

[![Build Status](https://github.com/LiveSplit/LiveSplitOne/workflows/CI/badge.svg)](https://github.com/LiveSplit/LiveSplitOne/actions)

LiveSplit One is a version of LiveSplit that uses the multiplatform
[livesplit-core](https://github.com/LiveSplit/livesplit-core) library and web
technologies like React to create a new LiveSplit experience that
works on a lot of different platforms.

The web version of LiveSplit One is available [here](https://one.livesplit.org/).

The latest desktop version of LiveSplit One, with support for global hotkeys, can be downloaded [here](https://github.com/LiveSplit/LiveSplitOne/releases/latest).

> [!NOTE]
> This is not yet optimized for desktop usage. It's mostly the same as the web version and there is no update mechanism.

## Build Instructions

In order to build LiveSplit One, you need to install
[npm](https://nodejs.org/en/download/) and the [Rust
compiler](https://www.rust-lang.org/). Make sure to recursively clone the
repository so that all git submodules are cloned as well:

```bash
git clone --recursive
```

Once you have cloned the repository and set up both npm and the Rust compiler, you need to install the WebAssembly target:

```bash
rustup target add wasm32-unknown-unknown
```

You also need to build wasm-bindgen:

```bash
cargo install wasm-bindgen-cli
```

You need to set up some npm modules before compiling the project:

```bash
npm install -f
```

You are now ready to build livesplit-core, which powers LiveSplit One:

```bash
npm run build:core
```

Now you can build and host LiveSplit One:

```bash
npm run serve
```

## Browser Support

| Browser           | Compatibility | Known Issues                                                                                                                                                                                      |
| ----------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrome            | ≥91           | [![GitHub issues by-label](https://img.shields.io/github/issues/LiveSplit/LiveSplitOne/Chromium.svg)](https://github.com/LiveSplit/LiveSplitOne/issues?q=is%3Aissue+is%3Aopen+label%3A"Chromium") |
| Firefox           | ≥89           | [![GitHub issues by-label](https://img.shields.io/github/issues/LiveSplit/LiveSplitOne/Firefox.svg)](https://github.com/LiveSplit/LiveSplitOne/issues?q=is%3Aissue+is%3Aopen+label%3AFirefox)     |
| Edge              | ≥91           | [![GitHub issues by-label](https://img.shields.io/github/issues/LiveSplit/LiveSplitOne/Chromium.svg)](https://github.com/LiveSplit/LiveSplitOne/issues?q=is%3Aissue+is%3Aopen+label%3A"Chromium") |
| Safari            | ≥16.4         |                                                                                                                                                                                                   |
| Opera             | ≥77           | [![GitHub issues by-label](https://img.shields.io/github/issues/LiveSplit/LiveSplitOne/Chromium.svg)](https://github.com/LiveSplit/LiveSplitOne/issues?q=is%3Aissue+is%3Aopen+label%3A"Chromium") |
| iOS               | ≥16.4         | [![GitHub issues by-label](https://img.shields.io/github/issues/LiveSplit/LiveSplitOne/iOS.svg)](https://github.com/LiveSplit/LiveSplitOne/issues?q=is%3Aissue+is%3Aopen+label%3AiOS)             |
| Android WebView   | ≥91           | [![GitHub issues by-label](https://img.shields.io/github/issues/LiveSplit/LiveSplitOne/Android.svg)](https://github.com/LiveSplit/LiveSplitOne/issues?q=is%3Aissue+is%3Aopen+label%3AAndroid)     |
| Chrome Android    | ≥91           | [![GitHub issues by-label](https://img.shields.io/github/issues/LiveSplit/LiveSplitOne/Android.svg)](https://github.com/LiveSplit/LiveSplitOne/issues?q=is%3Aissue+is%3Aopen+label%3AAndroid)     |
| Firefox Android   | ≥89           | [![GitHub issues by-label](https://img.shields.io/github/issues/LiveSplit/LiveSplitOne/Android.svg)](https://github.com/LiveSplit/LiveSplitOne/issues?q=is%3Aissue+is%3Aopen+label%3AAndroid)     |
| Internet Explorer | Unsupported   |                                                                                                                                                                                                   |
| Opera Mini        | Unsupported   |                                                                                                                                                                                                   |
