import * as React from "react";
import { SettingsDescriptionValueJson } from "../../../livesplit-core";
import { assertNever, Option } from "../../../util/OptionUtil";
import { HotkeyButton } from "./HotkeyButton";
import { UrlCache } from "../../../util/UrlCache";
import { LiveSplitServer } from "../../../api/LiveSplitServer";
import { showDialog } from "../Dialog";
import { Switch } from "../Switch";
import { ServerConnectionButton } from "./ServerConnectionButton";
import { LayoutBackground } from "./LayoutBackground";
import { Font } from "./Font";
import { LayoutDirection } from "./LayoutDirection";
import {
    ColumnKind,
    ColumnStartWith,
    ColumnUpdateWith,
    ColumnUpdateTrigger,
} from "./Column";
import { Alignment } from "./Alignment";
import { OptionalTimingMethod } from "./TimingMethod";
import { DeltaGradient, Gradient, ListGradient } from "./Gradient";
import { Color, OptionalColor } from "./Color";
import { DigitsFormat } from "./DigitsFormat";
import { Accuracy } from "./Accuracy";
import {
    Comparison,
    CustomVariable,
    OptionalString,
    RemovableString,
    String,
} from "./String";

import * as tableClasses from "../../../css/Table.module.scss";
import * as tooltipClasses from "../../../css/Tooltip.module.scss";

export interface Props<T> {
    context: string;
    setValue: (index: number, value: T) => void;
    state: ExtendedSettingsDescriptionJson;
    factory: SettingValueFactory<T>;
    editorUrlCache: UrlCache;
    allComparisons: string[];
    allVariables: Set<string>;
}

export interface ExtendedSettingsDescriptionJson {
    fields: ExtendedSettingsDescriptionFieldJson[];
}

export interface ExtendedSettingsDescriptionFieldJson {
    text: string | React.JSX.Element;
    tooltip: string | React.JSX.Element;
    value: ExtendedSettingsDescriptionValueJson;
}

export type ExtendedSettingsDescriptionValueJson =
    | SettingsDescriptionValueJson
    | { RemovableString: string | null }
    | {
          ServerConnection: {
              url: string | undefined;
              connection: Option<LiveSplitServer>;
          };
      };

export interface SettingValueFactory<T> {
    fromBool(v: boolean): T;
    fromUint(value: number): T;
    fromInt(value: number): T;
    fromString(value: string): T;
    fromOptionalString(value: string): T;
    fromOptionalEmptyString(): T;
    fromRemovableString?(value: string): T;
    fromRemovableEmptyString?(): T;
    fromAccuracy(value: string): T | null;
    fromDigitsFormat(value: string): T | null;
    fromOptionalTimingMethod(value: string): T | null;
    fromOptionalEmptyTimingMethod(): T;
    fromColor(r: number, g: number, b: number, a: number): T;
    fromOptionalColor(r: number, g: number, b: number, a: number): T;
    fromOptionalEmptyColor(): T;
    fromTransparentGradient(): T;
    fromVerticalGradient(
        r1: number,
        g1: number,
        b1: number,
        a1: number,
        r2: number,
        g2: number,
        b2: number,
        a2: number,
    ): T;
    fromHorizontalGradient(
        r1: number,
        g1: number,
        b1: number,
        a1: number,
        r2: number,
        g2: number,
        b2: number,
        a2: number,
    ): T;
    fromAlternatingGradient(
        r1: number,
        g1: number,
        b1: number,
        a1: number,
        r2: number,
        g2: number,
        b2: number,
        a2: number,
    ): T;
    fromAlignment(value: string): T | null;
    fromColumnKind(value: string): T | null;
    fromColumnStartWith(value: string): T | null;
    fromColumnUpdateWith(value: string): T | null;
    fromColumnUpdateTrigger(value: string): T | null;
    fromLayoutDirection(value: string): T | null;
    fromFont(
        name: string,
        style: string,
        weight: string,
        stretch: string,
    ): T | null;
    fromEmptyFont(): T;
    fromDeltaGradient(value: string): T | null;
    fromBackgroundImage(
        imageId: string,
        brightness: number,
        opacity: number,
        blur: number,
    ): T | null;
}

