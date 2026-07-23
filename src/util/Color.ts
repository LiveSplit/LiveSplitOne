import type { Color } from "../livesplit-core";

export type RgbaColor = [number, number, number, number];

export function toRgbaColor(color: Color): RgbaColor {
    const [red, green, blue, alpha] = color;
    if (
        red === undefined ||
        green === undefined ||
        blue === undefined ||
        alpha === undefined
    ) {
        // The generated core bindings currently describe an RGBA color as an
        // arbitrary number array even though the serialization contract always
        // contains exactly four channels. Validate that boundary once so UI
        // code can model channel access as a fixed tuple without hiding
        // malformed binding data behind non-null assertions.
        throw new Error("Expected an RGBA color with four channels.");
    }
    return [red, green, blue, alpha];
}
