import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import { gradientToCss } from "../util/ColorUtil";
import { renderToSVG } from "./Timer";

import "../css/DetailedTimer.scss";

export interface Props { state: LiveSplit.DetailedTimerComponentStateJson }

export default class DetailedTimer extends React.Component<Props> {
    private icon: string;

    constructor(props: Props) {
        super(props);
        this.icon = "";
    }

    public render() {
        const iconChange = this.props.state.icon_change;
        if (iconChange !== null) {
            this.icon = iconChange;
        }

        const totalHeight = this.props.state.timer.height + this.props.state.segment_timer.height;

        return (
            <div
                className="detailed-timer"
                style={{
                    background: gradientToCss(this.props.state.background),
                    height: totalHeight,
                }}
            >
                {
                    renderToSVG(
                        this.props.state.timer,
                        "timer",
                    )
                }
                {
                    renderToSVG(
                        this.props.state.segment_timer,
                        "segment-timer",
                    )
                }
                <div className="detailed-timer-left-side">
                    {
                        this.icon && <div className="detailed-timer-icon-container">
                            <div className="detailed-timer-icon-inner-container">
                                <img className="detailed-timer-icon" src={this.icon} />
                            </div>
                        </div>
                    }
                    <div className="detailed-timer-left-side-text">
                        {
                            this.props.state.segment_name !== null &&
                            <div className="detailed-timer-segment-name">
                                {this.props.state.segment_name}
                            </div>
                        }
                        <table className="detailed-timer-comparisons">
                            <tbody>
                                {
                                    this.props.state.comparison1 !== null &&
                                    formatComparison(this.props.state.comparison1)
                                }
                                {
                                    this.props.state.comparison2 !== null &&
                                    formatComparison(this.props.state.comparison2)
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
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
