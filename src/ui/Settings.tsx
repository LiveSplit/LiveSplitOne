import * as React from "react";
import { Color, SettingsDescriptionValueJson } from "../livesplit-core";
import { assertNever, expect, Option } from "../util/OptionUtil";
import ColorPicker from "./ColorPicker";

import HotkeyButton from "./HotkeyButton";
import ToggleCheckbox from "./ToggleCheckbox";

export interface Props<T> {
    setValue: (index: number, value: T) => void,
    state: ExtendedSettingsDescriptionJson,
    factory: SettingValueFactory<T>,
}

export interface ExtendedSettingsDescriptionJson {
    fields: ExtendedSettingsDescriptionFieldJson[],
}

export interface ExtendedSettingsDescriptionFieldJson {
    text: string,
    value: ExtendedSettingsDescriptionValueJson,
}

export type ExtendedSettingsDescriptionValueJson =
    SettingsDescriptionValueJson |
    { RemovableString: string | null };

export interface SettingValueFactory<T> {
    fromBool(v: boolean): T;
    fromUint(value: number): T;
    fromInt(value: number): T;
    fromString(value: string): T;
    fromOptionalString(value: string): T;
    fromOptionalEmptyString(): T;
    fromRemovableString?(value: string): T;
    fromRemovableEmptyString?(): T;
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
    fromColumnStartWith(value: string): T | null;
    fromColumnUpdateWith(value: string): T | null;
    fromColumnUpdateTrigger(value: string): T | null;
    fromLayoutDirection(value: string): T | null;
}

