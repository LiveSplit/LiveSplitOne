import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { Alignment, Language } from "../../../livesplit-core";
import { SettingValueFactory } from ".";
import { Label, resolve } from "../../../localization";

import * as tableClasses from "../../../css/Table.module.css";

export function Alignment<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: Alignment;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    lang: Language | undefined;
}) {
    return (
        <div className={tableClasses.settingsValueBox}>
            <select
                value={value}
                onChange={(e) =>
                    setValue(
                        expect(
                            factory.fromAlignment(e.target.value),
                            "Unexpected Alignment",
                            lang,
                        ),
                    )
                }
            >
                <option value="Auto">
                    {resolve(Label.AlignmentAutomatic, lang)}
                </option>
                <option value="Left">
                    {resolve(Label.AlignmentLeft, lang)}
                </option>
                <option value="Center">
                    {resolve(Label.AlignmentCenter, lang)}
                </option>
            </select>
        </div>
    );
}
