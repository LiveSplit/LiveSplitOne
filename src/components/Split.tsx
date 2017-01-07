import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { split: LiveSplit.SplitState, icon: string }

export class Component extends React.Component<Props, undefined> {
    constructor(props: Props) {
        super(props);
    }

    getColor(): string {
        return "split-color-" + this.props.split.color.toLowerCase();
    }

    render() {
        return (
            <span className={this.props.split.is_current_split ? "split current-split" : "split"}>
                <div className={this.props.icon != "" ? "split-icon-container" : "split-icon-container-empty"}><img className={this.props.icon != "" ? "split-icon" : ""} src={this.props.icon}></img></div>
                <div className="split-name">{this.props.split.name}</div>
                <div className={"split-delta time " + this.getColor()}>{this.props.split.delta}</div>
                <div className="split-time time">{this.props.split.time}</div>
            </span>
        );
    }
}
