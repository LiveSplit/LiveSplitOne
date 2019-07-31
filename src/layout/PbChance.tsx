import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

export interface Props { state: LiveSplit.PbChanceComponentStateJson }

export default class PbChance extends React.Component<Props> {
    public render() {
        return (
            <div
                className="pb-chance"
                style={{
                    background: gradientToCss(this.props.state.background),
                }}
            >
                <table>
                    <tbody>
                        <tr>
                            <td
                                className="pb-chance-text"
                                style={{
                                    color: map(this.props.state.label_color, colorToCss),
                                }}
                            >
                                {this.props.state.text}
                            </td>
                            <td
                                className="pb-chance-value time"
                                style={{
                                    color: map(this.props.state.value_color, colorToCss),
                                }}
                            >
                                {this.props.state.pb_chance}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

}
