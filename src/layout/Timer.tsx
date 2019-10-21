import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";

import "../css/Timer.scss";

export interface Props {
    state: LiveSplit.TimerComponentStateJson,
    componentId: string,
}

export function renderToSVG(
    state: LiveSplit.TimerComponentStateJson,
    className: string,
): JSX.Element {
    const time = state.time;
    const fraction = state.fraction;
    const height = state.height;

    let shiftX;
    switch (state.fraction.length) {
        case 0: shiftX = 0; break;
        case 2: shiftX = height * 0.6; break;
        case 3: shiftX = height; break;
        case 4: shiftX = height / 0.71; break;
        default: throw new Error("Unexpected Fraction Length");
    }
    const x = `${294 - 0.85 * shiftX}px`;
    const y = `${0.82 * height}px`;

    return (
        <svg
            className={className}
            height={`${height}px`}
            style={{
                display: "block",
                background: gradientToCss(state.background),
            }}
        >
            <defs>
                <linearGradient id={`${className}-text-gradient`} x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop
                        offset="0%"
                        style={{
                            stopColor: colorToCss(state.top_color),
                        }}
                    />
                    <stop
                        offset="100%"
                        style={{
                            stopColor: colorToCss(state.bottom_color),
                        }}
                    />
                </linearGradient>
            </defs>
            <text className="timer-time" style={{
                fill: `url(#${className}-text-gradient)`,
                fontFamily: "timer, sans-serif",
                fontSize: `${0.9 * height}px`,
            }} x={x} y={y} textAnchor="end">{time}</text>
            <text className="timer-time" style={{
                fill: `url(#${className}-text-gradient)`,
                fontFamily: "timer, sans-serif",
                fontSize: `${0.6 * height}px`,
            }} x="294px" y={y} textAnchor="end">{fraction}</text>
        </svg>
    );
}

export default class Timer extends React.Component<Props> {
    public render() {
        return renderToSVG(this.props.state, this.props.componentId);
    }
}
