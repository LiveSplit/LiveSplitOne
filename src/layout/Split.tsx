import * as React from "react";
import deepEqual from "fast-deep-equal";
import * as LiveSplit from "../livesplit-core";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { Option } from "../util/OptionUtil";
import { UrlCache } from "../util/UrlCache";

export interface Props {
    splitsState: {
        has_icons: boolean,
        show_thin_separators: boolean,
        display_two_rows: boolean,
        current_split_gradient: LiveSplit.Gradient,
    },
    evenOdd: [Option<string>, Option<string>],
    split: LiveSplit.SplitStateJson,
    separatorInFrontOfSplit: boolean,
    visualSplitIndex: number,
    layoutUrlCache: UrlCache,
}

export default class Split extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    public render() {
        const currentSplit = this.props.split.is_current_split ? "current-split" : "";
        const twoRows = this.props.splitsState.display_two_rows ? "two-rows" : "";

        const splitsHaveIcons = this.props.splitsState.has_icons;
        const icon = splitsHaveIcons
            ? this.props.layoutUrlCache.cache(this.props.split.icon)
            : undefined;

        const innerStyle: any = {};
        const outerStyle: any = {};

        if (this.props.split.index % 2 === 1) {
            if (this.props.splitsState.show_thin_separators) {
                innerStyle.borderBottomColor = "var(--thin-separators-color)";
            } else {
                innerStyle.borderBottomColor = "transparent";
            }
            outerStyle.backgroundColor = this.props.evenOdd[1];
        } else {
            innerStyle.borderBottomColor = "transparent";
            outerStyle.backgroundColor = this.props.evenOdd[0];
        }
        innerStyle.borderTopColor = innerStyle.borderBottomColor;

        let separatorAbove = "";
        if (this.props.separatorInFrontOfSplit) {
            innerStyle.borderTopColor = "var(--separators-color)";
            separatorAbove = "separator-above";
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
            } else {
                break;
            }
        }

        const columns = this.props.split.columns.slice(0, lastEmptyColumnIndex);

        return (
            <span
                className={["split", currentSplit, twoRows].filter((s) => s.length > 0).join(" ")}
                style={outerStyle}
            >
                <div className="current-split-background" style={currentSplitBackgroundStyle}></div>
                <div className={`split-borders ${separatorAbove}`} style={innerStyle}></div>
                <div
                    key="split-icon"
                    className={splitsHaveIcons ? "split-icon-container" : "split-icon-container-empty"}
                >
                    {
                        splitsHaveIcons && icon !== undefined &&
                        <img className="split-icon" src={icon} />
                    }
                </div>
                <div className="split-rows">
                    <div className="split-row split-first-row">
                        <div
                            key="split-name"
                            className="split-name text-font"
                        >
                            <div className="split-name-inner">
                                {this.props.split.name}
                            </div>
                        </div>
                    </div>
                    <div
                        className="split-row split-second-row"
                    >
                        {
                            columns.map((column, i) =>
                                <div
                                    key={i}
                                    className={`split-time time times-font ${i < columns.length - 1 ? "split-time-full" : ""}`}
                                    style={{
                                        color: colorToCss(column.visual_color),
                                    }}
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

    public shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
        return !deepEqual(nextProps.splitsState, this.props.splitsState) ||
            !deepEqual(nextProps.evenOdd, this.props.evenOdd) ||
            !deepEqual(nextProps.split, this.props.split) ||
            nextProps.separatorInFrontOfSplit !== this.props.separatorInFrontOfSplit ||
            nextProps.visualSplitIndex !== this.props.visualSplitIndex;
    }
}
