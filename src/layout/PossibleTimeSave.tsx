import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

export interface Props { state: LiveSplit.PossibleTimeSaveComponentStateJson }

export default class PossibleTimeSave extends React.Component<Props> {
    public render() {
        return (
            <div
                className="possible-time-save"
                style={{
                    background: gradientToCss(this.props.state.background),
                }}
            >
                <table>
                    <tbody>
                        <tr>
                            <td
                                className="possible-time-save-text"
                                style={{
                                    color: map(this.props.state.label_color, colorToCss),
                                }}
                            >
                                {this.props.state.text}
                            </td>
                            <td
                                className="possible-time-save-time time"
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
