import * as React from "react";
import { SettingValueFactory } from ".";
import { Trash } from "lucide-react";
import { Switch } from "../Switch";

import * as tableClasses from "../../../css/Table.module.scss";
import * as tooltipClasses from "../../../css/Tooltip.module.scss";

export function String<T>({
    value,
    setValue,
    factory,
}: {
    value: string;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
}) {
    return (
        <div className={tableClasses.settingsValueBox}>
            <input
                className={tableClasses.textBox}
                value={value}
                onChange={(e) => setValue(factory.fromString(e.target.value))}
            />
        </div>
    );
}

export function OptionalString<T>({
    value,
    setValue,
    factory,
}: {
    value: string | null;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
}) {
    const children = [
        <Switch
            checked={value !== null}
            setIsChecked={(checked) => {
                if (checked) {
                    setValue(factory.fromOptionalString(""));
                } else {
                    setValue(factory.fromOptionalEmptyString());
                }
            }}
        />,
    ];

    if (value !== null) {
        children.push(
            <input
                className={tableClasses.textBox}
                value={value}
                onChange={(e) =>
                    setValue(factory.fromOptionalString(e.target.value))
                }
            />,
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

export function RemovableString<T>({
    value,
    setValue,
    factory,
}: {
    value: string | null;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
}) {
    return (
        <div
            className={`${tableClasses.settingsValueBox} ${tableClasses.removableString}`}
        >
            <input
                className={tableClasses.textBox}
                value={value ?? ""}
                onChange={(e) => {
                    if (factory.fromRemovableString) {
                        setValue(factory.fromRemovableString(e.target.value));
                    } else {
                        throw Error("Method is not implemented");
                    }
                }}
            />
            <Trash
                className={tableClasses.trash}
                strokeWidth={2.5}
                size={20}
                onClick={() => {
                    if (factory.fromRemovableEmptyString) {
                        setValue(factory.fromRemovableEmptyString());
                    } else {
                        throw Error("Method is not implemented");
                    }
                }}
            />
        </div>
    );
}

export function Comparison<T>({
    value,
    setValue,
    factory,
    allComparisons,
}: {
    value: string | null;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    allComparisons: string[];
}) {
    return (
        <div className={tableClasses.settingsValueBox}>
            <select
                value={value ?? ""}
                onChange={(e) => {
                    if (e.target.value !== "") {
                        setValue(factory.fromOptionalString(e.target.value));
                    } else {
                        setValue(factory.fromOptionalEmptyString());
                    }
                }}
            >
                <option value="">Current Comparison</option>
                {allComparisons.map((comparison) => (
                    <option>{comparison}</option>
                ))}
            </select>
        </div>
    );
}

export function CustomVariable<T>({
    value,
    setValue,
    factory,
    allVariables,
}: {
    value: string;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    allVariables: Set<string>;
}) {
    if (allVariables.size === 0) {
        return (
            <div className={tableClasses.settingsValueBox}>
                <span
                    className={tooltipClasses.tooltip}
                    style={{ textAlign: "center" }}
                >
                    No variables available
                    <span className={tooltipClasses.tooltipText}>
                        Custom variables can be defined in the Variables tab
                        when editing splits. Additional custom variables can be
                        provided automatically by auto splitters.
                    </span>
                </span>
            </div>
        );
    } else {
        return (
            <div className={tableClasses.settingsValueBox}>
                <select
                    value={value ?? ""}
                    onChange={(e) =>
                        setValue(factory.fromString(e.target.value))
                    }
                >
                    <option value="" />
                    {Array.from(allVariables).map((variable) => (
                        <option>{variable}</option>
                    ))}
                </select>
            </div>
        );
    }
}
