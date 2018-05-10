import * as React from "react";
import * as ReactDOM from "react-dom";

import { LiveSplit } from "./ui/LiveSplit";
import { ToastContainer, toast } from "react-toastify";

import "./css/font-awesome.css";
import "./css/livesplit.css";
import "react-toastify/dist/ReactToastify.css";

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
