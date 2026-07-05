import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import { SubsplitDisplayMode as SubsplitDisplayModeType, Language } from "../../../livesplit-core";
import { SettingValueFactory } from ".";
import { Label, resolve } from "../../../localization";

import tableClasses from "../../../css/Table.module.css";

export function SubsplitDisplayMode<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: SubsplitDisplayModeType;
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
                            factory.fromSubsplitDisplayMode(e.target.value),
                            "Unexpected SubsplitDisplayMode",
                            lang,
                        ),
                    )
                }
            >
                <option value="Flat">
                    {resolve(Label.SubsplitDisplayModeFlat, lang)}
                </option>
                <option value="AllGroupsExpanded">
                    {resolve(Label.SubsplitDisplayModeAllGroupsExpanded, lang)}
                </option>
                <option value="CurrentGroupExpanded">
                    {resolve(
                        Label.SubsplitDisplayModeCurrentGroupExpanded,
                        lang,
                    )}
                </option>
            </select>
        </div>
    );
}
