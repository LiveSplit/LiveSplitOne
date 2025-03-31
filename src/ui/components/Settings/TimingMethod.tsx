import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { TimingMethodJson } from "../../../livesplit-core";
import { SettingValueFactory } from ".";
import { Switch } from "../Switch";

import * as tableClasses from "../../../css/Table.module.scss";

export function OptionalTimingMethod<T>({
    value,
    setValue,
    factory,
}: {
    value: TimingMethodJson | null;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
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
                        ),
                    )
                }
            >
                <option value="RealTime">Real Time</option>
                <option value="GameTime">Game Time</option>
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
