import * as React from "react";
import { Option, assertNever, expect } from "../../../util/OptionUtil";
import { Color, LayoutBackground } from "../../../livesplit-core";
import { ColorPicker } from "../ColorPicker";
import { SettingValueFactory } from ".";
import { UrlCache } from "../../../util/UrlCache";
import { toast } from "react-toastify";
import { FILE_EXT_IMAGES, openFileAsArrayBuffer } from "../../../util/FileUtil";

import * as colorPickerClasses from "../../../css/ColorPicker.module.scss";
import * as tableClasses from "../../../css/Table.module.scss";

export function LayoutBackground<T>({
    value,
    setValue,
    factory,
    editorUrlCache,
}: {
    value: LayoutBackground;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    editorUrlCache: UrlCache;
}) {
    let type: string;
    let color1: Option<Color> = null;
    let color2: Option<Color> = null;
    let imageId =
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    let brightness = 100;
    let opacity = 100;
    let blur = 0;

    const children: React.JSX.Element[] = [];

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
                    factory.fromBackgroundImage(
                        imageId,
                        brightness / 100,
                        opacity / 100,
                        blur / 100,
                    ),
                    "Unexpected layout background",
                );
        }
    };

    if (typeof value !== "string") {
        [type] = Object.keys(value);
        if ("Plain" in value) {
            color1 = value.Plain;
        } else if ("Vertical" in value) {
            [color1, color2] = value.Vertical;
        } else if ("Horizontal" in value) {
            [color1, color2] = value.Horizontal;
        } else if ("image" in value) {
            imageId = value.image;
            brightness = 100 * value.brightness;
            opacity = 100 * value.opacity;
            blur = 100 * value.blur;
            type = "Image";
            const imageUrl = editorUrlCache.cache(imageId);
            children.push(
                <div
                    className={colorPickerClasses.colorPickerButton}
                    style={{
                        background: imageUrl
                            ? `url("${imageUrl}") center / cover`
                            : undefined,
                    }}
                    onClick={async (_) => {
                        const maybeFile =
                            await openFileAsArrayBuffer(FILE_EXT_IMAGES);
                        if (maybeFile === undefined) {
                            return;
                        }
                        if (maybeFile instanceof Error) {
                            toast.error(
                                `Failed to read the file: ${maybeFile.message}`,
                            );
                            return;
                        }
                        const [file] = maybeFile;
                        const imageId =
                            editorUrlCache.imageCache.cacheFromArray(
                                new Uint8Array(file),
                                true,
                            );
                        editorUrlCache.cache(imageId);
                        const value = expect(
                            factory.fromBackgroundImage(
                                imageId,
                                brightness / 100,
                                opacity / 100,
                                blur / 100,
                            ),
                            "Unexpected layout background",
                        );
                        setValue(value);
                    }}
                />,
                <div
                    style={{
                        gridTemplateColumns: "max-content 1fr",
                        columnGap: "8px",
                        rowGap: "8px",
                        alignItems: "center",
                        display: "grid",
                        gridColumn: "1 / 3",
                    }}
                >
                    Brightness
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={brightness}
                        onChange={(e) => {
                            brightness = Number(e.target.value);
                            setValue(colorsToValue(type, color1, color2));
                        }}
                    />
                    Opacity
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={opacity}
                        onChange={(e) => {
                            opacity = Number(e.target.value);
                            setValue(colorsToValue(type, color1, color2));
                        }}
                    />
                    Blur
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={blur}
                        onChange={(e) => {
                            blur = Number(e.target.value);
                            setValue(colorsToValue(type, color1, color2));
                        }}
                    />
                </div>,
            );
        } else {
            assertNever(value);
        }
    } else {
        type = value;
    }

    children.splice(
        0,
        0,
        <select
            value={type}
            onChange={(e) => {
                setValue(colorsToValue(e.target.value, color1, color2));
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
                    setValue(colorsToValue(type, color, color2));
                }}
            />,
        );
    }

    if (color2) {
        children.push(
            <ColorPicker
                color={color2}
                setColor={(color) => {
                    setValue(colorsToValue(type, color1, color));
                }}
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
    } else if (color1 || type === "Image") {
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
