import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { AccuracyJson, Language } from "../../../livesplit-core";
import { SettingValueFactory } from ".";
import { Label, resolve } from "../../../localization";

import * as tableClasses from "../../../css/Table.module.scss";

export function Accuracy<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: AccuracyJson;
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
                            factory.fromAccuracy(e.target.value),
                            "Unexpected Accuracy",
                            lang,
                        ),
                    )
                }
            >
                <option value="Seconds">
                    {resolve(Label.AccuracySeconds, lang)}
                </option>
                <option value="Tenths">
                    {resolve(Label.AccuracyTenths, lang)}
                </option>
                <option value="Hundredths">
                    {resolve(Label.AccuracyHundredths, lang)}
                </option>
                <option value="Milliseconds">
                    {resolve(Label.AccuracyMilliseconds, lang)}
                </option>
            </select>
        </div>
    );
}
