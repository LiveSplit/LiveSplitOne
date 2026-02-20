import React, { ChangeEvent, MouseEvent } from "react";
import { useEffect, useState } from "react";
import { Color } from "../../livesplit-core";
import { Pipette } from "lucide-react";

import * as classes from "../../css/ColorPicker.module.css";

const EyeDropper = (window as any).EyeDropper;
const hasEyeDropper = !!EyeDropper;

function colorToCss(color: Color): string {
    const r = Math.round(color[0] * 255);
    const g = Math.round(color[1] * 255);
    const b = Math.round(color[2] * 255);
    const a = color[3];

    return `rgba(${r},${g},${b},${a})`;
}

export function ColorPicker({
    color,
    setColor,
}: {
    color: Color;
    setColor: (color: Color) => void;
}) {
    const [isShowing, setIsShowing] = useState(false);
    return (
        <div>
            <div
                className={classes.colorPickerButton}
                style={{ background: colorToCss(color) }}
                onClick={() => setIsShowing(true)}
            />
            <div className={classes.colorPickerDialogPositioning}>
                {isShowing && (
                    <ColorPickerDialog
                        color={color}
                        setColor={setColor}
                        close={() => setIsShowing(false)}
                    />
                )}
            </div>
        </div>
    );
}

function ColorPickerDialog({
    color,
    setColor,
    close,
}: {
    color: Color;
    setColor: (color: Color) => void;
    close: () => void;
}) {
    return (
        <>
            <div className={classes.overlay} onClick={close} />
            <div className={classes.glassPanel}>
                <GradientSelector color={color} setColor={setColor} />
                <Hr />
                <ControlPanel color={color} setColor={setColor} />
                <Hr />
                <PredefinedColors setColor={setColor} />
            </div>
        </>
    );
}

function Hr() {
    return <hr className={classes.hr} />;
}

function GradientSelector({
    color,
    setColor,
}: {
    color: Color;
    setColor: (color: Color) => void;
}) {
    const [r, g, b, a] = color;
    const [h, s, v] = rgbToHsv(r, g, b);
    const [r1, g1, b1] = hsvToRgb(h, 1, 1);
    const [mouseDown, setMouseDown] = useState(false);

    const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        (document.activeElement as any)?.blur?.();
        setMouseDown(true);
        updateColor(e);
    };

    const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        setMouseDown(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        if (!mouseDown) return;
        updateColor(e);
    };

    const updateColor = (e: MouseEvent) => {
        const pos = e.currentTarget.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - pos.left, 0), 225);
        const y = Math.min(Math.max(e.clientY - pos.top, 0), 125);
        const s = x / 225;
        const v = 1 - y / 125;
        const [r, g, b] = hsvToRgb(h, s, v);
        setColor([r, g, b, a]);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={classes.gradientSelector}
            style={{
                background: `rgb(${255 * r1}, ${255 * g1}, ${255 * b1})`,
                cursor: mouseDown ? "grabbing" : "grab",
            }}
        >
            <div className={classes.whiteGradient}>
                <div
                    className={classes.cursor}
                    style={{
                        transform: `translate(${s * 225 - 6}px, ${
                            125 - v * 125 - 6
                        }px)`,
                    }}
                >
                    <div />
                </div>
                <div className={classes.blackGradient} />
            </div>
        </div>
    );
}

type Mode = "Rgb" | "Hsv" | "Hex";

function nextMode(mode: Mode): Mode {
    return mode === "Rgb" ? "Hsv" : mode === "Hsv" ? "Hex" : "Rgb";
}

