import * as React from "react";
import {
    Color,
    DeltaGradient,
    Gradient,
    Language,
    ListGradient,
} from "../../../livesplit-core";
import { SettingValueFactory } from ".";
import { assertNever, expect, Option } from "../../../util/OptionUtil";
import { ColorPicker } from "../ColorPicker";
import { Label, resolve } from "../../../localization";

import * as tableClasses from "../../../css/Table.module.scss";

export function Gradient<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: Gradient;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    lang: Language | undefined;
}) {
    let type: string | undefined;
    let color1: Color | undefined;
    let color2: Color | undefined;

    if (value !== "Transparent") {
        type = Object.keys(value)[0];
        if ("Plain" in value) {
            color1 = value.Plain;
        } else if ("Vertical" in value) {
            [color1, color2] = value.Vertical;
        } else if ("Horizontal" in value) {
            [color1, color2] = value.Horizontal;
        } else {
            assertNever(value);
        }
    } else {
        type = "Transparent";
    }

    const colorsToValue = (
        type: string,
        color1: Option<Color>,
        color2: Option<Color>,
    ) => {
        color1 = color1 ?? [0, 0, 0, 0];
        color2 = color2 ?? color1;
        switch (type) {
            case "Transparent":
                return factory.fromTransparentGradient();
            case "Plain":
                return factory.fromColor(
                    color1[0],
                    color1[1],
                    color1[2],
                    color1[3],
                );
            case "Vertical":
                return factory.fromVerticalGradient(
                    color1[0],
                    color1[1],
                    color1[2],
                    color1[3],
                    color2[0],
                    color2[1],
                    color2[2],
                    color2[3],
                );
            case "Horizontal":
                return factory.fromHorizontalGradient(
                    color1[0],
                    color1[1],
                    color1[2],
                    color1[3],
                    color2[0],
                    color2[1],
                    color2[2],
                    color2[3],
                );
            default:
                throw new Error("Unexpected Gradient Type");
        }
    };

    const children: React.JSX.Element[] = [
        <select
            value={type}
            onChange={(e) =>
                setValue(colorsToValue(e.target.value, color1, color2))
            }
        >
            <option value="Transparent">
                {resolve(Label.GradientTransparent, lang)}
            </option>
            <option value="Plain">{resolve(Label.GradientPlain, lang)}</option>
            <option value="Vertical">
                {resolve(Label.GradientVertical, lang)}
            </option>
            <option value="Horizontal">
                {resolve(Label.GradientHorizontal, lang)}
            </option>
        </select>,
    ];

    if (color1) {
        children.push(
            <ColorPicker
                color={color1}
                setColor={(color) =>
                    setValue(colorsToValue(type, color, color2))
                }
            />,
        );
    }

    if (color2) {
        children.push(
            <ColorPicker
                color={color2}
                setColor={(color) =>
                    setValue(colorsToValue(type, color1, color))
                }
            />,
        );
    }

    if (color2) {
        return (
            <div
                className={`${tableClasses.settingsValueBox} ${tableClasses.twoColors}`}
            >
                {children}
            </div>
        );
    } else if (color1) {
        return (
            <div
                className={`${tableClasses.settingsValueBox} ${tableClasses.oneColor}`}
            >
                {children}
            </div>
        );
    } else {
        return <div className={tableClasses.settingsValueBox}>{children}</div>;
    }
}
export function DeltaGradient<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: DeltaGradient;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    lang: Language | undefined;
}) {
    let type: string | undefined;
    let color1: Color | undefined;
    let color2: Color | undefined;

    if (typeof value !== "string") {
        [type] = Object.keys(value);
        if ("Plain" in value) {
            color1 = value.Plain;
        } else if ("Vertical" in value) {
            [color1, color2] = value.Vertical;
        } else if ("Horizontal" in value) {
            [color1, color2] = value.Horizontal;
        } else {
            assertNever(value);
        }
    } else {
        type = value;
    }

    const colorsToValue = (
        type: string,
        color1: Option<Color>,
        color2: Option<Color>,
    ) => {
        color1 = color1 ?? [0, 0, 0, 0];
        color2 = color2 ?? color1;
        switch (type) {
            case "Transparent":
                return factory.fromTransparentGradient();
            case "Plain":
                return factory.fromColor(
                    color1[0],
                    color1[1],
                    color1[2],
                    color1[3],
                );
            case "Vertical":
                return factory.fromVerticalGradient(
                    color1[0],
                    color1[1],
                    color1[2],
                    color1[3],
                    color2[0],
                    color2[1],
                    color2[2],
                    color2[3],
                );
            case "Horizontal":
                return factory.fromHorizontalGradient(
                    color1[0],
                    color1[1],
                    color1[2],
                    color1[3],
                    color2[0],
                    color2[1],
                    color2[2],
                    color2[3],
                );
            default:
                return expect(
                    factory.fromDeltaGradient(type),
                    "Unexpected Gradient Type",
                    lang,
                );
        }
    };

    const children: React.JSX.Element[] = [
        <select
            value={type}
            onChange={(e) =>
                setValue(colorsToValue(e.target.value, color1, color2))
            }
        >
            <option value="Transparent">
                {resolve(Label.GradientTransparent, lang)}
            </option>
            <option value="Plain">{resolve(Label.GradientPlain, lang)}</option>
            <option value="Vertical">
                {resolve(Label.GradientVertical, lang)}
            </option>
            <option value="Horizontal">
                {resolve(Label.GradientHorizontal, lang)}
            </option>
            <option value="DeltaPlain">
                {resolve(Label.GradientPlainDelta, lang)}
            </option>
            <option value="DeltaVertical">
                {resolve(Label.GradientVerticalDelta, lang)}
            </option>
            <option value="DeltaHorizontal">
                {resolve(Label.GradientHorizontalDelta, lang)}
            </option>
        </select>,
    ];

    if (color1) {
        children.push(
            <ColorPicker
                color={color1}
                setColor={(color) =>
                    setValue(colorsToValue(type, color, color2))
                }
            />,
        );
    }

    if (color2) {
        children.push(
            <ColorPicker
                color={color2}
                setColor={(color) =>
                    setValue(colorsToValue(type, color1, color))
                }
            />,
        );
    }

    if (color2) {
        return (
            <div
                className={`${tableClasses.settingsValueBox} ${tableClasses.twoColors}`}
            >
                {children}
            </div>
        );
    } else if (color1) {
        return (
            <div
                className={`${tableClasses.settingsValueBox} ${tableClasses.oneColor}`}
            >
                {children}
            </div>
        );
    } else {
        return <div className={tableClasses.settingsValueBox}>{children}</div>;
    }
}

