import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { state: LiveSplit.TimerComponentStateJson }

export class Component extends React.Component<Props, undefined> {
    getColor(): string {
        return "color-" + this.props.state.color.toLowerCase();
    }

    render() {
        return (
            <div className="timer">
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
                    }} x="230px" y="53px" textAnchor="end">{this.props.state.time}</text>
                    <text className="timer-time" style={{
                        "fill": "url(#text-gradient)",
                        "font-size": "45px",
                        "font-family": "timer, sans-serif",
                    }} x="294px" y="53px" textAnchor="end">{this.props.state.fraction}</text>
                </svg>
            </div>
        );
    }
}