function ControlPanel({
    color,
    setColor,
}: {
    color: Color;
    setColor: (color: Color) => void;
}) {
    const [r, g, b, a] = color;
    const [h, s, v] = rgbToHsv(r, g, b);
    const [mode, setMode] = useState<Mode>("Hex");

    const handleHueChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newH = parseFloat(e.target.value);
        const [newR, newG, newB] = hsvToRgb(newH, s, v);
        setColor([newR, newG, newB, a]);
    };

    const handleAlphaChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newA = parseFloat(e.target.value);
        setColor([r, g, b, newA]);
    };

    return (
        <div className={classes.controlPanel}>
            <div className={classes.controlPanelTop}>
                <ColorPreview color={color} setColor={setColor} />
                <div className={classes.sliders}>
                    <div className={classes.hueSlider} title="Hue">
                        <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"
                            value={h}
                            onChange={handleHueChange}
                        />
                    </div>
                    <div className={classes.alphaSlider} title="Alpha">
                        <div className={classes.checker}>
                            <div
                                style={{
                                    height: "18px",
                                    background: `linear-gradient(to right, transparent 0%, rgb(${
                                        255 * r
                                    }, ${255 * g}, ${255 * b}) 100%)`,
                                }}
                            />
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={a}
                            onChange={handleAlphaChange}
                        />
                    </div>
                </div>
            </div>
            <div
                className={classes.controlPanelBottom}
                onClick={() => setMode(nextMode(mode))}
            >
                {mode === "Rgb" ? (
                    <Rgba color={color} setColor={setColor} />
                ) : mode === "Hsv" ? (
                    <Hsva color={color} setColor={setColor} />
                ) : (
                    <Hex color={color} setColor={setColor} />
                )}
            </div>
        </div>
    );
}

function parseHex(hex: string): [number, number, number] | undefined {
    hex = hex.startsWith("#") ? hex.slice(1) : hex;
    const num = parseInt(hex, 16);
    if (isNaN(num)) {
        return;
    }
    if (hex.length === 6) {
        const r = ((num >> 16) & 0xff) / 255;
        const g = ((num >> 8) & 0xff) / 255;
        const b = (num & 0xff) / 255;
        return [r, g, b];
    } else if (hex.length === 3) {
        const r = (((num >> 8) & 0xf) * 0x11) / 255;
        const g = (((num >> 4) & 0xf) * 0x11) / 255;
        const b = ((num & 0xf) * 0x11) / 255;
        return [r, g, b];
    } else {
        return;
    }
}

function ColorPreview({
    color,
    setColor,
}: {
    color: Color;
    setColor: (color: Color) => void;
}) {
    const [r, g, b, a] = color;
    return (
        <>
            {hasEyeDropper && (
                <div style={{ cursor: "pointer" }} title="Eye Dropper">
                    <Pipette
                        size={20}
                        aria-hidden="true"
                        onClick={async () => {
                            try {
                                const eyeDropper = new EyeDropper();
                                const result = await eyeDropper.open();
                                if (result?.sRGBHex) {
                                    const parsed = parseHex(result.sRGBHex);
                                    if (parsed) {
                                        setColor([...parsed, 1]);
                                    }
                                }
                            } catch {}
                        }}
                    />
                </div>
            )}
            <div className={classes.colorPreview} title="Color Preview">
                <div className={classes.checker}>
                    <div
                        className={classes.colorPreviewInner}
                        style={{
                            backgroundColor: `rgba(${255 * r}, ${255 * g}, ${
                                255 * b
                            }, ${a})`,
                        }}
                    />
                </div>
            </div>
        </>
    );
}

function Hsva({
    color,
    setColor,
}: {
    color: Color;
    setColor: (color: Color) => void;
}) {
    const [r, g, b, a] = color;
    const [h, s, v] = rgbToHsv(r, g, b);

    return (
        <>
            <ColorComponent
                title="Hue"
                short="H"
                kind="Degree"
                value={h}
                setValue={(newH) => {
                    const [newR, newG, newB] = hsvToRgb(newH, s, v);
                    setColor([newR, newG, newB, a]);
                }}
            />
            <ColorComponent
                title="Saturation"
                short="S"
                kind="Percent"
                value={s}
                setValue={(newS) => {
                    const [newR, newG, newB] = hsvToRgb(h, newS, v);
                    setColor([newR, newG, newB, a]);
                }}
            />
            <ColorComponent
                title="Value"
                short="V"
                kind="Percent"
                value={v}
                setValue={(newV) => {
                    const [newR, newG, newB] = hsvToRgb(h, s, newV);
                    setColor([newR, newG, newB, a]);
                }}
            />
            <ColorComponent
                title="Alpha"
                short="A"
                kind="Percent"
                value={a}
                setValue={(newA) => {
                    setColor([r, g, b, newA]);
                }}
            />
        </>
    );
}

