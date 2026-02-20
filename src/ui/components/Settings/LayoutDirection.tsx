import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { Language, LayoutDirection } from "../../../livesplit-core";
import { SettingValueFactory } from ".";
import { Label, resolve } from "../../../localization";

import * as tableClasses from "../../../css/Table.module.css";

export function LayoutDirection<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: LayoutDirection;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    lang: Language | undefined;
}) {
    return (
        <div className={tableClasses.settingsValueBox}>
            <select
                value={value}
                onChange={(e) => {
                    setValue(
                        expect(
                            factory.fromLayoutDirection(e.target.value),
                            "Unexpected Layout Direction",
                            lang,
                        ),
                    );
                }}
            >
                <option value="Vertical">
                    {resolve(Label.LayoutDirectionVertical, lang)}
                </option>
                <option value="Horizontal">
                    {resolve(Label.LayoutDirectionHorizontal, lang)}
                </option>
            </select>
        </div>
    );
}
