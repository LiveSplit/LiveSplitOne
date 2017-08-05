import { Color, Gradient } from "../livesplit"

export function colorToCss(color: Color): string {
    const r = Math.round(color[0] * 255);
    const g = Math.round(color[1] * 255);
    const b = Math.round(color[2] * 255);
    const a = color[3];

    return `rgba(${r},${g},${b},${a})`;
}

export function gradientToCss(gradient: Gradient): string {
    const gradientAny: any = gradient;
    if (gradientAny == "Transparent") {
        return "transparent";
    }
    switch (Object.keys(gradient)[0]) {
        case "Plain":
            return colorToCss(gradientAny.Plain);
        case "Vertical": {
            const start = colorToCss(gradientAny.Vertical[0]);
            const end = colorToCss(gradientAny.Vertical[1]);
            return `linear-gradient(${start} 0%, ${end} 100%)`;
        }
        case "Horizontal": {
            const start = colorToCss(gradientAny.Horizontal[0]);
            const end = colorToCss(gradientAny.Horizontal[1]);
            return `linear-gradient(to right, ${start} 0%, ${end} 100%)`;
        }
        default:
            throw "Unexpected Gradient Type";
    }
}
