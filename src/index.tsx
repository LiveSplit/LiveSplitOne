import { preloadWasm } from "./livesplit-core/preload";

// FIXME: Remove the polyfill later.

if (typeof Symbol.dispose !== "symbol") {
    Object.defineProperty(Symbol, "dispose", {
        configurable: false,
        enumerable: false,
        writable: false,
        value: Symbol.for("dispose")
    });
}

if (typeof Symbol.asyncDispose !== "symbol") {
    Object.defineProperty(Symbol, "asyncDispose", {
        configurable: false,
        enumerable: false,
        writable: false,
        value: Symbol.for("asyncDispose")
    });
}

if (process.env.NODE_ENV === "production" && window.__TAURI__ == null && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js");
}

preloadWasm();

import "./css/main.scss";
import("./css/font-awesome.css");

try {
    const { LiveSplit, React, createRoot } = await import("./indexDelayed");

    try {
        const {
            splits,
            splitsKey,
            layout,
            comparison,
            timingMethod,
            hotkeys,
            layoutWidth,
            layoutHeight,
            generalSettings,
        } = await LiveSplit.loadStoredData();

        async function requestWakeLock() {
            try {
                await (navigator as any)?.wakeLock?.request();
            } catch {
                // It's fine if it fails.
            }
        }

        requestWakeLock();

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        });

        // The renderer requires the fonts to be loaded before it gets created
        // as otherwise information may be cached incorrectly.
        try {
            const promises = [];
            // TypeScript doesn't seem to know that the fonts are iterable.
            for (const fontFace of (document.fonts as any as Iterable<FontFace>)) {
                if (fontFace.family === 'timer' || fontFace.family === 'fira') {
                    promises.push(fontFace.load());
                }
            }
            await Promise.all(promises);
        } catch {
            // If somehow something goes wrong, that's kind of bad, but we
            // should still have the fallback fonts that we can fall back to.
        }

        const container = document.getElementById("base");
        const root = createRoot(container!);
        root.render(
            <LiveSplit
                splits={splits}
                layout={layout}
                comparison={comparison}
                timingMethod={timingMethod}
                hotkeys={hotkeys}
                splitsKey={splitsKey}
                layoutWidth={layoutWidth}
                layoutHeight={layoutHeight}
                generalSettings={generalSettings}
            />,
        );
    } catch (e: any) {
        if (e.name === "InvalidStateError") {
            alert(`Couldn't load LiveSplit One. \
You may be in private browsing mode. \
LiveSplit One cannot store any splits, layouts, or other settings because of the limitations of the browser's private browsing mode. \
These limitations may be lifted in the future. \
To run LiveSplit One for now, please disable private browsing in your settings.\n`);
        }
    }
} catch (_) {
    alert(`Couldn't load LiveSplit One. \
You may be using a browser that is not up to date. \
Please update your browser or your iOS version and try again. \
Another reason might be that a browser extension, such as an adblocker, \
is blocking access to important scripts.`);
}
