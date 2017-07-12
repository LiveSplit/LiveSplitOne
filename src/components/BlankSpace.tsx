import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { state: LiveSplit.BlankSpaceComponentStateJson };

export class Component extends React.Component<Props, undefined> {
    render() {
        return (
            <div
                className="blank-space"
                style={{
                    "height": this.props.state.height + "px"
                }}
            />
        )
    }
}
