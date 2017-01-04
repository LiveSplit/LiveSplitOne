import * as React from "react";
import * as LiveSplit from "../livesplit";
import { Component as Split } from "./Split";

export interface Props { timer: LiveSplit.Timer }

export class Component extends React.Component<Props, LiveSplit.SplitsComponentState> {
    inner: LiveSplit.SplitsComponent;
    timerID: number;
    iconUrls: string[];

    constructor(props: Props) {
        super(props);

        this.inner = new LiveSplit.SplitsComponent();
        this.iconUrls = [];

        this.state = this.inner.getState(this.props.timer);
    }

    getIconUrl(index: number): string {
        while (index >= this.iconUrls.length) {
            this.iconUrls.push("");
        }
        if (this.state.splits[index].icon_change != null) {
            this.iconUrls[index] = this.state.splits[index].icon_change;
        }
        return this.iconUrls[index];
    }

    componentDidMount() {
        this.timerID = setInterval(
            () => this.update(),
            1000 / 30
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
        this.inner.drop();
    }

    update() {
        this.setState(this.inner.getState(this.props.timer));
    }

    render() {
        return (
            <div className="splits">
                {
                    this.state.splits.map((s, i) => <Split split={s} icon={this.getIconUrl(i)} key={i.toString()} />)
                }
            </div>
        );
    }
}
