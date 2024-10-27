import * as React from "react";
import { Color, SettingsDescriptionValueJson } from "../livesplit-core";
import { assertNever, expect, Option } from "../util/OptionUtil";
import ColorPicker from "./ColorPicker";
import HotkeyButton from "./HotkeyButton";
import ToggleCheckbox from "./ToggleCheckbox";
import { UrlCache } from "../util/UrlCache";
import { FILE_EXT_IMAGES, openFileAsArrayBuffer } from "../util/FileUtil";
import * as FontList from "../util/FontList";
import { LiveSplitServer } from "../api/LiveSplitServer";
import { showDialog } from "./Dialog";
import { toast } from "react-toastify";

import "../css/Tooltip.scss";
import "../css/LiveSplitServerButton.scss";

export interface Props<T> {
    context: string,
    setValue: (index: number, value: T) => void,
    state: ExtendedSettingsDescriptionJson,
    factory: SettingValueFactory<T>,
    editorUrlCache: UrlCache,
    allComparisons: string[],
    allVariables: Set<string>,
}

export interface ExtendedSettingsDescriptionJson {
    fields: ExtendedSettingsDescriptionFieldJson[],
}

export interface ExtendedSettingsDescriptionFieldJson {
    text: string | JSX.Element,
    tooltip: string | JSX.Element,
    value: ExtendedSettingsDescriptionValueJson,
}

export type ExtendedSettingsDescriptionValueJson =
    SettingsDescriptionValueJson |
    { RemovableString: string | null } |
    {
        ServerConnection: {
            url: string | undefined,
            connection: Option<LiveSplitServer>,
        }
    };

export interface SettingValueFactory<T> {
    fromBool(v: boolean): T;
    fromUint(value: number): T;
    fromInt(value: number): T;
    fromString(value: string): T;
    fromOptionalString(value: string): T;
    fromOptionalEmptyString(): T;
    fromRemovableString?(value: string): T;
    fromRemovableEmptyString?(): T;
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
    fromColumnKind(value: string): T | null;
    fromColumnStartWith(value: string): T | null;
    fromColumnUpdateWith(value: string): T | null;
    fromColumnUpdateTrigger(value: string): T | null;
    fromLayoutDirection(value: string): T | null;
    fromFont(name: string, style: string, weight: string, stretch: string): T | null;
    fromEmptyFont(): T;
    fromDeltaGradient(value: string): T | null;
    fromBackgroundImage(
        imageId: string,
        brightness: number,
        opacity: number,
        blur: number,
    ): T | null;
}

