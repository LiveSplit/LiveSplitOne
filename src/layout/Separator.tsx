import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss } from "../util/ColorUtil";

import "../css/Separator.scss";

export interface Props {
    layoutState: LiveSplit.LayoutStateJson,
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