function Rgba({
    color,
    setColor,
}: {
    color: Color;
    setColor: (color: Color) => void;
}) {
    const [r, g, b, a] = color;

    return (
        <>
            <ColorComponent
                title="Red"
                short="R"
                kind="Byte"
                value={r}
                setValue={(newR) => {
                    setColor([newR, g, b, a]);
                }}
            />
            <ColorComponent
                title="Green"
                short="G"
                kind="Byte"
                value={g}
                setValue={(newG) => {
                    setColor([r, newG, b, a]);
                }}
            />
            <ColorComponent
                title="Blue"
                short="B"
                kind="Byte"
                value={b}
                setValue={(newB) => {
                    setColor([r, g, newB, a]);
                }}
            />
            <ColorComponent
                title="Alpha"
                short="A"
                kind="Percent"
                value={a}
                setValue={(newA) => {
                    setColor([r, g, b, newA]);
                }}
            />
        </>
    );
}

function Hex({
    color,
    setColor,
}: {
    color: Color;
    setColor: (color: Color) => void;
}) {
    const [r, g, b, a] = color;

    return (
        <>
            <div className={classes.colorInput} title="Hexadecimal">
                <FormattedInput
                    value={color}
                    format={([r, g, b, _]) =>
                        `#${Math.round(255 * r)
                            .toString(16)
                            .padStart(2, "0")}${Math.round(255 * g)
                            .toString(16)
                            .padStart(2, "0")}${Math.round(255 * b)
                            .toString(16)
                            .padStart(2, "0")}`.toUpperCase()
                    }
                    parse={(value) => {
                        const parsed = parseHex(value);
                        if (parsed) {
                            return [...parsed, a];
                        }
                        return undefined;
                    }}
                    setValue={setColor}
                />
                HEX
            </div>
            <ColorComponent
                title="Alpha"
                short="A"
                kind="Percent"
                value={a}
                setValue={(newA) => {
                    setColor([r, g, b, newA]);
                }}
            />
        </>
    );
}

function FormattedInput<T>({
    value,
    format,
    parse,
    setValue,
}: {
    value: T;
    format: (value: T) => string;
    parse: (value: string) => T | undefined;
    setValue: (value: T) => void;
}) {
    const [formatted, setFormatted] = useState(() => format(value));
    const [isValid, setIsValid] = useState(true);

    useEffect(() => {
        const oldValue = parse(formatted);
        if (oldValue === undefined || format(oldValue) !== format(value)) {
            setFormatted(format(value));
            setIsValid(true);
        }
    }, [value]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const formatted = e.target.value;
        setFormatted(formatted);
        const newValue = parse(formatted);
        const isValid = newValue !== undefined;
        setIsValid(isValid);
        if (isValid) {
            setValue(newValue);
        }
    };

    return (
        <input
            style={{
                color: isValid ? "" : "#F33",
            }}
            onClick={(e) => e.stopPropagation()}
            value={formatted}
            onChange={handleInputChange}
            onBlur={() => {
                setFormatted(format(value));
                setIsValid(true);
            }}
        />
    );
}

type Format = "Degree" | "Percent" | "Byte";

