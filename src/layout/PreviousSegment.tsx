import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

export interface Props { state: LiveSplit.PreviousSegmentComponentStateJson }

export default class PreviousSegment extends React.Component<Props> {
    public render() {
        return (
            <div
                className="previous-segment"
                style={{
                    background: gradientToCss(this.props.state.background),
                }}
            >
                <table>
                    <tbody>
                        <tr>
                            <td
                                className="previous-segment-text"
                                style={{
                                    color: map(this.props.state.label_color, colorToCss),
                                }}
                            >
                                {this.props.state.text}
                            </td>
                            <td
                                className="previous-segment-time time"
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
