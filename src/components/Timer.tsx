import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { state: LiveSplit.TimerComponentStateJson }

function getColor(color: string): string {
    return "color-" + color.toLowerCase();
}

export function renderToSVG(
    state: LiveSplit.TimerComponentStateJson,
    className = "timer",
    height = 60,
): JSX.Element {
    let y = (0.88 * height) + "px";
    let shiftX;
    switch (state.fraction.length) {
        case 0: shiftX = 0; break;
        case 2: shiftX = height * 0.6; break;
        case 3: shiftX = height; break;
    }
    let x = (294 - shiftX) + "px";

    var color, time, fraction;

    if (state == null) {
        color = "Default";
        time = "—";
        fraction = "";
        x = "294px";
    } else {
        color = state.color;
        time = state.time;
        fraction = state.fraction;
    }

    return (
        <svg className={className} height={height + "px"}>
            <defs>
                <linearGradient id={className + "-text-gradient"} x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop className={getColor(color) + "-top"} offset="0%"></stop>
                    <stop className={getColor(color)} offset="100%"></stop>
                </linearGradient>
            </defs>
            <text className="timer-time" style={{
                "fill": "url(#" + className + "-text-gradient)",
                "font-size": height + "px",
                "font-family": "timer, sans-serif",
            }} x={x} y={y} textAnchor="end">{time}</text>
            <text className="timer-time" style={{
                "fill": "url(#" + className + "-text-gradient)",
                "font-size": (0.7 * height) + "px",
                "font-family": "timer, sans-serif",
            }} x="294px" y={y} textAnchor="end">{fraction}</text>
        </svg>
    );
}

export class Component extends React.Component<Props, undefined> {
    render() {
        return renderToSVG(this.props.state);
    }
}
