import { Color, Gradient } from "../livesplit-core";

export function colorToCss(color: Color): string {
    const r = Math.round(color[0] * 255);
    const g = Math.round(color[1] * 255);
    const b = Math.round(color[2] * 255);
    const a = color[3];

    return `rgba(${r},${g},${b},${a})`;
}

export function gradientToCss(gradient: Gradient): string {
    if (gradient === "Transparent") {
        return "transparent";
    } else if ("Plain" in gradient) {
        return colorToCss(gradient.Plain);
    } else if ("Vertical" in gradient) {
        const start = colorToCss(gradient.Vertical[0]);
        const end = colorToCss(gradient.Vertical[1]);
        return `linear-gradient(${start} 0%, ${end} 100%)`;
    } else {
        const start = colorToCss(gradient.Horizontal[0]);
        const end = colorToCss(gradient.Horizontal[1]);
        return `linear-gradient(to right, ${start} 0%, ${end} 100%)`;
    }
}
