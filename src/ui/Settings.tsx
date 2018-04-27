import * as React from "react";
import { Color, SettingsDescriptionJson, SettingValue } from "../livesplit";
import { assertNever, expect, Option } from "../util/OptionUtil";
import ColorPicker from "./ColorPicker";

export interface Props {
    setValue: (index: number, value: SettingValue) => void,
    state: SettingsDescriptionJson,
}

export default class SettingsComponent extends React.Component<Props> {
    public render() {
        const settingsRows: JSX.Element[] = [];

        this.props.state.fields.forEach((field, valueIndex) => {
            const { value } = field;
            let component;
            if ("Bool" in value) {
                component =
                    <input
                        type="checkbox"
                        checked={value.Bool}
                        onChange={(e) => {
                            this.props.setValue(
                                valueIndex,
                                SettingValue.fromBool(e.target.checked),
                            );
                        }}
                    />;
            } else if ("UInt" in value) {
                component =
                    <input
                        type="number"
                        className="number"
                        value={value.UInt}
                        min="0"
                        onChange={(e) => {
                            this.props.setValue(
                                valueIndex,
                                SettingValue.fromUint(e.target.valueAsNumber),
                            );
                        }}
                    />;
            } else if ("Int" in value) {
                component =
                    <input
                        type="number"
                        className="number"
                        value={value.Int}
                        onChange={(e) => {
                            this.props.setValue(
                                valueIndex,
                                SettingValue.fromInt(e.target.valueAsNumber),
                            );
                        }}
                    />;
            } else if ("String" in value) {
                component =
                    <input
                        value={value.String}
                        onChange={(e) => {
                            this.props.setValue(
                                valueIndex,
                                SettingValue.fromString(e.target.value),
                            );
                        }}
                    />;
            } else if ("OptionalString" in value) {
                const children = [
                    <input
                        type="checkbox"
                        checked={value.OptionalString != null}
                        onChange={(e) => {
                            if (e.target.checked) {
                                this.props.setValue(
                                    valueIndex,
                                    SettingValue.fromOptionalString(""),
                                );
                            } else {
                                this.props.setValue(
                                    valueIndex,
                                    SettingValue.fromOptionalEmptyString(),
                                );
                            }
                        }}
                    />,
                ];

                if (value.OptionalString != null) {
                    children.push(
                        <input
                            value={value.OptionalString}
                            disabled={value.OptionalString == null}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    SettingValue.fromOptionalString(e.target.value),
                                );
                            }}
                        />,
                    );
                }

                component =
                    <span>
                        {children}
                    </span>;
            } else if ("Float" in value) {
                component =
                    <input
                        type="number"
                        value={value.Float}
                        className="number"
                        onChange={(e) => {
                            this.props.setValue(
                                valueIndex,
                                SettingValue.fromFloat(e.target.valueAsNumber),
                            );
                        }}
                    />;
            } else if ("Accuracy" in value) {
                component =
                    <select
                        value={value.Accuracy}
                        onChange={(e) => {
                            this.props.setValue(
                                valueIndex,
                                expect(
                                    SettingValue.fromAccuracy(e.target.value),
                                    "Unexpected Accuracy",
                                ),
                            );
                        }}
                    >
                        <option value="Seconds">Seconds</option>
                        <option value="Tenths">Tenths</option>
                        <option value="Hundredths">Hundredths</option>
                    </select>;
            } else if ("DigitsFormat" in value) {
                component =
                    <select
                        value={value.DigitsFormat}
                        onChange={(e) => {
                            this.props.setValue(
                                valueIndex,
                                expect(
                                    SettingValue.fromDigitsFormat(e.target.value),
                                    "Unexpected Digits Format",
                                ),
                            );
                        }}
                    >
                        <option value="SingleDigitSeconds">1</option>
                        <option value="DoubleDigitSeconds">01</option>
                        <option value="SingleDigitMinutes">0:01</option>
                        <option value="DoubleDigitMinutes">00:01</option>
                        <option value="SingleDigitHours">0:00:01</option>
                        <option value="DoubleDigitHours">00:00:01</option>
                    </select>;
            } else if ("Color" in value) {
                component =
                    <ColorPicker
                        color={value.Color}
                        setColor={(color) => {
                            this.props.setValue(
                                valueIndex,
                                SettingValue.fromColor(
                                    color[0],
                                    color[1],
                                    color[2],
                                    color[3],
                                ),
                            );
                        }}
                    />;
            } else if ("OptionalColor" in value) {
                const children = [];

                if (value.OptionalColor != null) {
                    children.push(
                        <ColorPicker
                            color={value.OptionalColor}
                            setColor={(color) => {
                                this.props.setValue(
                                    valueIndex,
                                    SettingValue.fromOptionalColor(
                                        color[0],
                                        color[1],
                                        color[2],
                                        color[3],
                                    ),
                                );
                            }}
                        />,
                    );
                }

                component =
                    <span>
                        <input
                            type="checkbox"
                            checked={value.OptionalColor != null}
                            style={{
                                float: "left",
                            }}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    this.props.setValue(
                                        valueIndex,
                                        SettingValue.fromOptionalColor(1.0, 1.0, 1.0, 1.0),
                                    );
                                } else {
                                    this.props.setValue(
                                        valueIndex,
                                        SettingValue.fromOptionalEmptyColor(),
                                    );
                                }
                            }}
                        />
                        <div style={{
                            overflow: "hidden",
                        }}>
                            {children}
                        </div>
                    </span>;
            } else if ("Gradient" in value) {
                let type: string;
                let color1: Option<Color> = null;
                let color2: Option<Color> = null;
                const gradient = value.Gradient;

                if (gradient !== "Transparent") {
                    type = Object.keys(gradient)[0];
                    if ("Plain" in gradient) {
                        color1 = gradient.Plain;
                    } else if ("Vertical" in gradient) {
                        [color1, color2] = gradient.Vertical;
                    } else if ("Horizontal" in gradient) {
                        [color1, color2] = gradient.Horizontal;
                    } else {
                        assertNever(gradient);
                    }
                } else {
                    type = "Transparent";
                }

                const colorsToValue = (
                    type: string,
                    color1: Option<Color>,
                    color2: Option<Color>,
                ) => {
                    color1 = color1 ? color1 : [0.0, 0.0, 0.0, 0.0];
                    color2 = color2 ? color2 : color1;
                    switch (type) {
                        case "Transparent":
                            return SettingValue.fromTransparentGradient();
                        case "Plain":
                            return SettingValue.fromColor(
                                color1[0], color1[1], color1[2], color1[3],
                            );
                        case "Vertical":
                            return SettingValue.fromVerticalGradient(
                                color1[0], color1[1], color1[2], color1[3],
                                color2[0], color2[1], color2[2], color2[3],
                            );
                        case "Horizontal":
                            return SettingValue.fromHorizontalGradient(
                                color1[0], color1[1], color1[2], color1[3],
                                color2[0], color2[1], color2[2], color2[3],
                            );
                        default:
                            throw new Error("Unexpected Gradient Type");
                    }
                };

                const inputWidth = !color1 && !color2 ? "100%" : undefined;
                const colorWidth = color1 && color2 ? "50%" : "100%";

                const children: JSX.Element[] = [
                    <td>
                        <select
                            value={type}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    colorsToValue(e.target.value, color1, color2),
                                );
                            }}
                            style={{ width: inputWidth }}
                        >
                            <option value="Transparent">Transparent</option>
                            <option value="Plain">Plain</option>
                            <option value="Vertical">Vertical</option>
                            <option value="Horizontal">Horizontal</option>
                        </select>
                    </td>,
                ];

                if (color1) {
                    children.push(
                        <td style={{ width: colorWidth }}>
                            <ColorPicker
                                color={color1}
                                setColor={(color) => {
                                    this.props.setValue(
                                        valueIndex,
                                        colorsToValue(type, color, color2),
                                    );
                                }}
                            />
                        </td>,
                    );
                }

                if (color2) {
                    children.push(
                        <td style={{ width: colorWidth }}>
                            <ColorPicker
                                color={color2}
                                setColor={(color) => {
                                    this.props.setValue(
                                        valueIndex,
                                        colorsToValue(type, color1, color),
                                    );
                                }}
                            />
                        </td>,
                    );
                }

                component =
                    <table style={{ width: "100%" }}>
                        <tbody>
                            <tr>
                                {children}
                            </tr>
                        </tbody>
                    </table>;
            } else if ("OptionalTimingMethod" in value) {
                const children = [
                    <input
                        type="checkbox"
                        checked={value.OptionalTimingMethod != null}
                        onChange={(e) => {
                            if (e.target.checked) {
                                this.props.setValue(
                                    valueIndex,
                                    expect(
                                        SettingValue.fromOptionalTimingMethod("RealTime"),
                                        "Unexpected Optional Timing Method",
                                    ),
                                );
                            } else {
                                this.props.setValue(
                                    valueIndex,
                                    SettingValue.fromOptionalEmptyTimingMethod(),
                                );
                            }
                        }}
                    />,
                ];

                if (value.OptionalTimingMethod != null) {
                    children.push(
                        <select
                            value={value.OptionalTimingMethod}
                            disabled={value.OptionalTimingMethod == null}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    expect(
                                        SettingValue.fromOptionalTimingMethod(e.target.value),
                                        "Unexpected Optional Timing Method",
                                    ),
                                );
                            }}
                        >
                            <option value="RealTime">Real Time</option>
                            <option value="GameTime">Game Time</option>
                        </select>,
                    );
                }

                component =
                    <span>
                        {children}
                    </span>;
            } else if ("Alignment" in value) {
                component = <select
                    value={value.Alignment}
                    onChange={(e) => {
                        this.props.setValue(
                            valueIndex,
                            expect(
                                SettingValue.fromAlignment(e.target.value),
                                "Unexpected Alignment",
                            ),
                        );
                    }}
                >
                    <option value="Auto">Automatic</option>
                    <option value="Left">Left</option>
                    <option value="Center">Center</option>
                </select>;
            } else {
                assertNever(value);
            }

            settingsRows.push(
                <tr>
                    <td>{field.text}</td>
                    <td>{component}</td>
                </tr>,
            );
        });

        return (
            <table className="component-settings table" >
                <tbody className="table-body">
                    {settingsRows}
                </tbody>
            </table>
        );
    }
}
