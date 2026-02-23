import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { Language, TimingMethodJson } from "../../../livesplit-core";
import { SettingValueFactory } from ".";
import { Switch } from "../Switch";
import { Label, resolve } from "../../../localization";

import tableClasses from "../../../css/Table.module.css";

export function OptionalTimingMethod<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: TimingMethodJson | null;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    lang: Language | undefined;
}) {
    const children = [
        <Switch
            checked={value !== null}
            setIsChecked={(value) => {
                if (value) {
                    setValue(
                        expect(
                            factory.fromOptionalTimingMethod("RealTime"),
                            "Unexpected Optional Timing Method",
                            lang,
                        ),
                    );
                } else {
                    setValue(factory.fromOptionalEmptyTimingMethod());
                }
            }}
        />,
    ];

    if (value !== null) {
        children.push(
            <select
                value={value}
                onChange={(e) =>
                    setValue(
                        expect(
                            factory.fromOptionalTimingMethod(e.target.value),
                            "Unexpected Optional Timing Method",
                            lang,
                        ),
                    )
                }
            >
                <option value="RealTime">
                    {resolve(Label.RealTime, lang)}
                </option>
                <option value="GameTime">
                    {resolve(Label.GameTime, lang)}
                </option>
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
