import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";

export interface Props {
    splitsState: LiveSplit.SplitsComponentStateJson,
    split: LiveSplit.SplitStateJson,
    icon: string | null,
    separatorInFrontOfSplit: boolean,
    layoutState: LiveSplit.LayoutStateJson,
    index: number,
}

export default class Split extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        let currentSplit = this.props.split.is_current_split ? "current-split" : "";
        let separator = this.props.separatorInFrontOfSplit ? "split-separator" : "";

        let innerStyle: any = {};
        if (this.props.index % 2 == 1) {
            innerStyle.borderBottom = "1px solid " + colorToCss(this.props.layoutState.thin_separators_color);
            innerStyle.borderTop = innerStyle.borderBottom;
        }
        if (this.props.separatorInFrontOfSplit) {
            innerStyle.borderTop = "2px solid " + colorToCss(this.props.layoutState.separators_color);
        }

        let outerStyle: any = {};
        if (this.props.split.is_current_split) {
            outerStyle.background = gradientToCss(this.props.splitsState.current_split_gradient);
        }

        return (
            <span
                className={["split", currentSplit, separator].filter(s => s.length > 0).join(" ")}
                style={outerStyle}
            >
                <div
                    className={this.props.icon != "" ? "split-icon-container" : "split-icon-container-empty"}
                    style={innerStyle}
                >
                    <img className={this.props.icon != "" ? "split-icon" : ""} src={this.props.icon != null ? this.props.icon : ""} />
                </div>
                <div
                    className="split-name"
                    style={innerStyle}
                >
                    {this.props.split.name}
                </div>
                <div
                    className={"split-delta time"}
                    style={{
                        ...innerStyle,
                        color: colorToCss(this.props.split.visual_color),
                    }}
                >
                    {this.props.split.delta}
                </div>
                <div
                    className="split-time time"
                    style={innerStyle}
                >
                    {this.props.split.time}
                </div>
            </span>
        );
    }
}