export class JsonSettingValueFactory {
    public fromBool(v: boolean): ExtendedSettingsDescriptionValueJson {
        return { Bool: v };
    }
    public fromUint(_: number): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromInt(_: number): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromString(v: string): ExtendedSettingsDescriptionValueJson {
        return { String: v };
    }
    public fromOptionalString(_: string): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromOptionalEmptyString(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromRemovableString(v: string): ExtendedSettingsDescriptionValueJson {
        return { RemovableString: v };
    }
    public fromRemovableEmptyString(): ExtendedSettingsDescriptionValueJson {
        return { RemovableString: null };
    }
    public fromFloat(_: number): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromAccuracy(_: string): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromDigitsFormat(_: string): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromOptionalTimingMethod(_: string): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromOptionalEmptyTimingMethod(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromColor(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromOptionalColor(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromOptionalEmptyColor(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromTransparentGradient(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromVerticalGradient(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromHorizontalGradient(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromAlternatingGradient(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromAlignment(_: string): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromColumnStartWith(_: string): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromColumnUpdateWith(_: string): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromColumnUpdateTrigger(_: string): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromLayoutDirection(_: string): ExtendedSettingsDescriptionValueJson | null {
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
                component = (
                    <div className="settings-value-box">
                        <ToggleCheckbox
                            value={value.Bool}
                            setValue={(value) => {
                                this.props.setValue(
                                    valueIndex,
                                    factory.fromBool(value)
                                );
                            }}
                        />
                    </div>
                );
            } else if ("UInt" in value) {
                component = (
                    <div className="settings-value-box">
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
                        />
                    </div>
                );
            } else if ("Int" in value) {
                component = (
                    <div className="settings-value-box">
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
                        />
                    </div>
                );
            } else if ("String" in value) {
                component = (
                    <div className="settings-value-box">
                        <input
                            value={value.String}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    factory.fromString(e.target.value),
                                );
                            }}
                        />
                    </div>
                );
            } else if ("OptionalString" in value) {
                const children = [
                    <ToggleCheckbox
                        value={value.OptionalString !== null}
                        setValue={(value) => {
                            if (value) {
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

                if (value.OptionalString !== null) {
                    children.push(
                        <input
                            value={value.OptionalString}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    factory.fromOptionalString(e.target.value),
                                );
                            }}
                        />,
                    );
                }

                component = (
                    <div className="settings-value-box optional-value">
                        {children}
                    </div>
                );
            } else if ("RemovableString" in value) {
                component = (
                    <div className="settings-value-box removable-string">
                        <input
                            value={value.RemovableString || ""}
                            onChange={(e) => {
                                if (factory.fromRemovableString) {
                                    this.props.setValue(
                                        valueIndex,
                                        factory.fromRemovableString(e.target.value),
                                    );
                                } else {
                                    throw Error("Method is not implemented");
                                }
                            }}
                        />
                        <button
                            onClick={() => {
                                if (factory.fromRemovableEmptyString) {
                                    this.props.setValue(
                                        valueIndex,
                                        factory.fromRemovableEmptyString(),
                                    );
                                } else {
                                    throw Error("Method is not implemented");
                                }
                            }}
                        >
                            <i className="fa fa-trash" aria-hidden="true" />
                        </button>
                    </div>
                );
            } else if ("Float" in value) {
                component = (
                    <div className="settings-value-box">
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
                        />
                    </div>
                );
            } else if ("Accuracy" in value) {
                component = (
                    <div className="settings-value-box">
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
                        </select>
                    </div>
                );
            } else if ("DigitsFormat" in value) {
                component = (
                    <div className="settings-value-box">
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
                        </select>
                    </div>
                );
            } else if ("Color" in value) {
                component = (
                    <div className="settings-value-box">
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
                        />
                    </div>
                );
            } else if ("OptionalColor" in value) {
                const children = [];

                if (value.OptionalColor !== null) {
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

                component = (
                    <div className="settings-value-box optional-value">
                        <ToggleCheckbox
                            value={value.OptionalColor !== null}
                            setValue={(value) => {
                                if (value) {
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
                        {children}
                    </div>
                );
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

                const children: JSX.Element[] = [
                    <select
                        value={type}
                        onChange={(e) => {
                            this.props.setValue(
                                valueIndex,
                                colorsToValue(e.target.value, color1, color2),
                            );
                        }}
                    >
                        <option value="Transparent">Transparent</option>
                        <option value="Plain">Plain</option>
                        <option value="Vertical">Vertical</option>
                        <option value="Horizontal">Horizontal</option>
                    </select>,
                ];

                if (color1) {
                    children.push(
                        <ColorPicker
                            color={color1}
                            setColor={(color) => {
                                this.props.setValue(
                                    valueIndex,
                                    colorsToValue(type, color, color2),
                                );
                            }}
                        />,
                    );
                }

                if (color2) {
                    children.push(
                        <ColorPicker
                            color={color2}
                            setColor={(color) => {
                                this.props.setValue(
                                    valueIndex,
                                    colorsToValue(type, color1, color),
                                );
                            }}
                        />,
                    );
                }

                if (color2) {
                    component = (
                        <div className="settings-value-box two-colors">
                            {children}
                        </div>
                    );
                } else if (color1) {
                    component = (
                        <div className="settings-value-box one-color">
                            {children}
                        </div>
                    );
                } else {
                    component = (
                        <div className="settings-value-box">
                            {children}
                        </div>
                    );
                }
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

                const children: JSX.Element[] = [
                    <select
                        value={type}
                        onChange={(e) => {
                            this.props.setValue(
                                valueIndex,
                                colorsToValue(e.target.value, color1, color2),
                            );
                        }}
                    >
                        <option value="Transparent">Transparent</option>
                        <option value="Plain">Plain</option>
                        <option value="Vertical">Vertical</option>
                        <option value="Horizontal">Horizontal</option>
                        <option value="Alternating">Alternating</option>
                    </select>,
                ];

                if (color1) {
                    children.push(
                        <ColorPicker
                            color={color1}
                            setColor={(color) => {
                                this.props.setValue(
                                    valueIndex,
                                    colorsToValue(type, color, color2),
                                );
                            }}
                        />,
                    );
                }

                if (color2) {
                    children.push(
                        <ColorPicker
                            color={color2}
                            setColor={(color) => {
                                this.props.setValue(
                                    valueIndex,
                                    colorsToValue(type, color1, color),
                                );
                            }}
                        />,
                    );
                }

                if (color2) {
                    component = (
                        <div className="settings-value-box two-colors">
                            {children}
                        </div>
                    );
                } else if (color1) {
                    component = (
                        <div className="settings-value-box one-color">
                            {children}
                        </div>
                    );
                } else {
                    component = (
                        <div className="settings-value-box">
                            {children}
                        </div>
                    );
                }
            } else if ("OptionalTimingMethod" in value) {
                const children = [
                    <ToggleCheckbox
                        value={value.OptionalTimingMethod !== null}
                        setValue={(value) => {
                            if (value) {
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

                if (value.OptionalTimingMethod !== null) {
                    children.push(
                        <select
                            value={value.OptionalTimingMethod}
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

                component = (
                    <div className="settings-value-box optional-value">
                        {children}
                    </div>
                );
            } else if ("Alignment" in value) {
                component = (
                    <div className="settings-value-box">
                        <select
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
                        </select>
                    </div>
                );
            } else if ("ColumnStartWith" in value) {
                component = (
                    <div className="settings-value-box">
                        <select
                            value={value.ColumnStartWith}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    expect(
                                        factory.fromColumnStartWith(e.target.value),
                                        "Unexpected Column Start With value",
                                    ),
                                );
                            }}
                        >
                            <option value="Empty">Empty</option>
                            <option value="ComparisonTime">Comparison Time</option>
                            <option value="ComparisonSegmentTime">Comparison Segment Time</option>
                            <option value="PossibleTimeSave">Possible Time Save</option>
                        </select>
                    </div>
                );
            } else if ("ColumnUpdateWith" in value) {
                component = (
                    <div className="settings-value-box">
                        <select
                            value={value.ColumnUpdateWith}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    expect(
                                        factory.fromColumnUpdateWith(e.target.value),
                                        "Unexpected Column Update With value",
                                    ),
                                );
                            }}
                        >
                            <option value="DontUpdate">Dont Update</option>
                            <option value="SplitTime">Split Time</option>
                            <option value="Delta">Time Ahead / Behind</option>
                            <option value="DeltaWithFallback">Time Ahead / Behind or Split Time If Empty</option>
                            <option value="SegmentTime">Segment Time</option>
                            <option value="SegmentDelta">Time Saved / Lost</option>
                            <option value="SegmentDeltaWithFallback">Time Saved / Lost or Segment Time If Empty</option>
                        </select>
                    </div>
                );
            } else if ("ColumnUpdateTrigger" in value) {
                component = (
                    <div className="settings-value-box">
                        <select
                            value={value.ColumnUpdateTrigger}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    expect(
                                        factory.fromColumnUpdateTrigger(e.target.value),
                                        "Unexpected Column Update Trigger value",
                                    ),
                                );
                            }}
                        >
                            <option value="OnStartingSegment">On Starting Segment</option>
                            <option value="Contextual">Contextual</option>
                            <option value="OnEndingSegment">On Ending Segment</option>
                        </select>
                    </div>
                );
            } else if ("CustomCombobox" in value) {
                const isError = value.CustomCombobox.mandatory
                    && !value.CustomCombobox.value;
                component = (
                    <div className="settings-value-box">
                        <select
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
                        </select>
                    </div>
                );
            } else if ("Hotkey" in value) {
                component = (
                    <div className="settings-value-box">
                        <HotkeyButton
                            value={value.Hotkey}
                            setValue={(value) => {
                                if (value != null) {
                                    this.props.setValue(
                                        valueIndex,
                                        factory.fromOptionalString(value),
                                    );
                                } else {
                                    this.props.setValue(
                                        valueIndex,
                                        factory.fromOptionalEmptyString(),
                                    );
                                }
                            }}
                        />
                    </div>
                );
            } else if ("LayoutDirection" in value) {
                component = (
                    <div className="settings-value-box">
                        <select
                            value={value.LayoutDirection}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    expect(
                                        factory.fromLayoutDirection(e.target.value),
                                        "Unexpected Layout Direction",
                                    ),
                                );
                            }}
                        >
                            <option value="Vertical">Vertical</option>
                            <option value="Horizontal">Horizontal</option>
                        </select>
                    </div>
                );
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
