import * as React from "react";
import * as LiveSplit from "../livesplit";
import { Component as Split } from "./Split";

export interface Props { state: LiveSplit.SplitsComponentStateJson }

export class Component extends React.Component<Props, undefined> {
    iconUrls: string[];

    constructor(props: Props) {
        super(props);
        this.iconUrls = [];
    }

    getIconUrl(index: number): string {
        while (index >= this.iconUrls.length) {
            this.iconUrls.push("");
        }
        if (this.props.state.splits[index].icon_change != null) {
            this.iconUrls[index] = this.props.state.splits[index].icon_change;
        }
        return this.iconUrls[index];
    }

    render() {
        return (
            <div className="splits">
                {
                    this.props.state.splits.map((s: any, i: number) =>
                        <Split
                            split={s}
                            icon={this.getIconUrl(i)}
                            key={i.toString()}
                            separatorInFrontOfSplit={this.props.state.show_final_separator && i + 1 == this.props.state.splits.length}
                        />)
                }
            </div>
        );
    }
}
