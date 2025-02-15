import * as React from "react";
import { useEffect, useState } from "react";
import { colorToCss } from "../util/ColorUtil";
import { Color } from "../livesplit-core";

import "../css/ColorPicker.scss";

const EyeDropper = (window as any).EyeDropper;
const hasEyeDropper = !!EyeDropper;

export default function ColorPicker({ color, setColor }: { color: Color, setColor: (color: Color) => void }) {
    const [isShowing, setIsShowing] = useState(false);
    return (
        <div>
            <div
                className="color-picker-button"
                style={{ background: colorToCss(color) }}
                onClick={() => setIsShowing(true)}
            />
            <div style={{
                margin: "0 auto",
                width: "0",
            }}>
                {isShowing && <ColorPickerDialog color={color} setColor={setColor} close={() => setIsShowing(false)} />}
            </div>
        </div>
    );
}

function ColorPickerDialog({ color, setColor, close }: { color: Color, setColor: (color: Color) => void, close: () => void }) {
    return (
        <div style={{ margin: "0 auto", width: 0 }} className="color-picker">
            <div className="overlay" onClick={() => close()}></div>
            <div
                className="blur"
                style={{
                    zIndex: 1,
                    position: "absolute",
                    marginTop: "5px",
                    marginLeft: "-113.5px",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    boxShadow: "0 5px 10px 0px rgba(28, 28, 28, 0.8)",
                }}
            >
                <GradientSelector color={color} setColor={setColor} />
                <Hr />
                <ControlPanel color={color} setColor={setColor} />
                <Hr />
                <PredefinedColors setColor={setColor} />
            </div>
        </div>
    );
}

function Hr() {
    return (
        <hr
            style={{
                margin: 0,
                height: "1px",
                borderWidth: "0px",
                background: "rgba(255, 255, 255, 0.25)",
            }}
        />
    );
}

function GradientSelector({ color, setColor }: { color: Color, setColor: (color: Color) => void }) {
    const [r, g, b, a] = color;
    const [h, s, v] = rgbToHsv(r, g, b);
    const [r1, g1, b1] = hsvToRgb(h, 1.0, 1.0);
    const [mouseDown, setMouseDown] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        (document.activeElement as any)?.blur();
        setMouseDown(true);
        updateColor(e);
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        e.preventDefault();
        setMouseDown(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!mouseDown) return;
        updateColor(e);
    };

    const updateColor = (e: React.MouseEvent) => {
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
            style={{
                background: `rgb(${255 * r1}, ${255 * g1}, ${255 * b1})`,
                overflow: "hidden",
                position: "relative",
                cursor: mouseDown ? "grabbing" : "grab",
            }}
        >
            <div style={{ background: "linear-gradient(to right, white, transparent)" }}>
                <div
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        transform: `translate(${s * 225 - 6}px, ${125 - v * 125 - 6}px)`,
                        width: "12px",
                        height: "12px",
                        borderRadius: "6px",
                        boxShadow: "black 0 0 0 2px inset",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "6px",
                            boxShadow: "white 0 0 0 1px inset",
                        }}
                    />
                </div>
                <div
                    style={{
                        width: "225px",
                        height: "125px",
                        background: "linear-gradient(to top, black, transparent)",
                    }}
                />
            </div>
        </div>
    );
}

type Mode = "Rgb" | "Hsv" | "Hex";

function nextMode(mode: Mode): Mode {
    return mode === "Rgb" ? "Hsv" : mode === "Hsv" ? "Hex" : "Rgb";
}

