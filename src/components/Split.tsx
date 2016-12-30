import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { split: LiveSplit.SplitState };

export class Component extends React.Component<Props, undefined> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <tr>
                <td className="split-name">{this.props.split.name}</td>
                <td className="split-delta">{this.props.split.delta}</td>
                <td className="split-time">{this.props.split.time}</td>
            </tr>
        );
    }
}
