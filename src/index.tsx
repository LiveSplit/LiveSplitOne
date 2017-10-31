import * as React from "react";
import * as ReactDOM from "react-dom";

import { LiveSplit } from "./ui/LiveSplit";

import "./css/livesplit.css";
import "./css/font-awesome.css";

ReactDOM.render(
    <div>
        <LiveSplit />
    </div>,
    document.getElementById("base"),
);
