import * as React from "react";
import * as ReactDOM from "react-dom";

import { Hello } from "./components/Hello";
import { LoggingButton } from "./components/LoggingButton";

ReactDOM.render(
    <div>
        <Hello compiler="TypeScript" framework="React" />
        <LoggingButton initialValue={5} />
    </div>,
    document.getElementById("example")
);
