import * as React from "react";
import * as LiveSplit from "../livesplit";
import ColorPicker from "./ColorPicker";

export interface Props {
    setValue: (index: number, value: LiveSplit.SettingValue) => void,
    state: LiveSplit.SettingsDescriptionJson,
}

export default class SettingsComponent extends React.Component<Props, undefined> {
    render() {
        let settingsRows: any[] = [];

        this.props.state.fields.forEach((field, valueIndex) => {
            var component;
            let value: any = field.value;
            switch (Object.keys(value)[0]) {
                case "Bool": {
                    component =
                        <input
                            type="checkbox"
                            checked={value.Bool}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    LiveSplit.SettingValue.fromBool(e.target.checked),
                                );
                            }}
                        />;
                    break;
                }
                case "UInt": {
                    component =
                        <input
                            type="number"
                            className="number"
                            value={value.UInt}
                            min="0"
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    LiveSplit.SettingValue.fromUint(e.target.valueAsNumber),
                                );
                            }}
                        />;
                    break;
                }
                case "Int": {
                    component =
                        <input
                            type="number"
                            className="number"
                            value={value.Int}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    LiveSplit.SettingValue.fromInt(e.target.valueAsNumber),
                                );
                            }}
                        />;
                    break;
                }
                case "String": {
                    component =
                        <input
                            value={value.String}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    LiveSplit.SettingValue.fromString(e.target.value),
                                );
                            }}
                        />;
                    break;
                }
                case "OptionalString": {
                    let children = [
                        <input
                            type="checkbox"
                            checked={value.OptionalString != null}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    this.props.setValue(
                                        valueIndex,
                                        LiveSplit.SettingValue.fromOptionalString(""),
                                    );
                                } else {
                                    this.props.setValue(
                                        valueIndex,
                                        LiveSplit.SettingValue.fromOptionalEmptyString(),
                                    );
                                }
                            }}
                        />
                    ];

                    if (value.OptionalString != null) {
                        children.push(
                            <input
                                value={value.OptionalString}
                                disabled={value.OptionalString == null}
                                onChange={(e) => {
                                    this.props.setValue(
                                        valueIndex,
                                        LiveSplit.SettingValue.fromOptionalString(e.target.value),
                                    );
                                }}
                            />
                        );
                    }

                    component =
                        <span>
                            {children}
                        </span>;
                    break;
                }
                case "Float": {
                    component =
                        <input
                            type="number"
                            value={value.Float}
                            className="number"
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    LiveSplit.SettingValue.fromFloat(e.target.valueAsNumber),
                                );
                            }}
                        />;
                    break;
                }
                case "Accuracy": {
                    component =
                        <select
                            value={value.Accuracy}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    LiveSplit.SettingValue.fromAccuracy(e.target.value),
                                );
                            }}
                        >
                            <option value="Seconds">Seconds</option>
                            <option value="Tenths">Tenths</option>
                            <option value="Hundredths">Hundredths</option>
                        </select>;
                    break;
                }
                case "DigitsFormat": {
                    component =
                        <select
                            value={value.DigitsFormat}
                            onChange={(e) => {
                                this.props.setValue(
                                    valueIndex,
                                    LiveSplit.SettingValue.fromDigitsFormat(e.target.value),
                                );
                            }}
                        >
                            <option value="SingleDigitSeconds">1</option>
                            <option value="DoubleDigitSeconds">01</option>
                            <option value="SingleDigitMinutes">0:01</option>
                            <option value="DoubleDigitMinutes">00:01</option>
                            <option value="SingleDigitHours">0:00:01</option>
                            <option value="DoubleDigitHours">00:00:01</option>
                        </select>;
                    break;
                }
                case "Color": {
                    component =
                        <ColorPicker
                            color={value.Color}
                            setColor={(color) => {
                                this.props.setValue(
                                    valueIndex,
                                    LiveSplit.SettingValue.fromColor(
                                        color[0],
                                        color[1],
                                        color[2],
                                        color[3],
                                    ),
                                );
                            }}
                        />;
                    break;
                }
                case "OptionalTimingMethod": {
                    let children = [
                        <input
                            type="checkbox"
                            checked={value.OptionalTimingMethod != null}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    this.props.setValue(
                                        valueIndex,
                                        LiveSplit.SettingValue.fromOptionalTimingMethod("RealTime"),
                                    );
                                } else {
                                    this.props.setValue(
                                        valueIndex,
                                        LiveSplit.SettingValue.fromOptionalEmptyTimingMethod(),
                                    );
                                }
                            }}
                        />
                    ];

                    if (value.OptionalTimingMethod != null) {
                        children.push(
                            <select
                                value={value.OptionalTimingMethod}
                                disabled={value.OptionalTimingMethod == null}
                                onChange={(e) => {
                                    this.props.setValue(
                                        valueIndex,
                                        LiveSplit.SettingValue.fromOptionalTimingMethod(e.target.value),
                                    );
                                }}
                            >
                                <option value="RealTime">Real Time</option>
                                <option value="GameTime">Game Time</option>
                            </select>
                        );
                    }

                    component =
                        <span>
                            {children}
                        </span>;
                    break;
                }
            }
            settingsRows.push(
                <tr>
                    <td>{field.text}</td>
                    <td>{component}</td>
                </tr>
            );
        });

        return (
            <table className="component-settings table">
                <tbody className="table-body">
                    {settingsRows}
                </tbody>
            </table>
        );
    }
}