export class JsonSettingValueFactory
    implements SettingValueFactory<ExtendedSettingsDescriptionValueJson>
{
    public fromBool(v: boolean): ExtendedSettingsDescriptionValueJson {
        return { Bool: v };
    }
    public fromUint(_: number): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromInt(_: number): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromString(v: string): ExtendedSettingsDescriptionValueJson {
        return { String: v };
    }
    public fromOptionalString(_: string): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromOptionalEmptyString(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromRemovableString(
        v: string,
    ): ExtendedSettingsDescriptionValueJson {
        return { RemovableString: v };
    }
    public fromRemovableEmptyString(): ExtendedSettingsDescriptionValueJson {
        return { RemovableString: null };
    }
    public fromAccuracy(
        _: string,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromDigitsFormat(
        _: string,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromOptionalTimingMethod(
        _: string,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromOptionalEmptyTimingMethod(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromColor(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromOptionalColor(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromOptionalEmptyColor(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromTransparentGradient(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromVerticalGradient(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromHorizontalGradient(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromAlternatingGradient(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromAlignment(
        _: string,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromColumnKind(
        _: string,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromColumnStartWith(
        _: string,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromColumnUpdateWith(
        _: string,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromColumnUpdateTrigger(
        _: string,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromLayoutDirection(
        _: string,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromFont(
        _name: string,
        _style: string,
        _weight: string,
        _stretch: string,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromEmptyFont(): ExtendedSettingsDescriptionValueJson {
        throw new Error("Not implemented");
    }
    public fromDeltaGradient(
        _: string,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
    public fromBackgroundImage(
        _imageId: string,
        _brightness: number,
        _opacity: number,
        _blur: number,
    ): ExtendedSettingsDescriptionValueJson | null {
        throw new Error("Not implemented");
    }
}

export class SettingsComponent<T> extends React.Component<Props<T>> {
    public render() {
        const settingsRows: React.JSX.Element[] = [];
        const { factory } = this.props;

        this.props.state.fields.forEach((field, valueIndex) => {
            const { value } = field;
            let component;
            if ("Bool" in value) {
                component = (
                    <div className={tableClasses.settingsValueBox}>
                        <Switch
                            checked={value.Bool}
                            setIsChecked={(value) => {
                                this.props.setValue(
                                    valueIndex,
                                    factory.fromBool(value),
                                );
                            }}
                        />
                    </div>
                );
            } else if ("UInt" in value) {
                component = (
                    <div className={tableClasses.settingsValueBox}>
                        <input
                            type="number"
                            className={`${tableClasses.number} ${tableClasses.textBox}`}
                            value={value.UInt}
                            min="0"
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    factory.fromUint(e.target.valueAsNumber),
                                );
                            }}
                        />
                    </div>
                );
            } else if ("Int" in value) {
                component = (
                    <div className={tableClasses.settingsValueBox}>
                        <input
                            type="number"
                            className={`${tableClasses.number} ${tableClasses.textBox}`}
                            value={value.Int}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    factory.fromInt(e.target.valueAsNumber),
                                );
                            }}
                        />
                    </div>
                );
            } else if ("String" in value) {
                // FIXME: This is a hack that we need for now until the way
                // settings are represented is refactored.
                if (
                    typeof field.text === "string" &&
                    /^Variable/.test(field.text)
                ) {
                    component = (
                        <CustomVariable
                            value={value.String}
                            setValue={(value) =>
                                this.props.setValue(valueIndex, value)
                            }
                            factory={this.props.factory}
                            allVariables={this.props.allVariables}
                        />
                    );
                } else {
                    component = (
                        <String
                            value={value.String}
                            setValue={(value) =>
                                this.props.setValue(valueIndex, value)
                            }
                            factory={this.props.factory}
                        />
                    );
                }
            } else if ("OptionalString" in value) {
                // FIXME: This is a hack that we need for now until the way
                // settings are represented is refactored.
                if (
                    typeof field.text === "string" &&
                    /^Comparison( \d)?$/.test(field.text)
                ) {
                    component = (
                        <Comparison
                            allComparisons={this.props.allComparisons}
                            value={value.OptionalString}
                            setValue={(value) =>
                                this.props.setValue(valueIndex, value)
                            }
                            factory={this.props.factory}
                        />
                    );
                } else {
                    component = (
                        <OptionalString
                            value={value.OptionalString}
                            setValue={(value) =>
                                this.props.setValue(valueIndex, value)
                            }
                            factory={this.props.factory}
                        />
                    );
                }
            } else if ("RemovableString" in value) {
                component = (
                    <RemovableString
                        value={value.RemovableString}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("Accuracy" in value) {
                component = (
                    <Accuracy
                        value={value.Accuracy}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("DigitsFormat" in value) {
                component = (
                    <DigitsFormat
                        value={value.DigitsFormat}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("Color" in value) {
                component = (
                    <Color
                        value={value.Color}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("OptionalColor" in value) {
                component = (
                    <OptionalColor
                        value={value.OptionalColor}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("Gradient" in value) {
                component = (
                    <Gradient
                        value={value.Gradient}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("ListGradient" in value) {
                component = (
                    <ListGradient
                        value={value.ListGradient}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("OptionalTimingMethod" in value) {
                component = (
                    <OptionalTimingMethod
                        value={value.OptionalTimingMethod}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("Alignment" in value) {
                component = (
                    <Alignment
                        value={value.Alignment}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("ColumnKind" in value) {
                component = (
                    <ColumnKind
                        value={value.ColumnKind}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("ColumnStartWith" in value) {
                component = (
                    <ColumnStartWith
                        value={value.ColumnStartWith}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("ColumnUpdateWith" in value) {
                component = (
                    <ColumnUpdateWith
                        value={value.ColumnUpdateWith}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("ColumnUpdateTrigger" in value) {
                component = (
                    <ColumnUpdateTrigger
                        value={value.ColumnUpdateTrigger}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("CustomCombobox" in value) {
                const isError =
                    value.CustomCombobox.mandatory &&
                    !value.CustomCombobox.value;
                component = (
                    <div className={tableClasses.settingsValueBox}>
                        <select
                            value={value.CustomCombobox.value}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    factory.fromString(e.target.value),
                                );
                            }}
                            style={{
                                border: isError
                                    ? "1px solid rgb(255, 0, 0)"
                                    : undefined,
                            }}
                        >
                            {value.CustomCombobox.list.map((v) => (
                                <option value={v}>{v}</option>
                            ))}
                        </select>
                    </div>
                );
            } else if ("Hotkey" in value) {
                component = (
                    <div className={tableClasses.settingsValueBox}>
                        <HotkeyButton
                            value={value.Hotkey}
                            setValue={(value) => {
                                if (value != null) {
                                    this.props.setValue(
                                        valueIndex,
                                        factory.fromOptionalString(value),
                                    );
                                } else {
                                    this.props.setValue(
                                        valueIndex,
                                        factory.fromOptionalEmptyString(),
                                    );
                                }
                            }}
                        />
                    </div>
                );
            } else if ("LayoutDirection" in value) {
                component = (
                    <LayoutDirection
                        value={value.LayoutDirection}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("Font" in value) {
                component = (
                    <Font
                        value={value.Font}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                        loadedCallback={() => this.setState({})}
                    />
                );
            } else if ("DeltaGradient" in value) {
                component = (
                    <DeltaGradient
                        value={value.DeltaGradient}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                    />
                );
            } else if ("LayoutBackground" in value) {
                component = (
                    <LayoutBackground
                        value={value.LayoutBackground}
                        setValue={(value) =>
                            this.props.setValue(valueIndex, value)
                        }
                        factory={this.props.factory}
                        editorUrlCache={this.props.editorUrlCache}
                    />
                );
            } else if ("ServerConnection" in value) {
                component = (
                    <ServerConnectionButton
                        value={value.ServerConnection}
                        connectOrDisconnect={() =>
                            this.connectToServerOrDisconnect(
                                valueIndex,
                                value.ServerConnection.url,
                                value.ServerConnection.connection,
                            )
                        }
                    />
                );
            } else {
                assertNever(value);
            }

            settingsRows.push(
                <tr key={`${this.props.context}$${valueIndex}`}>
                    <td className={tooltipClasses.tooltip}>
                        {field.text}
                        <span className={tooltipClasses.tooltipText}>
                            {field.tooltip}
                        </span>
                    </td>
                    <td>{component}</td>
                </tr>,
            );
        });

        return (
            <table
                className={`${tableClasses.table} ${tableClasses.settingsTable}`}
            >
                <tbody className={tableClasses.tableBody}>{settingsRows}</tbody>
            </table>
        );
    }

    // FIXME: Move to the component if possible.
    private async connectToServerOrDisconnect(
        valueIndex: number,
        serverUrl: string | undefined,
        connection: Option<LiveSplitServer>,
    ) {
        if (connection) {
            connection.close();
            return;
        }
        const [result, url] = await showDialog({
            title: "Connect to Server",
            description: "Specify the WebSocket URL:",
            textInput: true,
            defaultText: serverUrl,
            buttons: ["Connect", "Cancel"],
        });
        if (result !== 0) {
            return;
        }
        this.props.setValue(valueIndex, this.props.factory.fromString(url));
    }
}
