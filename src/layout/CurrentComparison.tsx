import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

export interface Props { state: LiveSplit.CurrentComparisonComponentStateJson }

export default class CurrentComparison extends React.Component<Props> {
    public render() {
        return (
            <div
                className="current-comparison"
                style={{
                    background: gradientToCss(this.props.state.background),
                }}
            >
                <table>
                    <tbody>
                        <tr>
                            <td
                                className="current-comparison-text"
                                style={{
                                    color: map(this.props.state.label_color, colorToCss),
                                }}
                            >
                                {this.props.state.text}
                            </td>
                            <td
                                className="current-comparison-comparison"
                                style={{
                                    color: map(this.props.state.value_color, colorToCss),
                                }}
                            >
                                {this.props.state.comparison}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
