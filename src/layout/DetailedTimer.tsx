import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { renderToSVG } from "./Timer";

import "../css/DetailedTimer.scss";
import variables from "../css/variables.scss";
import { map } from "../util/OptionUtil";

const fontSizeToLineHeightRatio = parseFloat(variables.fontSizeToLineHeightRatio);
const lineHeightToComponentHeightRatio = parseFloat(variables.lineHeightToComponentHeightRatio);
const sidePadding = parseFloat(variables.sidePadding);

export interface Props {
    state: LiveSplit.DetailedTimerComponentStateJson,
    layoutWidth: number,
}

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
        const topRowHeight = totalHeight * 0.55;
        const bottomRowHeight = totalHeight - topRowHeight;
        const topRowFontSize = topRowHeight * 0.5 * fontSizeToLineHeightRatio;
        const bottomRowFontSize = bottomRowHeight * 0.5 * lineHeightToComponentHeightRatio * fontSizeToLineHeightRatio;

        const comparisonNamesColor = map(this.props.state.comparison_names_color, colorToCss);
        const comparisonTimesColor = map(this.props.state.comparison_times_color, colorToCss);

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
                        this.props.layoutWidth,
                    )
                }
                {
                    renderToSVG(
                        this.props.state.segment_timer,
                        "segment-timer",
                        this.props.layoutWidth,
                    )
                }
                <div className="detailed-timer-left-side">
                    {
                        this.icon &&
                        <div className="detailed-timer-icon-container" style={{ width: totalHeight }}>
                            <div className="detailed-timer-icon-inner-container">
                                <img className="detailed-timer-icon" src={this.icon} />
                            </div>
                        </div>
                    }
                    <div className="detailed-timer-left-side-text">
                        {
                            this.props.state.segment_name !== null &&
                            <div
                                className="detailed-timer-segment-name"
                                style={{
                                    color: map(this.props.state.segment_name_color, colorToCss),
                                    height: topRowHeight,
                                    fontSize: topRowFontSize,
                                }}
                            >
                                {this.props.state.segment_name}
                            </div>
                        }
                        <table
                            className="detailed-timer-comparisons"
                            style={{ height: bottomRowHeight, fontSize: bottomRowFontSize }}
                        >
                            <tbody>
                                {
                                    this.props.state.comparison1 !== null &&
                                    formatComparison(
                                        this.props.state.comparison1,
                                        comparisonNamesColor,
                                        comparisonTimesColor,
                                    )
                                }
                                {
                                    this.props.state.comparison2 !== null &&
                                    formatComparison(
                                        this.props.state.comparison2,
                                        comparisonNamesColor,
                                        comparisonTimesColor,
                                    )
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

function formatComparison(
    comparison: LiveSplit.DetailedTimerComponentComparisonStateJson,
    comparisonNamesColor?: string,
    comparisonTimesColor?: string,
) {
    return (
        <tr>
            <td style={{ color: comparisonNamesColor, padding: 0 }}>
                {comparison.name + ":"}
            </td>
            <td className="time" style={{
                color: comparisonTimesColor,
                padding: 0,
                paddingLeft: sidePadding,
            }}>
                {comparison.time}
            </td>
        </tr>
    );
}
