import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { Option } from "../util/OptionUtil";

export interface Props {
    splitsState: LiveSplit.SplitsComponentStateJson,
    evenOdd: [Option<string>, Option<string>],
    split: LiveSplit.SplitStateJson,
    icon?: string,
    separatorInFrontOfSplit: boolean,
    layoutState: LiveSplit.LayoutStateJson,
    visualSplitIndex: number,
}

export default class Split extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    public render() {
        const currentSplit = this.props.split.is_current_split ? "current-split" : "";
        const separator = this.props.separatorInFrontOfSplit ? "split-separator" : "";
        const twoRows = this.props.splitsState.display_two_rows ? "two-rows" : "";

        const splitsHaveIcons = this.props.splitsState.has_icons;
        const hasIcon = this.props.icon !== undefined && this.props.icon !== "";

        const innerStyle: any = {};
        const outerStyle: any = {};

        if (this.props.split.index % 2 === 1) {
            innerStyle.borderBottom = this.props.splitsState.show_thin_separators
                ? `1px solid ${colorToCss(this.props.layoutState.thin_separators_color)}`
                : "1px solid transparent";
            outerStyle.backgroundColor = this.props.evenOdd[1];
        } else {
            innerStyle.borderBottom = "1px solid transparent";
            outerStyle.backgroundColor = this.props.evenOdd[0];
        }
        innerStyle.borderTop = innerStyle.borderBottom;

        if (this.props.separatorInFrontOfSplit) {
            innerStyle.borderTop = `2px solid ${colorToCss(this.props.layoutState.separators_color)}`;
        }

        const currentSplitBackgroundStyle: any = {};
        if (this.props.split.is_current_split) {
            currentSplitBackgroundStyle.background = gradientToCss(this.props.splitsState.current_split_gradient);
        }

        let lastEmptyColumnIndex = this.props.split.columns.length;
        for (let i = this.props.split.columns.length - 1; i >= 0; i--) {
            const column = this.props.split.columns[i];
            if (!column.value) {
                lastEmptyColumnIndex = i;
            }
        }

        const columns = this.props.split.columns.slice(0, lastEmptyColumnIndex);

        return (
            <span
                className={["split", currentSplit, separator, twoRows].filter((s) => s.length > 0).join(" ")}
                style={outerStyle}
            >
                <div className="current-split-background" style={currentSplitBackgroundStyle}></div>
                <div
                    key="split-icon"
                    className={splitsHaveIcons ? "split-icon-container" : "split-icon-container-empty"}
                    style={innerStyle}
                >
                    {
                        splitsHaveIcons && hasIcon &&
                        <img className="split-icon" src={this.props.icon} />
                    }
                </div>
                <div
                    className="split-rows"
                    style={innerStyle}
                >
                    <div className="split-row split-first-row">
                        <div
                            key="split-name"
                            className="split-name"
                        >
                            <div className="split-name-inner">
                                {this.props.split.name}
                            </div>
                        </div>
                    </div>
                    <div className="split-row split-second-row">
                        {
                            columns.map((column, i) =>
                                <div
                                    key={i}
                                    className={`split-time time ${i < columns.length - 1 ? "split-time-full" : ""}`}
                                    style={{ color: colorToCss(column.visual_color) }}
                                >
                                    <div className="split-time-inner">
                                        {column.value}
                                    </div>
                                </div>,
                            ).reverse()
                        }
                    </div>
                </div>
            </span>
        );
    }
}
