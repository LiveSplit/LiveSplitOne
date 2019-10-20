import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

import "../css/KeyValue.scss";

export interface Props { state: LiveSplit.KeyValueComponentStateJson }

export default class CurrentComparison extends React.Component<Props> {
    public render() {
        return (
            <div
                className="key-value"
                style={{
                    background: gradientToCss(this.props.state.background),
                }}
            >
                <table>
                    <tbody>
                        <tr>
                            <td
                                className="key-value-key"
                                style={{
                                    color: map(this.props.state.key_color, colorToCss),
                                }}
                            >
                                {this.props.state.key}
                            </td>
                            <td
                                className="key-value-value time"
                                style={{
                                    color: map(this.props.state.value_color, colorToCss),
                                }}
                            >
                                {this.props.state.value}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
