import { Color } from "../livesplit"

export function colorToCss(color: Color): string {
    let r = Math.round(color[0] * 255);
    let g = Math.round(color[1] * 255);
    let b = Math.round(color[2] * 255);
    let a = color[3];

    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}
