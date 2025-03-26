import * as React from "react";
import { expect } from "../../../util/OptionUtil";
import {
    ColumnKind,
    ColumnStartWith,
    ColumnUpdateWith,
    ColumnUpdateTrigger,
} from "../../../livesplit-core";
import { SettingValueFactory } from ".";

export function ColumnKind<T>({
    value,
    setValue,
    factory,
}: {
    value: ColumnKind;
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
                            factory.fromColumnKind(e.target.value),
                            "Unexpected Column Kind value",
                        ),
                    )
                }
            >
                <option value="Time">Time</option>
                <option value="Variable">Variable</option>
            </select>
        </div>
    );
}

export function ColumnStartWith<T>({
    value,
    setValue,
    factory,
}: {
    value: ColumnStartWith;
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
                            factory.fromColumnStartWith(e.target.value),
                            "Unexpected Column Start With value",
                        ),
                    )
                }
            >
                <option value="Empty">Empty</option>
                <option value="ComparisonTime">Comparison Time</option>
                <option value="ComparisonSegmentTime">
                    Comparison Segment Time
                </option>
                <option value="PossibleTimeSave">Possible Time Save</option>
            </select>
        </div>
    );
}

export function ColumnUpdateWith<T>({
    value,
    setValue,
    factory,
}: {
    value: ColumnUpdateWith;
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
                            factory.fromColumnUpdateWith(e.target.value),
                            "Unexpected Column Update With value",
                        ),
                    )
                }
            >
                <option value="DontUpdate">Don't Update</option>
                <option value="SplitTime">Split Time</option>
                <option value="Delta">Time Ahead / Behind</option>
                <option value="DeltaWithFallback">
                    Time Ahead / Behind or Split Time If Empty
                </option>
                <option value="SegmentTime">Segment Time</option>
                <option value="SegmentDelta">Time Saved / Lost</option>
                <option value="SegmentDeltaWithFallback">
                    Time Saved / Lost or Segment Time If Empty
                </option>
            </select>
        </div>
    );
}

export function ColumnUpdateTrigger<T>({
    value,
    setValue,
    factory,
}: {
    value: ColumnUpdateTrigger;
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
                            factory.fromColumnUpdateTrigger(e.target.value),
                            "Unexpected Column Update Trigger value",
                        ),
                    )
                }
            >
                <option value="OnStartingSegment">On Starting Segment</option>
                <option value="Contextual">Contextual</option>
                <option value="OnEndingSegment">On Ending Segment</option>
            </select>
        </div>
    );
}
