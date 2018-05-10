import * as React from "react";
import * as ReactDOM from "react-dom";

import { toast, ToastContainer } from "react-toastify";
import { load } from "./livesplit";
import { LiveSplit } from "./ui/LiveSplit";

import "react-toastify/dist/ReactToastify.css";
import "./css/font-awesome.css";
import "./css/livesplit.css";

async function run() {
    await load("src/livesplit_core.wasm");

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
}

run();
