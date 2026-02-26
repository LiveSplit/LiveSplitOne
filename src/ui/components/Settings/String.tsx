import * as React from "react";
import { useState } from "react";
import { SettingValueFactory } from ".";
import { Eye, EyeOff, Trash } from "lucide-react";
import { Switch } from "../Switch";
import { Label, resolve } from "../../../localization";
import { Language } from "../../../livesplit-core";

import tableClasses from "../../../css/Table.module.css";
import tooltipClasses from "../../../css/Tooltip.module.css";

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
    lang,
}: {
    value: string | null;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    allComparisons: string[];
    lang: Language | undefined;
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
                <option value="">
                    {resolve(Label.ComparisonCurrentComparison, lang)}
                </option>
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
    lang,
}: {
    value: string;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
    allVariables: Set<string>;
    lang: Language | undefined;
}) {
    if (allVariables.size === 0) {
        return (
            <div className={tableClasses.settingsValueBox}>
                <span
                    className={tooltipClasses.tooltip}
                    style={{ textAlign: "center" }}
                >
                    {resolve(Label.CustomVariableNoneAvailable, lang)}
                    <span className={tooltipClasses.tooltipText}>
                        {resolve(
                            Label.CustomVariableNoneAvailableTooltip,
                            lang,
                        )}
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

export function Password<T>({
    value,
    setValue,
    factory,
}: {
    value: string;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={tableClasses.settingsValueBox}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid var(--input-border-color)",
                }}
            >
                <input
                    className={tableClasses.textBox}
                    style={{ borderBottom: "none", flex: 1, minWidth: 0 }}
                    type={showPassword ? "text" : "password"}
                    autoComplete="off"
                    value={value}
                    onChange={(e) =>
                        setValue(factory.fromString(e.target.value))
                    }
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 5px 3px 4px",
                        display: "flex",
                        alignItems: "center",
                        color: "var(--text-color)",
                        flexShrink: 0,
                        minHeight: 0,
                    }}
                >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );
}
