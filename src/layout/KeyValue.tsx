import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

import "../css/KeyValue.scss";

export interface Props { state: LiveSplit.KeyValueComponentStateJson }

export default class KeyValue extends React.Component<Props> {
    public render() {
        const keyCell = <td
            className="key-value-key"
            style={{
                color: map(this.props.state.key_color, colorToCss),
            }}
        >
            {this.props.state.key}
        </td>;

        const valueCell = <td
            className="key-value-value time"
            style={{
                color: map(this.props.state.value_color, colorToCss),
            }}
        >
            {this.props.state.value}
        </td>;

        let keyValueRows;
        if (this.props.state.display_two_rows) {
            keyValueRows = <>
                <tr>
                    {keyCell}
                </tr>
                <tr>
                    {valueCell}
                </tr>
            </>;
        } else {
            keyValueRows = <>
                <tr>
                    {keyCell}
                    {valueCell}
                </tr>
            </>;
        }

        return (
            <div
                className={`key-value ${this.props.state.display_two_rows ? " key-value-two-rows" : ""}`}
                style={{
                    background: gradientToCss(this.props.state.background),
                }}
            >
                <table>
                    <tbody>
                        {keyValueRows}
                    </tbody>
                </table>
            </div>
        );
    }
}
