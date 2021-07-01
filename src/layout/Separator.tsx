import * as React from "react";

import "../css/Separator.scss";

export default class Separator extends React.Component {
    public render() {
        return (
            <div
                className="separator"
                style={{
                    backgroundColor: "var(--separators-color)",
                }}
            />
        );
    }
}
