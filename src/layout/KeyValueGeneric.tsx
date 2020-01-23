import * as React from "react";
import * as LiveSplit from "../livesplit-core";

import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

import "../css/KeyValue.scss";

export enum KeyValueDisplay {
    Center,
    SplitOneRow,
    SplitTwoRows,
}

export interface Props {
  display: KeyValueDisplay,
  keyColor: LiveSplit.Color | null,
  keyText: string,
  valueColor: LiveSplit.Color | null,
  valueText: string | null,
  wrapperBackground: LiveSplit.Gradient,
}

export default class KeyValueGeneric extends React.Component<Props> {
    public render() {
        const keyCell = <td
            className="key-value-key"
            style={{
                color: map(this.props.keyColor, colorToCss),
            }}
        >
            {this.props.keyText}
        </td>;

        const valueCell = <td
            className="key-value-value time"
            style={{
                color: map(this.props.valueColor, colorToCss),
            }}
        >
            {this.props.valueText}
        </td>;

        let keyValueRows, wrapperClassName;
        if (this.props.display == KeyValueDisplay.Center) {
            keyValueRows = <tr>{keyCell}</tr>;
            wrapperClassName = "key-value-center";
        }
        else if (this.props.display == KeyValueDisplay.SplitTwoRows) {
            keyValueRows = <>
                <tr>
                    {keyCell}
                </tr>
                <tr>
                    {valueCell}
                </tr>
            </>;
            wrapperClassName = "key-value-two-rows";
        } else {
            keyValueRows = <tr>
                {keyCell}
                {valueCell}
            </tr>;
            wrapperClassName = "";
        }

        return (
            <div
                className={`key-value ${wrapperClassName}`}
                style={{
                    background: gradientToCss(this.props.wrapperBackground),
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