function ColorComponent({
    title,
    short,
    kind,
    value,
    setValue,
}: {
    title: string;
    short: string;
    kind: Format;
    value: number;
    setValue: (value: number) => void;
}) {
    return (
        <div className={classes.colorInput} title={title}>
            <FormattedInput
                value={value}
                format={(value) =>
                    kind === "Degree"
                        ? `${value.toFixed(0)}°`
                        : kind === "Percent"
                          ? `${(100 * value).toFixed(0)}%`
                          : `${(255 * value).toFixed(0)}`
                }
                parse={(value) => {
                    const newValue = parseFloat(value.replace(/[^0-9.]/g, ""));
                    const max =
                        kind === "Degree"
                            ? 360
                            : kind === "Percent"
                              ? 100
                              : 255;
                    const scale =
                        kind === "Degree"
                            ? 1
                            : kind === "Percent"
                              ? 0.01
                              : 1 / 255;
                    if (newValue < 0 || newValue > max || isNaN(newValue))
                        return undefined;
                    return newValue * scale;
                }}
                setValue={setValue}
            />
            {short}
        </div>
    );
}

function PredefinedColors({ setColor }: { setColor: (color: Color) => void }) {
    const predefinedColors = [
        [
            ["Red", 244, 67, 54],
            ["Pink", 233, 30, 99],
            ["Purple", 156, 39, 176],
            ["Deep Purple", 103, 58, 183],
            ["Indigo", 63, 81, 181],
            ["Blue", 33, 150, 243],
            ["Light Blue", 3, 169, 244],
        ],
        [
            ["Cyan", 0, 188, 212],
            ["Teal", 0, 150, 136],
            ["Green", 76, 175, 80],
            ["Light Green", 139, 195, 74],
            ["Lime", 205, 220, 57],
            ["Yellow", 255, 235, 59],
            ["Amber", 255, 193, 7],
        ],
        [
            ["Orange", 255, 152, 0],
            ["Deep Orange", 255, 87, 34],
            ["Brown", 121, 85, 72],
            ["Grey", 158, 158, 158],
            ["Blue Grey", 96, 125, 139],
            ["Black", 0, 0, 0],
            ["White", 255, 255, 255],
        ],
    ] as unknown as [[[string, number, number, number]]];

    return (
        <div className={classes.predefinedColors}>
            {predefinedColors.map((hsv, index) => (
                <div key={index} className={classes.predefinedColorsRow}>
                    {hsv.map((color, i) => (
                        <PredefinedColor
                            key={i}
                            color={color}
                            setColor={setColor}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

function PredefinedColor({
    color: [title, r, g, b],
    setColor,
}: {
    color: [string, number, number, number];
    setColor: (color: Color) => void;
}) {
    return (
        <button
            className={classes.predefinedColor}
            style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
            onClick={() => setColor([r / 255, g / 255, b / 255, 1])}
            title={title}
        />
    );
}

function hsvToRgb(h: number, s: number, v: number) {
    const xDivC = 1 - Math.abs(((h / 60) % 2) - 1);

    const [rc, rx, gc, gx, bc, bx] =
        h < 60
            ? [1, 0, 0, 1, 0, 0]
            : h < 120
              ? [0, 1, 1, 0, 0, 0]
              : h < 180
                ? [0, 0, 1, 0, 0, 1]
                : h < 240
                  ? [0, 0, 0, 1, 1, 0]
                  : h < 300
                    ? [0, 1, 0, 0, 1, 0]
                    : [1, 0, 0, 0, 0, 1];

    const c = v * s;
    const x = xDivC * c;
    const m = v - c;

    const r = rc * c + rx * x + m;
    const g = gc * c + gx * x + m;
    const b = bc * c + bx * x + m;

    return [r, g, b];
}

function rgbToHsv(r: number, g: number, b: number) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    const h =
        delta == 0
            ? 0
            : max == r
              ? 60 * (((g - b) / delta) % 6) + (g < b ? 360 : 0)
              : max == g
                ? 60 * ((b - r) / delta + 2)
                : 60 * ((r - g) / delta + 4);

    const s = max == 0 ? 0 : delta / max;
    const v = max;

    return [h, s, v];
}
