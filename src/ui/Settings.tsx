import * as React from "react";
import { Color, SettingsDescriptionJson, SettingsDescriptionValueJson } from "../livesplit";
import { assertNever, expect, Option } from "../util/OptionUtil";
import ColorPicker from "./ColorPicker";

export interface Props<T> {
    setValue: (index: number, value: T) => void,
    state: SettingsDescriptionJson,
    factory: SettingValueFactory<T>,
}

export interface SettingValueFactory<T> {
    fromBool(v: boolean): T;
    fromUint(value: number): T;
    fromInt(value: number): T;
    fromString(value: string): T;
    fromOptionalString(value: string): T;
    fromOptionalEmptyString(): T;
    fromFloat(value: number): T;
    fromAccuracy(value: string): T | null;
    fromDigitsFormat(value: string): T | null;
    fromOptionalTimingMethod(value: string): T | null;
    fromOptionalEmptyTimingMethod(): T;
    fromColor(r: number, g: number, b: number, a: number): T;
    fromOptionalColor(r: number, g: number, b: number, a: number): T;
    fromOptionalEmptyColor(): T;
    fromTransparentGradient(): T;
    fromVerticalGradient(
        r1: number, g1: number, b1: number, a1: number,
        r2: number, g2: number, b2: number, a2: number,
    ): T;
    fromHorizontalGradient(
        r1: number, g1: number, b1: number, a1: number,
        r2: number, g2: number, b2: number, a2: number,
    ): T;
    fromAlternatingGradient(
        r1: number, g1: number, b1: number, a1: number,
        r2: number, g2: number, b2: number, a2: number,
    ): T;
    fromAlignment(value: string): T | null;
}

export class JsonSettingValueFactory {
    public fromBool(v: boolean): SettingsDescriptionValueJson {
        return { Bool: v };
    }
    public fromUint(_: number): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromInt(_: number): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromString(v: string): SettingsDescriptionValueJson {
        return { String: v };
    }
    public fromOptionalString(_: string): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromOptionalEmptyString(): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromFloat(_: number): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromAccuracy(_: string): SettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromDigitsFormat(_: string): SettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromOptionalTimingMethod(_: string): SettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromOptionalEmptyTimingMethod(): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromColor(): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromOptionalColor(): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromOptionalEmptyColor(): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromTransparentGradient(): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromVerticalGradient(): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromHorizontalGradient(): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromAlternatingGradient(): SettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromAlignment(_: string): SettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
}

export class SettingsComponent<T> extends React.Component<Props<T>> {
    public render() {
        const settingsRows: JSX.Element[] = [];
        const { factory } = this.props;

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
                                factory.fromBool(e.target.checked),
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
                                factory.fromUint(e.target.valueAsNumber),
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
                                factory.fromInt(e.target.valueAsNumber),
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
                                factory.fromString(e.target.value),
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
                                    factory.fromOptionalString(""),
                                );
                            } else {
                                this.props.setValue(
                                    valueIndex,
                                    factory.fromOptionalEmptyString(),
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
                                    factory.fromOptionalString(e.target.value),
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
                                factory.fromFloat(e.target.valueAsNumber),
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
                                    factory.fromAccuracy(e.target.value),
                                    "Unexpected Accuracy",
                                ),
                            );
                        }}
                    >
                        <option value="Seconds">Seconds</option>
                        <option value="Tenths">Tenths</option>
                        <option value="Hundredths">Hundredths</option>
                        <option value="Milliseconds">Milliseconds</option>
                    </select>;
            } else if ("DigitsFormat" in value) {
                component =
                    <select
                        value={value.DigitsFormat}
                        onChange={(e) => {
                            this.props.setValue(
                                valueIndex,
                                expect(
                                    factory.fromDigitsFormat(e.target.value),
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
                                factory.fromColor(
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
                                    factory.fromOptionalColor(
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
                                        factory.fromOptionalColor(1.0, 1.0, 1.0, 1.0),
                                    );
                                } else {
                                    this.props.setValue(
                                        valueIndex,
                                        factory.fromOptionalEmptyColor(),
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
                            return factory.fromTransparentGradient();
                        case "Plain":
                            return factory.fromColor(
                                color1[0], color1[1], color1[2], color1[3],
                            );
                        case "Vertical":
                            return factory.fromVerticalGradient(
                                color1[0], color1[1], color1[2], color1[3],
                                color2[0], color2[1], color2[2], color2[3],
                            );
                        case "Horizontal":
                            return factory.fromHorizontalGradient(
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
            } else if ("ListGradient" in value) {
                let type: string;
                let color1: Option<Color> = null;
                let color2: Option<Color> = null;
                const listGradient = value.ListGradient;

                if ("Alternating" in listGradient) {
                    type = Object.keys(listGradient)[0];
                    [color1, color2] = listGradient.Alternating;
                } else {
                    const gradient = listGradient.Same;
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
                            return factory.fromTransparentGradient();
                        case "Plain":
                            return factory.fromColor(
                                color1[0], color1[1], color1[2], color1[3],
                            );
                        case "Vertical":
                            return factory.fromVerticalGradient(
                                color1[0], color1[1], color1[2], color1[3],
                                color2[0], color2[1], color2[2], color2[3],
                            );
                        case "Horizontal":
                            return factory.fromHorizontalGradient(
                                color1[0], color1[1], color1[2], color1[3],
                                color2[0], color2[1], color2[2], color2[3],
                            );
                        case "Alternating":
                            return factory.fromAlternatingGradient(
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
                            <option value="Alternating">Alternating</option>
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
                                        factory.fromOptionalTimingMethod("RealTime"),
                                        "Unexpected Optional Timing Method",
                                    ),
                                );
                            } else {
                                this.props.setValue(
                                    valueIndex,
                                    factory.fromOptionalEmptyTimingMethod(),
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
                                        factory.fromOptionalTimingMethod(e.target.value),
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
                                factory.fromAlignment(e.target.value),
                                "Unexpected Alignment",
                            ),
                        );
                    }}
                >
                    <option value="Auto">Automatic</option>
                    <option value="Left">Left</option>
                    <option value="Center">Center</option>
                </select>;
            } else if ("CustomCombobox" in value) {
                const isError = value.CustomCombobox.mandatory
                    && value.CustomCombobox.value.length === 0;
                component = <select
                    value={value.CustomCombobox.value}
                    onChange={(e) => {
                        this.props.setValue(
                            valueIndex,
                            factory.fromString(e.target.value),
                        );
                    }}
                    style={{
                        border: isError
                            ? "1px solid rgb(255, 0, 0)"
                            : undefined,
                    }}
                >
                    {value.CustomCombobox.list.map((v) => <option value={v}>{v}</option>)}
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
            <table className="table settings-table" >
                <tbody className="table-body">
                    {settingsRows}
                </tbody>
            </table>
        );
    }
}
