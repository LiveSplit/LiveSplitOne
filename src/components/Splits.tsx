import * as React from "react";
import * as LiveSplit from "../livesplit";
import { Component as Split } from "./Split";

export interface Props { timer: LiveSplit.Timer }

export class Component extends React.Component<Props, LiveSplit.SplitsComponentState> {
    inner: LiveSplit.SplitsComponent;
    timerID: number;

    constructor(props: Props) {
        super(props);

        this.inner = new LiveSplit.SplitsComponent();

        this.state = this.inner.getState(this.props.timer);
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
                <table id="split">
                    <tbody>
                    {
                        this.state.splits.map((s, i) => <Split split={s} key={i.toString()} />)
                    }
                    </tbody>
                </table>
            </div>
        );
    }
}
