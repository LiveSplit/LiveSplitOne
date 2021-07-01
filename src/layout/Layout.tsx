import * as React from "react";
import { Font, FontStretch, FontStyle, FontWeight, LayoutStateJson } from "../livesplit-core";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import Component from "./Component";
import { ResizableBox, ResizeCallbackData } from "react-resizable";

import "../css/Layout.scss";

interface LayoutStateStyle {
    "--thin-separators-color": string,
    "--separators-color": string,

    "--timer-font-family"?: string,
    "--timer-font-style"?: FontStyle,
    "--timer-font-weight"?: string | number,
    "--timer-font-stretch"?: FontStretch,

    "--times-font-family"?: string,
    "--times-font-style"?: FontStyle,
    "--times-font-weight"?: string | number,
    "--times-font-stretch"?: FontStretch,

    "--text-font-family"?: string,
    "--text-font-style"?: FontStyle,
    "--text-font-weight"?: string | number,
    "--text-font-stretch"?: FontStretch,
}

export interface Props {
    state: LayoutStateJson,
    allowResize: boolean,
    width: number,
    onResize(width: number): void,
}

export default class Layout extends React.Component<Props> {
    public render() {
        const layoutState = getLayoutStateStyle(this.props.state);
        const counts = new Map<string, number>();

        return (
            <div
                className="layout"
                style={{
                    background: gradientToCss(this.props.state.background),
                    color: colorToCss(this.props.state.text_color),
                    width: this.props.width,
                    ...layoutState
                }}
            >
                {this.props.allowResize &&
                    <ResizableBox
                        className="resizable-layout"
                        width={this.props.width}
                        minConstraints={[160, 0]}
                        height={0}
                        handle={<span onClick={(event: React.SyntheticEvent) => { event.stopPropagation(); }} className="resizable-handle" />}
                        onResize={
                            (
                                _event: React.SyntheticEvent,
                                data: ResizeCallbackData,
                            ) => this.props.onResize(data.size.width)
                        }
                        axis="x"
                    />
                }
                {
                    this.props.state.components.map((c) => {
                        const componentType = Object.keys(c)[0];
                        const id = counts.get(componentType) || 0;
                        counts.set(componentType, id + 1);

                        const key = `${componentType}${id}`;

                        return <Component
                            key={key}
                            state={c}
                            componentId={key}
                            layoutWidth={this.props.width}
                        />;
                    })
                }
            </div>
        );
    }
}

export function getLayoutStateStyle(state: LayoutStateJson): LayoutStateStyle {
    const style = {
        "--thin-separators-color": colorToCss(state.thin_separators_color),
        "--separators-color": colorToCss(state.separators_color),
        "--times-font-weight": "bold",
    };

    fillFont(style, "timer", state.timer_font, "timer, sans-serif");
    fillFont(style, "times", state.times_font, "fira, sans-serif");
    fillFont(style, "text", state.text_font, "fira, sans-serif");

    return style;
}

function fillFont(style: any, prefix: string, font: Font | null, defaultName: string) {
    if (font == null) {
        style[`--${prefix}-font-family`] = defaultName;
        return;
    }
    style[`--${prefix}-font-family`] = `"${font.family}", ${defaultName}`;
    style[`--${prefix}-font-style`] = font.style;
    style[`--${prefix}-font-weight`] = translateWeight(font.weight);
    style[`--${prefix}-font-stretch`] = font.stretch;
}

function translateWeight(weight: FontWeight): string | number {
    switch (weight) {
        case "bold":
        case "normal": return weight;
        case "thin": return 100;
        case "extra-light": return 200;
        case "light": return 300;
        case "semi-light": return 350;
        case "normal": return 400;
        case "medium": return 500;
        case "semi-bold": return 600;
        case "bold": return 700;
        case "extra-bold": return 800;
        case "black": return 900;
        case "extra-black": return 950;
    }
}
