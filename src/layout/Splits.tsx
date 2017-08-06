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

    private getIconUrl(index: number): string {
        while (index >= this.iconUrls.length) {
            this.iconUrls.push("");
        }
        const iconChange = this.props.state.splits[index].icon_change;
        if (iconChange != null) {
            this.iconUrls[index] = iconChange;
        }
        return this.iconUrls[index];
    }
}
