import * as React from "react";
import * as LiveSplit from "../livesplit";
import { renderToSVG } from "./Timer";
import { gradientToCss } from "../util/ColorUtil";

export interface Props { state: LiveSplit.DetailedTimerComponentStateJson }

export class Component extends React.Component<Props, {}> {
    render() {
        let children = [];

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

        let leftSide = [];

        function formatComparison(comparison: LiveSplit.DetailedTimerComponentComparisonStateJson) {
            return (
                <tr>
                    <td>{comparison.name + ":"}</td>
                    <td className="time" style={{
                        "padding-left": "6px"
                    }}>
                        {comparison.time}
                    </td>
                </tr>
            );
        }

        let table = [];

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
