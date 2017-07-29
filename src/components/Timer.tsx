import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";

export interface Props { state: LiveSplit.TimerComponentStateJson }

export function renderToSVG(
    state: LiveSplit.TimerComponentStateJson,
    className = "timer",
    height = 60,
): JSX.Element {
    const time = state.time;
    const fraction = state.fraction;
    let shiftX;
    switch (state.fraction.length) {
        case 0: shiftX = 0; break;
        case 2: shiftX = height * 0.6; break;
        case 3: shiftX = height; break;
    }
    const x = (294 - shiftX) + "px";
    const y = (0.88 * height) + "px";

    return (
        <svg
            className={className}
            height={height + "px"}
            style={{
                background: gradientToCss(state.background),
            }}
        >
            <defs>
                <linearGradient id={className + "-text-gradient"} x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop
                        offset="0%"
                        style={{
                            "stop-color": colorToCss(state.top_color),
                        }}
                    />
                    <stop
                        offset="100%"
                        style={{
                            "stop-color": colorToCss(state.bottom_color),
                        }}
                    />
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
