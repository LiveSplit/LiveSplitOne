import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { timer: LiveSplit.Timer }

export class Component extends React.Component<Props, LiveSplit.TimerComponentState> {
    inner: LiveSplit.TimerComponent;
    timerID: number;

    constructor(props: Props) {
        super(props);

        this.inner = new LiveSplit.TimerComponent();

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

    getColor(): string {
        return "color-" + this.state.color.toLowerCase();
    }

    render() {
        return (
            <div className={"timer-time " + this.getColor()}>
                {this.state.time.split('').map((c, i) => <span className={(c >= '0' && c <= '9') ? "monospace" : ""} key={i}>{c}</span>)}<span className="timer-fraction">{this.state.fraction.split('').map((c, i) => <span className={(c >= '0' && c <= '9') ? "monospace" : ""} key={i}>{c}</span>)}</span>
            </div>
        );
    }
}