export function ListGradient<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: ListGradient;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    lang: Language | undefined;
}) {
    let type: string | undefined;
    let color1: Color | undefined;
    let color2: Color | undefined;

    if ("Alternating" in value) {
        type = Object.keys(value)[0];
        [color1, color2] = value.Alternating;
    } else {
        const gradient = value.Same;
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
        color1 = color1 ?? [0, 0, 0, 0];
        color2 = color2 ?? color1;
        switch (type) {
            case "Transparent":
                return factory.fromTransparentGradient();
            case "Plain":
                return factory.fromColor(
                    color1[0],
                    color1[1],
                    color1[2],
                    color1[3],
                );
            case "Vertical":
                return factory.fromVerticalGradient(
                    color1[0],
                    color1[1],
                    color1[2],
                    color1[3],
                    color2[0],
                    color2[1],
                    color2[2],
                    color2[3],
                );
            case "Horizontal":
                return factory.fromHorizontalGradient(
                    color1[0],
                    color1[1],
                    color1[2],
                    color1[3],
                    color2[0],
                    color2[1],
                    color2[2],
                    color2[3],
                );
            case "Alternating":
                return factory.fromAlternatingGradient(
                    color1[0],
                    color1[1],
                    color1[2],
                    color1[3],
                    color2[0],
                    color2[1],
                    color2[2],
                    color2[3],
                );
            default:
                throw new Error("Unexpected Gradient Type");
        }
    };

    const children: React.JSX.Element[] = [
        <select
            value={type}
            onChange={(e) =>
                setValue(colorsToValue(e.target.value, color1, color2))
            }
        >
            <option value="Transparent">
                {resolve(Label.GradientTransparent, lang)}
            </option>
            <option value="Plain">{resolve(Label.GradientPlain, lang)}</option>
            <option value="Vertical">
                {resolve(Label.GradientVertical, lang)}
            </option>
            <option value="Horizontal">
                {resolve(Label.GradientHorizontal, lang)}
            </option>
            <option value="Alternating">
                {resolve(Label.GradientAlternating, lang)}
            </option>
        </select>,
    ];

    if (color1) {
        children.push(
            <ColorPicker
                color={color1}
                setColor={(color) =>
                    setValue(colorsToValue(type, color, color2))
                }
            />,
        );
    }

    if (color2) {
        children.push(
            <ColorPicker
                color={color2}
                setColor={(color) =>
                    setValue(colorsToValue(type, color1, color))
                }
            />,
        );
    }

    if (color2) {
        return (
            <div
                className={`${tableClasses.settingsValueBox} ${tableClasses.twoColors}`}
            >
                {children}
            </div>
        );
    } else if (color1) {
        return (
            <div
                className={`${tableClasses.settingsValueBox} ${tableClasses.oneColor}`}
            >
                {children}
            </div>
        );
    } else {
        return <div className={tableClasses.settingsValueBox}>{children}</div>;
    }
}
