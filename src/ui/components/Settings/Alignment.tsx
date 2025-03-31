import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { Alignment } from "../../../livesplit-core";
import { SettingValueFactory } from ".";

import * as tableClasses from "../../../css/Table.module.scss";

export function Alignment<T>({
    value,
    setValue,
    factory,
}: {
    value: Alignment;
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
                            factory.fromAlignment(e.target.value),
                            "Unexpected Alignment",
                        ),
                    )
                }
            >
                <option value="Auto">Automatic</option>
                <option value="Left">Left</option>
                <option value="Center">Center</option>
            </select>
        </div>
    );
}
