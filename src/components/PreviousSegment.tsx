import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss } from "../util/ColorUtil";

export interface Props { state: LiveSplit.PreviousSegmentComponentStateJson }

export class Component extends React.Component<Props, undefined> {
    render() {
        return (
            <div className="previous-segment">
                <table>
                    <tbody>
                        <tr>
                            <td className="previous-segment-text">{this.props.state.text}</td>
                            <td
                                className={"previous-segment-time time"}
                                style={{
                                    color: colorToCss(this.props.state.visual_color),
                                }}
                            >
                                {this.props.state.time}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
