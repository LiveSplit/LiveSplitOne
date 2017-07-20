import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss } from "../util/ColorUtil";

export interface Props {
    split: LiveSplit.SplitStateJson,
    icon: string,
    separatorInFrontOfSplit: boolean,
    layoutState: LiveSplit.LayoutStateJson,
    index: number,
}

export class Component extends React.Component<Props, undefined> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        let currentSplit = this.props.split.is_current_split ? "current-split" : "";
        let separator = this.props.separatorInFrontOfSplit ? "split-separator" : "";

        let style: any = {};
        if (this.props.index % 2 == 1) {
            style.borderBottom = "1px solid " + colorToCss(this.props.layoutState.thin_separators_color);
            style.borderTop = style.borderBottom;
        }
        if (this.props.separatorInFrontOfSplit) {
            style.borderTop = "2px solid " + colorToCss(this.props.layoutState.separators_color);
        }

        return (
            <span className={["split", currentSplit, separator].filter(s => s.length > 0).join(" ")}>
                <div
                    className={this.props.icon != "" ? "split-icon-container" : "split-icon-container-empty"}
                    style={style}
                >
                    <img className={this.props.icon != "" ? "split-icon" : ""} src={this.props.icon} />
                </div>
                <div
                    className="split-name"
                    style={style}
                >
                    {this.props.split.name}
                </div>
                <div
                    className={"split-delta time"}
                    style={{
                        ...style,
                        color: colorToCss(this.props.split.visual_color),
                    }}
                >
                    {this.props.split.delta}
                </div>
                <div
                    className="split-time time"
                    style={style}
                >
                    {this.props.split.time}
                </div>
            </span>
        );
    }
}
