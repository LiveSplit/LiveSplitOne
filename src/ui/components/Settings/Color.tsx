import * as React from "react";
import type { Color } from "../../../livesplit-core";
import { SettingValueFactory } from ".";
import { ColorPicker } from "../ColorPicker";
import { Switch } from "../Switch";

import tableClasses from "../../../css/Table.module.css";

export function Color<T>({
    value,
    setValue,
    factory,
}: {
    value: Color;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
}) {
    return (
        <div className={tableClasses.settingsValueBox}>
            <ColorPicker
                color={value}
                setColor={(color) =>
                    setValue(
                        factory.fromColor(
                            color[0],
                            color[1],
                            color[2],
                            color[3],
                        ),
                    )
                }
            />
        </div>
    );
}

export function OptionalColor<T>({
    value,
    setValue,
    factory,
}: {
    value: Color | null;
    setValue: (value: T) => void;
    factory: SettingValueFactory<T>;
}) {
    const children: React.ReactNode[] = [];

    if (value !== null) {
        children.push(
            <ColorPicker
                color={value}
                setColor={(color) =>
                    setValue(
                        factory.fromOptionalColor(
                            color[0],
                            color[1],
                            color[2],
                            color[3],
                        ),
                    )
                }
            />,
        );
    }

    return (
        <div
            className={`${tableClasses.settingsValueBox} ${tableClasses.optionalValue}`}
        >
            <Switch
                checked={value !== null}
                setIsChecked={(checked) => {
                    if (checked) {
                        setValue(factory.fromOptionalColor(1, 1, 1, 1));
                    } else {
                        setValue(factory.fromOptionalEmptyColor());
                    }
                }}
            />
            {children}
        </div>
    );
}
