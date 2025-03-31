import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { Font } from "../../../livesplit-core";
import { SettingValueFactory } from ".";
import { Switch } from "../Switch";
import * as FontList from "../../../util/FontList";

import * as tableClasses from "../../../css/Table.module.scss";

export function Font<T>({
    value,
    setValue,
    factory,
    loadedCallback,
}: {
    value: Font | null;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    loadedCallback: () => void;
}) {
    const children = [
        <Switch
            checked={value !== null}
            setIsChecked={(value) => {
                if (value) {
                    setValue(
                        expect(
                            factory.fromFont("", "normal", "normal", "normal"),
                            "Unexpected Font",
                        ),
                    );
                } else {
                    setValue(factory.fromEmptyFont());
                }
            }}
        />,
    ];

    if (value !== null) {
        // FIXME: We should do a proper promise hook.
        FontList.load(loadedCallback);

        const { family, style, weight, stretch } = value;

        const styles = FontList.knownStyles.get(family);

        if (FontList.knownFamilies.length > 0) {
            children.push(
                <select
                    style={{
                        fontFamily: family,
                    }}
                    value={family}
                    onChange={(e) =>
                        setValue(
                            expect(
                                factory.fromFont(
                                    e.target.value,
                                    style,
                                    weight,
                                    stretch,
                                ),
                                "Unexpected Font",
                            ),
                        )
                    }
                >
                    <option value=""></option>
                    {FontList.knownFamilies.map((n) => (
                        <option value={n} style={{ fontFamily: n }}>
                            {n}
                        </option>
                    ))}
                </select>,
            );
        } else {
            children.push(
                <input
                    className={tableClasses.textBox}
                    value={family}
                    onChange={(e) =>
                        setValue(
                            expect(
                                factory.fromFont(
                                    e.target.value,
                                    style,
                                    weight,
                                    stretch,
                                ),
                                "Unexpected Font",
                            ),
                        )
                    }
                />,
            );
        }

        children.push(
            <>Style</>,
            <select
                value={style}
                onChange={(e) =>
                    setValue(
                        expect(
                            factory.fromFont(
                                family,
                                e.target.value,
                                weight,
                                stretch,
                            ),
                            "Unexpected Font",
                        ),
                    )
                }
            >
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
            </select>,
            <>Weight</>,
            <select
                value={weight}
                onChange={(e) =>
                    setValue(
                        expect(
                            factory.fromFont(
                                family,
                                style,
                                e.target.value,
                                stretch,
                            ),
                            "Unexpected Font",
                        ),
                    )
                }
            >
                {FontList.FONT_WEIGHTS.map(([_, value, name]) => (
                    <option
                        style={{
                            color: styles?.has(value) ? "white" : "grey",
                        }}
                        value={value}
                    >
                        {name}
                    </option>
                ))}
            </select>,
            <>Stretch</>,
            <select
                value={stretch}
                onChange={(e) =>
                    setValue(
                        expect(
                            factory.fromFont(
                                family,
                                style,
                                weight,
                                e.target.value,
                            ),
                            "Unexpected Font",
                        ),
                    )
                }
            >
                {FontList.FONT_STRETCHES.map(([_, value, name]) => (
                    <option
                        style={{
                            color: styles?.has(value) ? "white" : "grey",
                        }}
                        value={value}
                    >
                        {name}
                    </option>
                ))}
            </select>,
        );
    }

    return (
        <div
            className={`${tableClasses.settingsValueBox} ${tableClasses.optionalValue}`}
        >
            {children}
        </div>
    );
}
