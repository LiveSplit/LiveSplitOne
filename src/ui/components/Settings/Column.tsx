import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import {
    ColumnKind,
    ColumnStartWith,
    ColumnUpdateWith,
    ColumnUpdateTrigger,
    Language,
} from "../../../livesplit-core";
import { SettingValueFactory } from ".";
import { Label, resolve } from "../../../localization";

import * as tableClasses from "../../../css/Table.module.scss";

export function ColumnKind<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: ColumnKind;
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
                            factory.fromColumnKind(e.target.value),
                            "Unexpected Column Kind value",
                            lang,
                        ),
                    )
                }
            >
                <option value="Time">
                    {resolve(Label.ColumnKindTime, lang)}
                </option>
                <option value="Variable">
                    {resolve(Label.ColumnKindVariable, lang)}
                </option>
            </select>
        </div>
    );
}

export function ColumnStartWith<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: ColumnStartWith;
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
                            factory.fromColumnStartWith(e.target.value),
                            "Unexpected Column Start With value",
                            lang,
                        ),
                    )
                }
            >
                <option value="Empty">
                    {resolve(Label.ColumnStartWithEmpty, lang)}
                </option>
                <option value="ComparisonTime">
                    {resolve(Label.ColumnStartWithComparisonTime, lang)}
                </option>
                <option value="ComparisonSegmentTime">
                    {resolve(Label.ColumnStartWithComparisonSegmentTime, lang)}
                </option>
                <option value="PossibleTimeSave">
                    {resolve(Label.ColumnStartWithPossibleTimeSave, lang)}
                </option>
            </select>
        </div>
    );
}

export function ColumnUpdateWith<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: ColumnUpdateWith;
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
                            factory.fromColumnUpdateWith(e.target.value),
                            "Unexpected Column Update With value",
                            lang,
                        ),
                    )
                }
            >
                <option value="DontUpdate">
                    {resolve(Label.ColumnUpdateWithDontUpdate, lang)}
                </option>
                <option value="SplitTime">
                    {resolve(Label.ColumnUpdateWithSplitTime, lang)}
                </option>
                <option value="Delta">
                    {resolve(Label.ColumnUpdateWithDelta, lang)}
                </option>
                <option value="DeltaWithFallback">
                    {resolve(Label.ColumnUpdateWithDeltaWithFallback, lang)}
                </option>
                <option value="SegmentTime">
                    {resolve(Label.ColumnUpdateWithSegmentTime, lang)}
                </option>
                <option value="SegmentDelta">
                    {resolve(Label.ColumnUpdateWithSegmentDelta, lang)}
                </option>
                <option value="SegmentDeltaWithFallback">
                    {resolve(
                        Label.ColumnUpdateWithSegmentDeltaWithFallback,
                        lang,
                    )}
                </option>
            </select>
        </div>
    );
}

export function ColumnUpdateTrigger<T>({
    value,
    setValue,
    factory,
    lang,
}: {
    value: ColumnUpdateTrigger;
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
                            factory.fromColumnUpdateTrigger(e.target.value),
                            "Unexpected Column Update Trigger value",
                            lang,
                        ),
                    )
                }
            >
                <option value="OnStartingSegment">
                    {resolve(Label.ColumnUpdateTriggerOnStartingSegment, lang)}
                </option>
                <option value="Contextual">
                    {resolve(Label.ColumnUpdateTriggerContextual, lang)}
                </option>
                <option value="OnEndingSegment">
                    {resolve(Label.ColumnUpdateTriggerOnEndingSegment, lang)}
                </option>
            </select>
        </div>
    );
}
