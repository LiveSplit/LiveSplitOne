import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import Split from "./Split";
import { gradientToCss, colorToCss } from "../util/ColorUtil";
import { Option, map } from "../util/OptionUtil";
import SplitLabels from "./SplitLabels";

import "../css/Splits.scss";
import { UrlCache } from "../util/UrlCache";

export interface Props {
    state: LiveSplit.SplitsComponentStateJson,
    layoutUrlCache: UrlCache,
}

export default class Splits extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    public render() {
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

        const splitsState = {
            has_icons: this.props.state.has_icons,
            show_thin_separators: this.props.state.show_thin_separators,
            display_two_rows: this.props.state.display_two_rows,
            current_split_gradient: this.props.state.current_split_gradient
        };

        return (
            <div className="splits" style={style}>
                {
                    map(
                        this.props.state.column_labels,
                        (labels) => <SplitLabels
                            labels={labels}
                        />,
                    )
                }
                {
                    this.props.state.splits.map((s, i) =>
                        <Split
                            evenOdd={evenOdd}
                            split={s}
                            splitsState={splitsState}
                            layoutUrlCache={this.props.layoutUrlCache}
                            key={s.index.toString()}
                            separatorInFrontOfSplit={
                                (this.props.state.show_final_separator &&
                                    i + 1 === this.props.state.splits.length)
                                || (i === 0 && this.props.state.column_labels !== null)
                            }
                            visualSplitIndex={i}
                        />,
                    )
                }
            </div>
        );
    }
}
