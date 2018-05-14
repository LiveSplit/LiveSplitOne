<h1> <img src="https://raw.githubusercontent.com/LiveSplit/LiveSplit/master/LiveSplit/Resources/Icon.png" alt="LiveSplit" height="42" width="45" align="top"/> LiveSplit One</h1>

[![Build Status](https://travis-ci.org/LiveSplit/LiveSplitOne.svg?branch=master)](https://travis-ci.org/LiveSplit/LiveSplitOne)

LiveSplit One is a version of LiveSplit that uses the multiplatform
[livesplit-core](https://github.com/LiveSplit/livesplit-core) Library and Web
Technologies like React and Electron to create a new LiveSplit experience that
works on a lot of different platforms.

The Web Version is available [here](https://livesplit.github.io/LiveSplitOne/).

## Build Instructions

In order to build LiveSplit One you need to install
[npm](https://www.npmjs.com/get-npm) and the [Rust
Compiler](https://www.rust-lang.org/). Make sure to recursively clone the
repository so that all git submodules are cloned as well:
```
git clone --recursive
```
Once you have cloned the repository and both the Rust compiler and npm are set
up, you need to install the WebAssembly target like so:
```
rustup target add wasm32-unknown-unknown
```
You need to set up some npm modules before compiling the project:
```
npm install
```
You are now ready to build livesplit-core, which powers LiveSplit One:
```
npm run build:core
```
Now you can build and host LiveSplit One:
```
npm run start
```
A browser tab with LiveSplit One should now open.
