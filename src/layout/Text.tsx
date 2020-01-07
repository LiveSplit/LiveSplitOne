import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import { gradientToCss, colorToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

import "../css/Text.scss";
import "../css/KeyValue.scss";

export interface Props { state: LiveSplit.TextComponentStateJson }

export default class Text extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    public render() {
        const { background, text } = this.props.state;

        const rendered = "Center" in text ? (
            <tr>
                <td
                    className="text-component-text center-text"
                    style={{
                        color: map(this.props.state.left_center_color, colorToCss),
                    }}
                >
                    {text.Center}
                </td>
            </tr>
        ) : (
                <tr>
                    <td
                        className="key-value-key"
                        style={{
                            color: map(this.props.state.left_center_color, colorToCss),
                        }}
                    >
                        {text.Split[0]}
                    </td>
                    <td
                        className="key-value-value time"
                        style={{
                            color: map(this.props.state.right_color, colorToCss),
                        }}
                    >
                        {text.Split[1]}
                    </td>
                </tr>
            );

        return (
            <div
                className={"Center" in text ? "text-component" : "key-value"}
                style={{
                    background: gradientToCss(background),
                }}
            >
                <table>
                    <tbody>
                        {rendered}
                    </tbody>
                </table>
            </div>
        );
    }
}