export class JsonSettingValueFactory implements SettingValueFactory<ExtendedSettingsDescriptionValueJson> {
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
    public fromColumnKind(_: string): ExtendedSettingsDescriptionValueJson | null {
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
    public fromFont(
        _name: string,
        _style: string,
        _weight: string,
        _stretch: string,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromEmptyFont(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromDeltaGradient(_: string): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromBackgroundImage(
        _imageId: string,
        _brightness: number,
        _opacity: number,
        _blur: number,
    ): ExtendedSettingsDescriptionValueJson | null {
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
                // FIXME: This is a hack that we need for now until the way
                // settings are represented is refactored.
                if (typeof (field.text) === "string" && /^Variable/.test(field.text)) {
                    if (this.props.allVariables.size === 0) {
                        component = <div className="settings-value-box">
                            <span className="tooltip" style={{ textAlign: "center" }} >
                                No variables available
                                <span className="tooltip-text">
                                    Custom variables can be defined in the Variables tab when
                                    editing splits. Additional custom variables can be provided
                                    automatically by auto splitters.
                                </span>
                            </span>
                        </div>;
                    } else {
                        component = <div className="settings-value-box">
                            <select
                                value={value.String ?? ""}
                                onChange={(e) => {
                                    this.props.setValue(
                                        valueIndex,
                                        factory.fromString(e.target.value),
                                    );
                                }}
                            >
                                <option value="" />
                                {Array.from(this.props.allVariables).map((variable) =>
                                    <option>{variable}</option>
                                )}
                            </select>
                        </div>;
                    }
                } else {
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
                }
            } else if ("OptionalString" in value) {
                // FIXME: This is a hack that we need for now until the way
                // settings are represented is refactored.
                if (typeof (field.text) === "string" && /^Comparison( \d)?$/.test(field.text)) {
                    component = <div className="settings-value-box">
                        <select
                            value={value.OptionalString ?? ""}
                            onChange={(e) => {
                                if (e.target.value !== "") {
                                    this.props.setValue(
                                        valueIndex,
                                        factory.fromOptionalString(e.target.value),
                                    );
                                } else {
                                    this.props.setValue(
                                        valueIndex,
                                        factory.fromOptionalEmptyString(),
                                    );
                                }
                            }}
                        >
                            <option value="">Current Comparison</option>
                            {this.props.allComparisons.map((comparison) =>
                                <option>{comparison}</option>
                            )}
                        </select>
                    </div>;
                } else {
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
                }
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
            } else if ("ColumnKind" in value) {
                component = (
                    <div className="settings-value-box">
                        <select
                            value={value.ColumnKind}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    expect(
                                        factory.fromColumnKind(e.target.value),
                                        "Unexpected Column Kind value",
                                    ),
                                );
                            }}
                        >
                            <option value="Time">Time</option>
                            <option value="Variable">Variable</option>
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
                            <option value="DontUpdate">Don't Update</option>
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
            } else if ("Font" in value) {
                const children = [
                    <ToggleCheckbox
                        value={value.Font !== null}
                        setValue={(value) => {
                            if (value) {
                                this.props.setValue(
                                    valueIndex,
                                    expect(
                                        factory.fromFont("", "normal", "normal", "normal"),
                                        "Unexpected Font",
                                    ),
                                );
                            } else {
                                this.props.setValue(
                                    valueIndex,
                                    factory.fromEmptyFont(),
                                );
                            }
                        }}
                    />,
                ];

                if (value.Font !== null) {
                    FontList.load(() => this.setState({}));

                    const { family, style, weight, stretch } = value.Font;

                    const styles = FontList.knownStyles.get(family);

                    if (FontList.knownFamilies.length > 0) {
                        children.push(
                            <select
                                style={{
                                    fontFamily: family,
                                }}
                                value={family}
                                onChange={(e) => {
                                    this.props.setValue(
                                        valueIndex,
                                        expect(
                                            factory.fromFont(e.target.value, style, weight, stretch),
                                            "Unexpected Font",
                                        ),
                                    );
                                }}
                            >
                                <option value=""></option>
                                {
                                    FontList.knownFamilies.map((n) =>
                                        <option value={n} style={{ fontFamily: n }}>{n}</option>
                                    )
                                }
                            </select>
                        );
                    } else {
                        children.push(
                            <input
                                value={family}
                                onChange={(e) => {
                                    this.props.setValue(
                                        valueIndex,
                                        expect(
                                            factory.fromFont(e.target.value, style, weight, stretch),
                                            "Unexpected Font",
                                        ),
                                    );
                                }}
                            />
                        );
                    }

                    children.push(
                        <>Style</>,
                        <select
                            value={style}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    expect(
                                        factory.fromFont(family, e.target.value, weight, stretch),
                                        "Unexpected Font",
                                    ),
                                );
                            }}
                        >
                            <option value="normal">Normal</option>
                            <option value="italic">Italic</option>
                        </select>,
                        <>Weight</>,
                        <select
                            value={weight}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    expect(
                                        factory.fromFont(family, style, e.target.value, stretch),
                                        "Unexpected Font",
                                    ),
                                );
                            }}
                        >
                            {
                                FontList.FONT_WEIGHTS.map(([_, value, name]) => (
                                    <option style={{
                                        color: styles?.has(value) ? "white" : "grey"
                                    }} value={value}>{name}</option>
                                ))
                            }
                        </select>,
                        <>Stretch</>,
                        <select
                            value={stretch}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    expect(
                                        factory.fromFont(family, style, weight, e.target.value),
                                        "Unexpected Font",
                                    ),
                                );
                            }}
                        >
                            {
                                FontList.FONT_STRETCHES.map(([_, value, name]) => (
                                    <option style={{
                                        color: styles?.has(value) ? "white" : "grey"
                                    }} value={value}>{name}</option>
                                ))
                            }
                        </select>,
                    );
                }

                component = (
                    <div className="settings-value-box optional-value">
                        {children}
                    </div>
                );
            } else if ("DeltaGradient" in value) {
                let type: string;
                let color1: Option<Color> = null;
                let color2: Option<Color> = null;
                const gradient = value.DeltaGradient;

                if (typeof gradient !== "string") {
                    [type] = Object.keys(gradient);
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
                    type = gradient;
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
                            return expect(
                                factory.fromDeltaGradient(type),
                                "Unexpected Gradient Type",
                            );
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
                        <option value="DeltaPlain">Plain Delta</option>
                        <option value="DeltaVertical">Vertical Delta</option>
                        <option value="DeltaHorizontal">Horizontal Delta</option>
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
            } else if ("LayoutBackground" in value) {
                let type: string;
                let color1: Option<Color> = null;
                let color2: Option<Color> = null;
                let imageId = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
                let brightness = 100;
                let opacity = 100;
                let blur = 0;
                const gradient = value.LayoutBackground;

                const children: JSX.Element[] = [];

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
                            return expect(
                                factory.fromBackgroundImage(imageId, brightness / 100, opacity / 100, blur / 100),
                                "Unexpected layout background",
                            );
                    }
                };

                if (typeof gradient !== "string") {
                    [type] = Object.keys(gradient);
                    if ("Plain" in gradient) {
                        color1 = gradient.Plain;
                    } else if ("Vertical" in gradient) {
                        [color1, color2] = gradient.Vertical;
                    } else if ("Horizontal" in gradient) {
                        [color1, color2] = gradient.Horizontal;
                    } else if ("image" in gradient) {
                        imageId = gradient.image;
                        brightness = 100 * gradient.brightness;
                        opacity = 100 * gradient.opacity;
                        blur = 100 * gradient.blur;
                        type = "Image";
                        const imageUrl = this.props.editorUrlCache.cache(imageId);
                        children.push(
                            <div
                                className="color-picker-button"
                                style={{
                                    background: imageUrl ? `url("${imageUrl}") center / cover` : undefined,
                                }}
                                onClick={async (_) => {
                                    const maybeFile = await openFileAsArrayBuffer(FILE_EXT_IMAGES);
                                    if (maybeFile === undefined) {
                                        return;
                                    }
                                    if (maybeFile instanceof Error) {
                                        toast.error(`Failed to read the file: ${maybeFile.message}`);
                                        return;
                                    }
                                    const [file] = maybeFile;
                                    const imageId = this.props.editorUrlCache.imageCache.cacheFromArray(
                                        new Uint8Array(file),
                                        true,
                                    );
                                    this.props.editorUrlCache.cache(imageId);
                                    const value = expect(
                                        factory.fromBackgroundImage(imageId, brightness / 100, opacity / 100, blur / 100),
                                        "Unexpected layout background",
                                    );
                                    this.props.setValue(valueIndex, value);
                                }}
                            />,
                            <div style={{
                                gridTemplateColumns: "max-content 1fr",
                                columnGap: "8px",
                                rowGap: "8px",
                                alignItems: "center",
                                display: "grid",
                                gridColumn: "1 / 3",
                            }}>
                                Brightness
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={brightness}
                                    onChange={(e) => {
                                        brightness = Number(e.target.value);
                                        this.props.setValue(
                                            valueIndex,
                                            colorsToValue(type, color1, color2),
                                        );
                                    }}
                                />
                                Opacity
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={opacity}
                                    onChange={(e) => {
                                        opacity = Number(e.target.value);
                                        this.props.setValue(
                                            valueIndex,
                                            colorsToValue(type, color1, color2),
                                        );
                                    }}
                                />
                                Blur
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={blur}
                                    onChange={(e) => {
                                        blur = Number(e.target.value);
                                        this.props.setValue(
                                            valueIndex,
                                            colorsToValue(type, color1, color2),
                                        );
                                    }}
                                />
                            </div>
                        );
                    } else {
                        assertNever(gradient);
                    }
                } else {
                    type = gradient;
                }

                children.splice(0, 0,
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
                        <option value="Image">Image</option>
                    </select>,
                );

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
                } else if (color1 || type === "Image") {
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
            } else if ("ServerConnection" in value) {
                component = <div className="settings-value-box">
                    <button className="livesplit-server-button" onClick={(_) => this.connectToServerOrDisconnect(valueIndex, value.ServerConnection.url, value.ServerConnection.connection)}>
                        {
                            (() => {
                                const connectionState = value.ServerConnection.connection?.getConnectionState() ?? WebSocket.CLOSED;
                                switch (connectionState) {
                                    case WebSocket.OPEN:
                                        return <div>Disconnect</div>;
                                    case WebSocket.CLOSED:
                                        return <div>Connect</div>;
                                    case WebSocket.CONNECTING:
                                        return <div>Connecting...</div>;
                                    case WebSocket.CLOSING:
                                        return <div>Disconnecting...</div>;
                                    default: throw new Error("Unknown WebSocket State");
                                }
                            })()
                        }
                    </button>
                </div>;
            } else {
                assertNever(value);
            }

            settingsRows.push(
                <tr key={`${this.props.context}$${valueIndex}`}>
                    <td className="tooltip">
                        {field.text}
                        <span className="tooltip-text">{field.tooltip}</span>
                    </td>
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

    private async connectToServerOrDisconnect(valueIndex: number, serverUrl: string | undefined, connection: Option<LiveSplitServer>) {
        if (connection) {
            connection.close();
            return;
        }
        const [result, url] = await showDialog({
            title: "Connect to Server",
            description: "Specify the WebSocket URL:",
            textInput: true,
            defaultText: serverUrl,
            buttons: ["Connect", "Cancel"],
        });
        if (result !== 0) {
            return;
        }
        this.props.setValue(valueIndex, this.props.factory.fromString(url));
    }
}
