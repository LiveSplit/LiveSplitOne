import * as React from "react";
import * as LiveSplit from "../livesplit";
import { gradientToCss } from "../util/ColorUtil";
import { renderToSVG } from "./Timer";

export interface Props { state: LiveSplit.DetailedTimerComponentStateJson }

export default class DetailedTimer extends React.Component<Props> {
    public render() {
        const children = [];

        children.push(renderToSVG(
            this.props.state.timer,
            "timer",
        ));

        children.push(renderToSVG(
            this.props.state.segment_timer,
            "segment-timer",
        ));

        const leftSide = [];

        const table = [];

        if (this.props.state.comparison1 != null) {
            table.push(formatComparison(this.props.state.comparison1));
        }

        if (this.props.state.comparison2 != null) {
            table.push(formatComparison(this.props.state.comparison2));
        }

        leftSide.push(
            <table className="detailed-timer-left-side">
                <tbody>
                    {table}
                </tbody>
            </table>,
        );

        children.push(<div>{leftSide}</div>);

        return (
            <div
                className="detailed-timer"
                style={{
                    background: gradientToCss(this.props.state.background),
                }}
            >
                {children}
            </div>
        );
    }
}

function formatComparison(comparison: LiveSplit.DetailedTimerComponentComparisonStateJson) {
    return (
        <tr>
            <td style={{ padding: 0 }}>{comparison.name + ":"}</td>
            <td className="time" style={{
                padding: 0,
                paddingLeft: 6,
            }}>
                {comparison.time}
            </td>
        </tr>
    );
}
