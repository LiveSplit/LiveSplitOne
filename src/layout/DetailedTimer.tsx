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
            40,
        ));

        children.push(renderToSVG(
            this.props.state.segment_timer,
            "segment-timer",
            25,
        ));

        const leftSide = [];

        function formatComparison(comparison: LiveSplit.DetailedTimerComponentComparisonStateJson) {
            return (
                <tr>
                    <td>{comparison.name + ":"}</td>
                    <td className="time" style={{
                        "padding-left": "6px",
                    }}>
                        {comparison.time}
                    </td>
                </tr>
            );
        }

        const table = [];

        if (this.props.state.comparison1 != null) {
            table.push(formatComparison(this.props.state.comparison1));
        }

        if (this.props.state.comparison2 != null) {
            table.push(formatComparison(this.props.state.comparison2));
        }

        leftSide.push(table);

        children.push(<div className="detailed-timer-left-side">{leftSide}</div>);

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
