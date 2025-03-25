let queriedKnownFonts = false;
export let knownFamilies: string[] = [];
export const knownStyles = new Map<string, Set<string>>();

// There's three values per row:
// 1. What to look for in the style specifier of the loaded font list.
// 2. The value to tell livesplit-core.
// 3. The label to display in the UI.
export const FONT_WEIGHTS = [
    ["thin", "thin", "Thin"],
    ["extralight", "extra-light", "Extra Light"],
    ["light", "light", "Light"],
    ["semilight", "semi-light", "Semi Light"],
    ["normal", "normal", "Normal"],
    ["medium", "medium", "Medium"],
    ["semibold", "semi-bold", "Semi Bold"],
    ["bold", "bold", "Bold"],
    ["extrabold", "extra-bold", "Extra Bold"],
    ["black", "black", "Black"],
    ["extrablack", "extra-black", "Extra Black"],
];

export const FONT_STRETCHES = [
    ["ultracondensed", "ultra-condensed", "Ultra Condensed"],
    ["extracondensed", "extra-condensed", "Extra Condensed"],
    ["condensed", "condensed", "Condensed"],
    ["semicondensed", "semi-condensed", "Semi Condensed"],
    ["normal", "normal", "Normal"],
    ["semiexpanded", "semi-expanded", "Semi Expanded"],
    ["expanded", "expanded", "Expanded"],
    ["extraexpanded", "extra-expanded", "Extra Expanded"],
    ["ultraexpanded", "ultra-expanded", "Ultra Expanded"],
];

// Italics are always supported.

export function load(loadedCallback: () => void) {
    if (!queriedKnownFonts) {
        queriedKnownFonts = true;
        if ("queryLocalFonts" in window) {
            (window as any).queryLocalFonts().then((availableFonts: any) => {
                try {
                    for (const font of availableFonts) {
                        if (!knownStyles.has(font.family)) {
                            knownStyles.set(
                                font.family,
                                new Set(["normal", "bold"]),
                            );
                        }

                        const set = knownStyles.get(font.family)!;
                        const styles = (font.style as string)
                            .toLowerCase()
                            .split(" ");

                        for (const [keyword, value] of FONT_STRETCHES) {
                            if (styles.includes(keyword)) {
                                set.add(value);
                            }
                        }

                        for (const [keyword, value] of FONT_WEIGHTS) {
                            if (styles.includes(keyword)) {
                                set.add(value);
                            }
                        }
                    }

                    knownFamilies = Array.from(knownStyles.keys());

                    loadedCallback();
                } catch {
                    // It's fine if it fails, it's an experimental web API, and
                    // the user may reject it.
                }
            });
        }
    }
}
