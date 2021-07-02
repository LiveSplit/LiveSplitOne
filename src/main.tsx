import { LiveSplit } from "./ui/LiveSplit";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { toast, ToastContainer } from "react-toastify";

try {
    const {
        splits,
        splitsKey,
        layout,
        hotkeys,
        layoutWidth,
    } = await LiveSplit.loadStoredData();

    try {
        ReactDOM.render(
            <div>
                <LiveSplit
                    splits={splits}
                    layout={layout}
                    hotkeys={hotkeys}
                    splitsKey={splitsKey}
                    layoutWidth={layoutWidth}
                />
                <ToastContainer
                    position={toast.POSITION.BOTTOM_RIGHT}
                    toastClassName="toast-class"
                    bodyClassName="toast-body"
                    style={{
                        textShadow: "none",
                    }}
                />
            </div>,
            document.getElementById("base"),
        );
    } catch (_) {
        alert(`Couldn't load LiveSplit One. \
You may be using a browser that is not up to date. \
Please update your browser or your iOS version and try again. \
Another reason might be that a browser extension, such as an adblocker, \
is blocking access to important scripts.`);
    }
} catch (e) {
    if (e.name === "InvalidStateError") {
        alert(`Couldn't load LiveSplit One. \
You may be in private browsing mode. \
LiveSplit One cannot store any splits, layouts, or other settings because of the limitations of the browser's private browsing mode. \
These limitations may be lifted in the future. \
To run LiveSplit One for now, please disable private browsing in your settings.\n`);
    }
}
