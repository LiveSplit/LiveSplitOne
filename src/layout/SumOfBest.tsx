import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

export interface Props { state: LiveSplit.SumOfBestComponentStateJson }

export default class SumOfBest extends React.Component<Props> {
    public render() {
        return (
            <div
                className="sum-of-best"
                style={{
                    background: gradientToCss(this.props.state.background),
                }}
            >
                <table>
                    <tbody>
                        <tr>
                            <td
                                className="sum-of-best-text"
                                style={{
                                    color: map(this.props.state.label_color, colorToCss),
                                }}
                            >
                                {this.props.state.text}
                            </td>
                            <td
                                className="sum-of-best-time time"
                                style={{
                                    color: map(this.props.state.value_color, colorToCss),
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
