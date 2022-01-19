import * as React from "react";
import { Font, FontStretch, FontStyle, FontWeight, LayoutStateJson, LayoutStateRef, SoftwareRenderer } from "../livesplit-core";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import {memory, alloc, dealloc} from "../livesplit-core/livesplit_core_bg.wasm";
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
    stateRef: LayoutStateRef,
    allowResize: boolean,
    width: number,
    onResize(width: number): void,
}

export interface State {
    softwareRenderer: SoftwareRenderer,
    imageDataPtr: number
}

const BITS_PER_PIXEL = 4;

function getBufferSize(width: number, height: number) {
    return width * height * BITS_PER_PIXEL;
}
export default class Layout extends React.Component<Props, State> {
    private canvasRef = React.createRef<HTMLCanvasElement>();

    private height(): number {
        //TODO we need to get the ideal height from the software renderer and return that instead
        // this requires livesplit_core bindgen changes to do. This can't merge until those bindgen changes are made.

        return 600;
    }
    constructor(props: Props) {
        super(props);
        let softwareRenderer = SoftwareRenderer.new()

        let imageDataPtr = alloc(getBufferSize(this.props.width, this.height()));
        
        // force a preliminary render so that later renders can just update
        softwareRenderer.render(this.props.stateRef, imageDataPtr, this.props.width, this.height(), this.props.width, true)

        this.state = {
            softwareRenderer,
            imageDataPtr
        }
    }


    public componentWillUnmount() {
        dealloc(this.state.imageDataPtr, getBufferSize(this.props.width, this.height()));
    }

    private onResize(data: ResizeCallbackData) {
        dealloc(this.state.imageDataPtr, getBufferSize(this.props.width, this.height()));
        this.props.onResize(data.size.width);
        this.setState({
            ...this.state,
            imageDataPtr: alloc(getBufferSize(data.size.width, this.height())),
        })
    }

    public render() {
        const layoutState = getLayoutStateStyle(this.props.state);

        if(this.canvasRef.current) {
            
            console.log(this.state.imageDataPtr)

            this.state.softwareRenderer.render(this.props.stateRef, this.state.imageDataPtr, this.props.width, this.height(), this.props.width, false)
            
            let imageDataArray = new Uint8ClampedArray(memory.buffer, this.state.imageDataPtr, getBufferSize(this.props.width, this.height()));


            const imageData = imageDataArray.length > 0 ? new ImageData(imageDataArray, this.props.width, this.height()) : undefined;


            if(imageData)
                this.canvasRef.current.getContext("2d")?.putImageData(imageData, 0, 0);
        }

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
                            ) => this.onResize(data)
                        }
                        axis="x"
                    />
                }
                <canvas width={this.props.width} height={this.height()} ref={this.canvasRef}></canvas>
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
