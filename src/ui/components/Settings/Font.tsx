import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { Font, Language } from "../../../livesplit-core";
import { SettingValueFactory } from ".";
import { Switch } from "../Switch";
import * as FontList from "../../../util/FontList";
import { Label, resolve } from "../../../localization";

import * as tableClasses from "../../../css/Table.module.css";

export function Font<T>({
    value,
    setValue,
    factory,
    loadedCallback,
    lang,
}: {
    value: Font | null;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    loadedCallback: () => void;
    lang: Language | undefined;
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
                            lang,
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
                                lang,
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
                                lang,
                            ),
                        )
                    }
                />,
            );
        }

        children.push(
            <>{resolve(Label.FontStyle, lang)}</>,
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
                            lang,
                        ),
                    )
                }
            >
                <option value="normal">
                    {resolve(Label.FontStyleNormal, lang)}
                </option>
                <option value="italic">
                    {resolve(Label.FontStyleItalic, lang)}
                </option>
            </select>,
            <>{resolve(Label.FontWeight, lang)}</>,
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
                            lang,
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
            <>{resolve(Label.FontStretch, lang)}</>,
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
                            lang,
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
