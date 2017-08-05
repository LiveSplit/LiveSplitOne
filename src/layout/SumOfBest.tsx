import * as React from "react";
import * as LiveSplit from "../livesplit";
import { gradientToCss } from "../util/ColorUtil";

export interface Props { state: LiveSplit.SumOfBestComponentStateJson };

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
                            <td className="sum-of-best-text">{this.props.state.text}</td>
                            <td className={"sum-of-best-time time"}>{this.props.state.time}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }
}
