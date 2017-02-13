import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { timer: LiveSplit.Timer }

export class Component extends React.Component<Props, LiveSplit.TimerComponentState> {
    inner: LiveSplit.TimerComponent;
    timerID: number;

    constructor(props: Props) {
        super(props);

        this.inner = new LiveSplit.TimerComponent();

        this.state = this.inner.state(this.props.timer);
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
        this.setState(this.inner.state(this.props.timer));
    }

    getColor(): string {
        return "color-" + this.state.color.toLowerCase();
    }

    render() {
        return (
            <svg height="60px">
                <defs>
                    <linearGradient id="text-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop className={this.getColor() + "-top"} offset="0%"></stop>
                        <stop className={this.getColor()} offset="100%"></stop>
                    </linearGradient>
                </defs>
                <text className="timer-time" style={{
                    "fill": "url(#text-gradient)",
                    "font-size": "60px",
                    "font-family": "timer, sans-serif",
                }} x="230px" y="53px" textAnchor="end">{this.state.time}</text>
                <text className="timer-time" style={{
                    "fill": "url(#text-gradient)",
                    "font-size": "45px",
                    "font-family": "timer, sans-serif",
                }} x="294px" y="53px" textAnchor="end">{this.state.fraction}</text>
            </svg>
        );

            // <div className={"timer-time " + this.getColor()}>
            //     <span>{this.state.time}</span>
            //     <span className="timer-fraction">{this.state.fraction}</span>
            // </div>
    }
}
