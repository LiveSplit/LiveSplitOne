import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { state: LiveSplit.PreviousSegmentComponentStateJson }

export class Component extends React.Component<Props, undefined> {
    getColor(): string {
        return "color-" + this.props.state.color.toLowerCase();
    }

    render() {
        return (
            <div className="previous-segment">
                <table>
                    <tbody>
                        <tr>
                            <td className="previous-segment-text">{this.props.state.text}</td>
                            <td className={"previous-segment-time time " + this.getColor()}>{this.props.state.time}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
