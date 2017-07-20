import * as React from 'react';
import { ChromePicker, RGBColor } from 'react-color';
import { colorToCss } from '../util/ColorUtil';

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

    handleClick() {
        this.setState({ display: !this.state.display });
    }

    handleClose() {
        this.setState({ display: false });
    }

    render() {
        return (
            <div>
                <div
                    style={{
                        height: '14px',
                        borderRadius: '2px',
                        boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
                        background: colorToCss(this.props.color),
                        cursor: 'pointer',
                        border: '2px solid white',
                        borderCollapse: 'collapse',
                    }}
                    onClick={(e) => this.handleClick()}
                />
                {
                    this.state.display ?
                        <div style={{
                            position: 'absolute',
                            zIndex: 2,
                            textShadow: 'initial',
                        }}>
                            <div
                                style={{
                                    position: 'fixed',
                                    top: '0px',
                                    right: '0px',
                                    bottom: '0px',
                                    left: '0px',
                                }}
                                onClick={(e) => this.handleClose()}
                            />
                            <ChromePicker
                                color={toPickerColor(this.props.color)}
                                onChange={(c) => this.props.setColor(toLSColor(c.rgb))}
                            />
                        </div> : null
                }
            </div>
        );
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
    return [color.r / 255, color.g / 255, color.b / 255, color.a];
}
