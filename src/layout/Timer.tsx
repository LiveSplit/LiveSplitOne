import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import { colorToCss, gradientToCss } from "../util/ColorUtil";

import variables from "../css/variables.scss";
import "../css/Timer.scss";

const sidePadding = parseFloat(variables.sidePadding);

export interface Props {
    state: LiveSplit.TimerComponentStateJson,
    componentId: string,
    layoutWidth: number,
}

export function renderToSVG(
    state: LiveSplit.TimerComponentStateJson,
    className: string,
    componentWidth: number,
): JSX.Element {
    const time = state.time;
    const fraction = state.fraction;
    const height = state.height;

    const y = `${0.82 * height}px`;

    const alignState: { x: string, element: SVGTextElement | null } = {
        x: "",
        element: null,
    };

    const updateAlign = () => {
        alignState.element?.setAttribute("x", alignState.x);
    };

    return (
        <div
            className="timer"
            style={{
                background: gradientToCss(state.background),
            }}
        >
            <svg
                className={className}
                height={`${height}px`}
                style={{
                    display: "block",
                    filter: "drop-shadow(2px 2px 1px rgba(0, 0, 0, 0.5))",
                    width: componentWidth,
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
                <text
                    ref={(instance) => {
                        alignState.element = instance;
                        updateAlign();
                    }}
                    className="timer-time timer-font"
                    style={{
                        fill: `url(#${className}-text-gradient)`,
                        fontSize: `${0.9 * height}px`,
                        fontVariant: "tabular-nums",
                    }}
                    y={y}
                    textAnchor="end"
                >
                    {time}
                </text>
                <text
                    ref={(instance) => {
                        if (instance != null) {
                            alignState.x = `${componentWidth - sidePadding - instance.getComputedTextLength()}px`;
                        }
                        updateAlign();
                    }}
                    className="timer-time timer-font"
                    style={{
                        fill: `url(#${className}-text-gradient)`,
                        fontSize: `${0.6 * height}px`,
                        fontVariant: "tabular-nums",
                    }}
                    x={`${componentWidth - sidePadding}px`}
                    y={y}
                    textAnchor="end"
                >
                    {fraction}
                </text>
            </svg>
        </div>
    );
}

export default class Timer extends React.Component<Props> {
    public render() {
        return renderToSVG(
            this.props.state,
            this.props.componentId,
            this.props.layoutWidth,
        );
    }
}
