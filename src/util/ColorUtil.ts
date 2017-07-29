import { Color, Gradient } from "../livesplit"

export function colorToCss(color: Color): string {
    let r = Math.round(color[0] * 255);
    let g = Math.round(color[1] * 255);
    let b = Math.round(color[2] * 255);
    let a = color[3];

    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

export function gradientToCss(gradient: Gradient): string {
    const gradientAny: any = gradient;
    switch (Object.keys(gradient)[0]) {
        case "Transparent":
            return "transparent";
        case "Plain":
            return colorToCss(gradientAny.Plain);
        case "Vertical":
            return "linear-gradient(" +
                colorToCss(gradientAny.Vertical[0]) +
                " 0%, " +
                colorToCss(gradientAny.Vertical[1]) +
                " 100%)";
        case "Horizontal":
            return "linear-gradient(to right, " +
                colorToCss(gradientAny.Horizontal[0]) +
                " 0%, " +
                colorToCss(gradientAny.Horizontal[1]) +
                " 100%)";
    }
}
