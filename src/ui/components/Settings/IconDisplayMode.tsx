import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import {
    type IconDisplayMode as IconDisplayModeType,
    type Language,
} from "../../../livesplit-core";
import { type SettingValueFactory } from ".";
import { Label, resolve } from "../../../localization";

import tableClasses from "../../../css/Table.module.css";

// Core owns icon fitting and missing-image reclamation. The editor only
// forwards the display mode, so previews and the running timer use the same
// automatic layout rules without any additional frontend sizing settings.
export function IconDisplayMode<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: IconDisplayModeType;
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
                            factory.fromIconDisplayMode(e.target.value),
                            "Unexpected Icon Display Mode",
                            lang,
                        ),
                    )
                }
            >
                <option value="Hidden">{resolve(Label.Hidden, lang)}</option>
                <option value="BothRows">
                    {resolve(Label.IconDisplayModeBothRows, lang)}
                </option>
                <option value="FirstRow">
                    {resolve(Label.IconDisplayModeFirstRow, lang)}
                </option>
            </select>
        </div>
    );
}
