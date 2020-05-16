import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import { colorToCss } from "../util/ColorUtil";

import "../css/Separator.scss";

export interface Props {
    layoutState: {
        separators_color: LiveSplit.Color,
    }
}

export default class Separator extends React.Component<Props> {
    public render() {
        return (
            <div
                className="separator"
                style={{
                    backgroundColor: colorToCss(this.props.layoutState.separators_color),
                }}
            />
        );
    }
}
