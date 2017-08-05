import * as React from "react";
import * as LiveSplit from "../livesplit";
import Split from "./Split";

export interface Props {
    state: LiveSplit.SplitsComponentStateJson,
    layoutState: LiveSplit.LayoutStateJson,
}

export default class Splits extends React.Component<Props> {
    private iconUrls: Array<string | null>;

    constructor(props: Props) {
        super(props);
        this.iconUrls = [];
    }

    public render() {
        return (
            <div className="splits">
                {
                    this.props.state.splits.map((s: LiveSplit.SplitStateJson, i: number) =>
                        <Split
                            split={s}
                            splitsState={this.props.state}
                            layoutState={this.props.layoutState}
                            icon={this.getIconUrl(i)}
                            key={i.toString()}
                            index={i}
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

    private getIconUrl(index: number): string | null {
        while (index >= this.iconUrls.length) {
            this.iconUrls.push("");
        }
        if (this.props.state.splits[index].icon_change != null) {
            this.iconUrls[index] = this.props.state.splits[index].icon_change;
        }
        return this.iconUrls[index];
    }
}
