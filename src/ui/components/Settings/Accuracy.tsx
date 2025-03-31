import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { AccuracyJson } from "../../../livesplit-core";
import { SettingValueFactory } from ".";

import * as tableClasses from "../../../css/Table.module.scss";

export function Accuracy<T>({
    value,
    setValue,
    factory,
}: {
    value: AccuracyJson;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
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
                        ),
                    )
                }
            >
                <option value="Seconds">Seconds</option>
                <option value="Tenths">Tenths</option>
                <option value="Hundredths">Hundredths</option>
                <option value="Milliseconds">Milliseconds</option>
            </select>
        </div>
    );
}
