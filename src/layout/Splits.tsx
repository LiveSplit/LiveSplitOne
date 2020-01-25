import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import Split from "./Split";
import { gradientToCss, colorToCss } from "../util/ColorUtil";
import { Option, map } from "../util/OptionUtil";
import SplitLabels from "./SplitLabels";

import "../css/Splits.scss";

export interface Props {
    state: LiveSplit.SplitsComponentStateJson,
    layoutState: LiveSplit.LayoutStateJson,
}

export default class Splits extends React.Component<Props> {
    private iconUrls: string[];

    constructor(props: Props) {
        super(props);
        this.iconUrls = [];
    }

    public render() {
        for (const iconChange of this.props.state.icon_changes) {
            while (iconChange.segment_index >= this.iconUrls.length) {
                this.iconUrls.push("");
            }
            this.iconUrls[iconChange.segment_index] = iconChange.icon;
        }

        const background = this.props.state.background;
        const style: any = {};
        let evenOdd: [Option<string>, Option<string>] = [null, null];
        if ("Alternating" in background) {
            evenOdd = [
                colorToCss(background.Alternating[0]),
                colorToCss(background.Alternating[1]),
            ];
        } else {
            style.background = gradientToCss(background.Same);
        }

        const maxColumns = Math.max.apply(Math, this.props.state.splits.map((split) => split.columns.length));

        return (
            <div className="splits" style={style}>
                {
                    map(
                        this.props.state.column_labels,
                        (labels) => <SplitLabels labels={labels} />,
                    )
                }
                {
                    this.props.state.splits.map((s, i) =>
                        <Split
                            evenOdd={evenOdd}
                            split={s}
                            splitsState={this.props.state}
                            layoutState={this.props.layoutState}
                            icon={this.iconUrls[s.index]}
                            key={s.index.toString()}
                            maxColumns={maxColumns}
                            separatorInFrontOfSplit={
                                (this.props.state.show_final_separator &&
                                    i + 1 === this.props.state.splits.length)
                                || (i === 0 && this.props.state.column_labels !== null)
                            }
                            visualSplitIndex={i}
                            showingLabels={this.props.state.column_labels !== null}
                        />,
                    )
                }
            </div>
        );
    }
}
