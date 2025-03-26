import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { DigitsFormatJson } from "../../../livesplit-core";
import { SettingValueFactory } from ".";

export function DigitsFormat<T>({
    value,
    setValue,
    factory,
}: {
    value: DigitsFormatJson;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
}) {
    return (
        <div className="settings-value-box">
            <select
                value={value}
                onChange={(e) =>
                    setValue(
                        expect(
                            factory.fromDigitsFormat(e.target.value),
                            "Unexpected Digits Format",
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
