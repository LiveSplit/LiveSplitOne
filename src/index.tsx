import * as React from "react";
import * as ReactDOM from "react-dom";

import { load } from "./livesplit";
import { LiveSplit } from "./ui/LiveSplit";

import "./css/font-awesome.css";
import "./css/livesplit.css";

async function run() {
    await load("src/livesplit_core.wasm");

    ReactDOM.render(
        <div>
            <LiveSplit />
        </div>,
        document.getElementById("base"),
    );
}

run();
