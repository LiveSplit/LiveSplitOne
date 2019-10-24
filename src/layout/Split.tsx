import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { Option } from "../util/OptionUtil";

export interface Props {
    splitsState: LiveSplit.SplitsComponentStateJson,
    evenOdd: [Option<string>, Option<string>],
    split: LiveSplit.SplitStateJson,
    icon: string,
    separatorInFrontOfSplit: boolean,
    layoutState: LiveSplit.LayoutStateJson,
}

export default class Split extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    public render() {
        const currentSplit = this.props.split.is_current_split ? "current-split" : "";
        const separator = this.props.separatorInFrontOfSplit ? "split-separator" : "";

        const splitsHaveIcons = this.props.splitsState.has_icons;
        const hasIcon = this.props.icon !== "";

        const innerStyle: any = {};
        if (this.props.split.index % 2 === 1) {
            innerStyle.borderBottom = this.props.splitsState.show_thin_separators
                ? `1px solid ${colorToCss(this.props.layoutState.thin_separators_color)}`
                : "1px solid transparent";
            innerStyle.backgroundColor = this.props.evenOdd[1];
        } else {
            innerStyle.borderBottom = "1px solid transparent";
            innerStyle.backgroundColor = this.props.evenOdd[0];
        }
        innerStyle.borderTop = innerStyle.borderBottom;

        if (this.props.separatorInFrontOfSplit) {
            innerStyle.borderTop = `2px solid ${colorToCss(this.props.layoutState.separators_color)}`;
        }

        const outerStyle: any = {};
        if (this.props.split.is_current_split) {
            outerStyle.background = gradientToCss(this.props.splitsState.current_split_gradient);
        }

        return (
            <span
                className={["split", currentSplit, separator].filter((s) => s.length > 0).join(" ")}
                style={outerStyle}
            >
                <div
                    key="split-icon"
                    className={splitsHaveIcons ? "split-icon-container" : "split-icon-container-empty"}
                    style={innerStyle}
                >
                    {
                        splitsHaveIcons && (hasIcon
                            ? <img className="split-icon" src={this.props.icon} />
                            : <div className="split-icon-empty"></div>)
                    }
                </div>
                <div
                    key="split-name"
                    className="split-name"
                    style={innerStyle}
                >
                    {this.props.split.name}
                </div>
                {
                    this.props.split.columns.map((column, i) =>
                        <div
                            key={i}
                            className="split-time time"
                            style={{
                                ...innerStyle,
                                color: colorToCss(column.visual_color),
                            }}
                        >
                            {column.value}
                        </div>,
                    ).reverse()
                }
            </span>
        );
    }
}
