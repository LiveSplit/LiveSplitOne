import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { LayoutDirection } from "../../../livesplit-core";
import { SettingValueFactory } from ".";

import * as tableClasses from "../../../css/Table.module.scss";

export function LayoutDirection<T>({
    value,
    setValue,
    factory,
}: {
    value: LayoutDirection;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
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
                        ),
                    );
                }}
            >
                <option value="Vertical">Vertical</option>
                <option value="Horizontal">Horizontal</option>
            </select>
        </div>
    );
}
