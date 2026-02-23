import { preloadWasm } from "./livesplit-core/preload";

// Unfortunately, this module can't depend on the localization system, so we
// have to hardcode the error message here. This is because the localization
// system itself depends on the WebAssembly module. But if it fails loading, we
// can't ever resolve the message to display to the user. So we just have to
// hardcode it here.
preloadWasm().catch((e) => {
    alert("Couldn't load LiveSplit One.\nYou may be using a browser that is not up to date.\nPlease update your browser or your iOS version and try again.\nAnother reason might be that a browser extension, such as an adblocker, is blocking access to important scripts. Here's the exact error message for reporting purposes:\n\n" + e);
});
