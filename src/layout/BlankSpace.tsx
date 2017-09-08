import * as React from "react";
import * as LiveSplit from "../livesplit";
import { gradientToCss } from "../util/ColorUtil";

export interface Props { state: LiveSplit.BlankSpaceComponentStateJson }

export default class BlankSpace extends React.Component<Props> {
    public render() {
        return (
            <div
                className="blank-space"
                style={{
                    height: this.props.state.height,
                    background: gradientToCss(this.props.state.background),
                }}
            />
        );
    }
}
