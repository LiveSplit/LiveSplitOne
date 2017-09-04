import * as React from "react";
import * as LiveSplit from "../livesplit";
import Split from "./Split";

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

        return (
            <div className="splits">
                {
                    this.props.state.splits.map((s: LiveSplit.SplitStateJson, i: number) =>
                        <Split
                            split={s}
                            splitsState={this.props.state}
                            layoutState={this.props.layoutState}
                            icon={this.iconUrls[s.index]}
                            key={s.index.toString()}
                            separatorInFrontOfSplit={
                                this.props.state.show_final_separator &&
                                i + 1 === this.props.state.splits.length
                            }
                        />,
                    )
                }
            </div>
        );
    }
}
