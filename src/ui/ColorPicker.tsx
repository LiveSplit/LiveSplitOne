import * as React from "react";
import { ChromePicker, RGBColor } from "react-color";
import { colorToCss } from "../util/ColorUtil";

export interface Props {
    color: number[],
    setColor: (color: number[]) => void,
}

export interface State {
    display: boolean,
}

export default class ColorPicker extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            display: false,
        };
    }

    public render() {
        return (
            <div>
                <div
                    style={{
                        background: colorToCss(this.props.color),
                        border: "2px solid white",
                        borderCollapse: "collapse",
                        borderRadius: "2px",
                        boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
                        cursor: "pointer",
                        height: "13px",
                    }}
                    onClick={(_) => this.handleClick()}
                />
                <div style={{
                    margin: "0 auto",
                    width: "0",
                }}>
                    {
                        this.state.display &&
                        <div style={{
                            position: "absolute",
                            textShadow: "initial",
                            zIndex: 3,
                        }}>
                            <div
                                style={{
                                    bottom: "0px",
                                    left: "0px",
                                    position: "fixed",
                                    right: "0px",
                                    top: "0px",
                                }}
                                onClick={(_) => this.handleClose()}
                            />
                            <ChromePicker
                                color={toPickerColor(this.props.color)}
                                onChange={(c) => this.props.setColor(toLSColor(c.rgb))}
                            />
                        </div>
                    }
                </div>
            </div>
        );
    }

    private handleClick() {
        this.setState({ display: !this.state.display });
    }

    private handleClose() {
        this.setState({ display: false });
    }
}

function toPickerColor(color: number[]): RGBColor {
    return {
        r: 255 * color[0],
        g: 255 * color[1],
        b: 255 * color[2],
        a: color[3],
    };
}

function toLSColor(color: RGBColor): number[] {
    return [
        color.r / 255,
        color.g / 255,
        color.b / 255,
        color.a !== undefined ? color.a : 1.0,
    ];
}
