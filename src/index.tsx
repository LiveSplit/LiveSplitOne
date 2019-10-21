import * as React from "react";
import * as ReactDOM from "react-dom";

import { toast, ToastContainer } from "react-toastify";
import { load } from "./livesplit";
import { LiveSplit } from "./ui/LiveSplit";

import "react-toastify/dist/ReactToastify.css";
import "./css/font-awesome.css";
import "./css/main.scss";

async function run() {
    try {
        await load("livesplit_core.wasm");

        ReactDOM.render(
            <div>
                <LiveSplit />
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
You may be using a browser that doesn't support WebAssembly. \
Alternatively, you may be using an Adblocker like uBlock Origin. \
Those are known to block WebAssembly.`);
    }
}

ReactDOM.render(
    <div>
        Loading...
    </div>,
    document.getElementById("base"),
);

run();