function ControlPanel({ color, setColor }: { color: Color, setColor: (color: Color) => void }) {
    const [r, g, b, a] = color;
    const [h, s, v] = rgbToHsv(r, g, b);
    const [mode, setMode] = useState<Mode>("Hex");

    const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newH = parseFloat(e.target.value);
        const [newR, newG, newB] = hsvToRgb(newH, s, v);
        setColor([newR, newG, newB, a]);
    };

    const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newA = parseFloat(e.target.value);
        setColor([r, g, b, newA]);
    };

    return (
        <div style={{ margin: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <ColorPreview color={color} setColor={setColor} />
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div
                        style={{
                            background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
                            height: "18px",
                            position: "relative",
                            borderRadius: "9px",
                        }}
                        title="Hue"
                    >
                        <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"
                            value={h}
                            onChange={handleHueChange}
                            style={{
                                margin: 0,
                                background: "none",
                                height: "16px",
                                position: "absolute",
                                top: "1px",
                                left: "1px",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            background: "white",
                            borderRadius: "9px",
                            overflow: "hidden",
                            height: "18px",
                            position: "relative",
                        }}
                        title="Alpha"
                    >
                        <div className="checker">
                            <div
                                style={{
                                    height: "18px",
                                    background: `linear-gradient(to right, transparent 0%, rgb(${255 * r}, ${255 * g}, ${255 * b}) 100%)`,
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
                            style={{
                                margin: 0,
                                background: "none",
                                height: "16px",
                                position: "absolute",
                                top: "1px",
                                left: "1px",
                            }}
                        />
                    </div>
                </div>
            </div>
            <div
                style={{ display: "flex", gap: "10px", cursor: "ew-resize" }}
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
        const r = ((num >> 16) & 0xFF) / 255;
        const g = ((num >> 8) & 0xFF) / 255;
        const b = (num & 0xFF) / 255;
        return [r, g, b];
    } else if (hex.length === 3) {
        const r = ((num >> 8) & 0xF) * 0x11 / 255;
        const g = ((num >> 4) & 0xF) * 0x11 / 255;
        const b = (num & 0xF) * 0x11 / 255;
        return [r, g, b];
    } else {
        return;
    }
}

function ColorPreview({ color, setColor }: { color: Color, setColor: (color: Color) => void }) {
    const [r, g, b, a] = color;
    return (
        <>
            {hasEyeDropper && (
                <i
                    style={{ cursor: "pointer" }}
                    title="Eye Dropper"
                    className="fa fa-eye-dropper"
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
                        } catch { }
                    }}
                />
            )}
            <div
                style={{
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "50%",
                    background: "white",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div className="checker">
                    <div
                        style={{
                            width: "35px",
                            height: "35px",
                            backgroundColor: `rgba(${255 * r}, ${255 * g}, ${255 * b}, ${a})`,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    />
                </div>
            </div>
        </>
    );
}

function Hsva({ color, setColor }: { color: Color, setColor: (color: Color) => void }) {
    const [r, g, b, a] = color;
    const [h, s, v] = rgbToHsv(r, g, b);

    return (
        <>
            <ColorComponent
                title="Hue"
                short="H"
                kind="Degree"
                value={h}
                setValue={(newH: number) => {
                    const [newR, newG, newB] = hsvToRgb(newH, s, v);
                    setColor([newR, newG, newB, a]);
                }}
            />
            <ColorComponent
                title="Saturation"
                short="S"
                kind="Percent"
                value={s}
                setValue={(newS: number) => {
                    const [newR, newG, newB] = hsvToRgb(h, newS, v);
                    setColor([newR, newG, newB, a]);
                }}
            />
            <ColorComponent
                title="Value"
                short="V"
                kind="Percent"
                value={v}
                setValue={(newV: number) => {
                    const [newR, newG, newB] = hsvToRgb(h, s, newV);
                    setColor([newR, newG, newB, a]);
                }}
            />
            <ColorComponent
                title="Alpha"
                short="A"
                kind="Percent"
                value={a}
                setValue={(newA: number) => {
                    setColor([r, g, b, newA]);
                }}
            />
        </>
    );
}

function Rgba({ color, setColor }: { color: Color, setColor: (color: Color) => void }) {
    const [r, g, b, a] = color;

    return (
        <>
            <ColorComponent
                title="Red"
                short="R"
                kind="Byte"
                value={r}
                setValue={(newR: number) => {
                    setColor([newR, g, b, a]);
                }}
            />
            <ColorComponent
                title="Green"
                short="G"
                kind="Byte"
                value={g}
                setValue={(newG: number) => {
                    setColor([r, newG, b, a]);
                }}
            />
            <ColorComponent
                title="Blue"
                short="B"
                kind="Byte"
                value={b}
                setValue={(newB: number) => {
                    setColor([r, g, newB, a]);
                }}
            />
            <ColorComponent
                title="Alpha"
                short="A"
                kind="Percent"
                value={a}
                setValue={(newA: number) => {
                    setColor([r, g, b, newA]);
                }}
            />
        </>
    );
}

function Hex({ color, setColor }: { color: Color, setColor: (color: Color) => void }) {
    const [r, g, b, a] = color;

    return (
        <>
            <div className="color-input" title="Hexadecimal">
                <FormattedInput
                    value={color}
                    format={([r, g, b, _]: Color) => `#${Math.round(255 * r).toString(16).padStart(2, '0')}${Math.round(255 * g).toString(16).padStart(2, '0')}${Math.round(255 * b).toString(16).padStart(2, '0')}`.toUpperCase()}
                    parse={(value: string) => {
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
                setValue={(newA: number) => {
                    setColor([r, g, b, newA]);
                }}
            />
        </>
    );
}

function FormattedInput<T>({ value, format, parse, setValue }: {
    value: T,
    format: (value: T) => string,
    parse: (value: string) => T | undefined,
    setValue: (value: T) => void,
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                setFormatted(format(value))
                setIsValid(true);
            }}
        />
    )
}

type Format = "Degree" | "Percent" | "Byte";

function ColorComponent({ title, short, kind, value, setValue }: { title: string, short: string, kind: Format, value: number, setValue: (value: number) => void }) {
    return (
        <div className="color-input" title={title}>
            <FormattedInput
                value={value}
                format={(value) => kind === "Degree" ? `${value.toFixed(0)}°` : kind === "Percent" ? `${(100 * value).toFixed(0)}%` : `${(255 * value).toFixed(0)}`}
                parse={(value) => {
                    const newValue = parseFloat(value.replace(/[^0-9.]/g, ''));
                    const max = kind === "Degree" ? 360 : kind === "Percent" ? 100 : 255;
                    const scale = kind === "Degree" ? 1 : kind === "Percent" ? 0.01 : 1 / 255;
                    if (newValue < 0 || newValue > max || isNaN(newValue)) return undefined;
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
            [4.0, 0.79, 0.96],
            [340.0, 0.86, 0.91],
            [291.0, 0.78, 0.69],
            [262.0, 0.68, 0.71],
            [231.0, 0.65, 0.71],
            [207.0, 0.87, 0.95],
            [199.0, 0.99, 0.95],
        ],
        [
            [187.0, 1.0, 0.84],
            [174.0, 1.0, 0.58],
            [122.0, 0.56, 0.68],
            [88.0, 0.61, 0.77],
            [66.0, 0.75, 0.86],
            [54.0, 0.76, 1.0],
            [45.0, 0.98, 1.0],
        ],
        [
            [36.0, 1.0, 1.0],
            [14.0, 0.86, 1.0],
            [16.0, 0.40, 0.48],
            [0.0, 0.0, 0.62],
            [200.0, 0.31, 0.54],
            [0.0, 0.0, 0.0],
            [0.0, 0.0, 1.0],
        ],
    ] as unknown as [[[number, number, number]]];

    return (
        <div style={{ margin: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {predefinedColors.map((hsv, index) => (
                <div key={index} style={{ display: "flex", justifyContent: "space-between" }}>
                    {hsv.map((color, i) => (
                        <PredefinedColor key={i} hsv={color} setColor={setColor} />
                    ))}
                </div>
            ))}
        </div>
    );
}

function PredefinedColor({ hsv, setColor }: { hsv: [number, number, number], setColor: (color: Color) => void }) {
    const [h, s, v] = hsv;
    const [r, g, b] = hsvToRgb(h, s, v);

    return (
        <button
            className="predefined-color"
            style={{ backgroundColor: `rgb(${255 * r}, ${255 * g}, ${255 * b})` }}
            onClick={() => setColor([r, g, b, 1.0])}
        />
    );
}

function hsvToRgb(h: number, s: number, v: number) {
    const RECIP_60 = 1 / 60;
    const x_div_c = 1 - Math.abs((h * RECIP_60) % 2 - 1);
    const [rc, rx, gc, gx, bc, bx] = h < 60 ? [1, 0, 0, 1, 0, 0] :
        h < 120 ? [0, 1, 1, 0, 0, 0] :
        h < 180 ? [0, 0, 1, 0, 0, 1] :
        h < 240 ? [0, 0, 0, 1, 1, 0] :
        h < 300 ? [0, 1, 0, 0, 1, 0] :
        [1, 0, 0, 0, 0, 1];
    const value_times_255 = v;
    const c_times_255 = value_times_255 * s;
    const x_times_255 = x_div_c * c_times_255;
    const m_times_255 = value_times_255 - c_times_255;

    const r = rc * c_times_255 + rx * x_times_255 + m_times_255;
    const g = gc * c_times_255 + gx * x_times_255 + m_times_255;
    const b = bc * c_times_255 + bx * x_times_255 + m_times_255;

    return [r, g, b];
}

function rgbToHsv(r: number, g: number, b: number) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    const h = delta == 0 ? 0 :
        max == r ? 60 * ((g - b) / delta % 6) + (g < b ? 360 : 0) :
        max == g ? 60 * ((b - r) / delta + 2) :
        60 * ((r - g) / delta + 4);

    const s = max == 0 ? 0 : delta / max;
    const v = max;

    return [h, s, v];
}
