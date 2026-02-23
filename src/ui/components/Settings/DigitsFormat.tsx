import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { DigitsFormatJson, Language } from "../../../livesplit-core";
import { SettingValueFactory } from ".";

import tableClasses from "../../../css/Table.module.css";

export function DigitsFormat<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: DigitsFormatJson;
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
                            factory.fromDigitsFormat(e.target.value),
                            "Unexpected Digits Format",
                            lang,
                        ),
                    )
                }
            >
                <option value="SingleDigitSeconds">1</option>
                <option value="DoubleDigitSeconds">01</option>
                <option value="SingleDigitMinutes">0:01</option>
                <option value="DoubleDigitMinutes">00:01</option>
                <option value="SingleDigitHours">0:00:01</option>
                <option value="DoubleDigitHours">00:00:01</option>
            </select>
        </div>
    );
}
