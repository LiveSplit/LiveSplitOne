import * as React from "react";

import { SettingsComponent } from "./Settings";
import { SettingsDescriptionJson, SettingValue, HotkeyConfig } from "../livesplit";
import { toast } from "react-toastify";

import "../css/SettingsEditor.scss";

export interface Props {
    hotkeyConfig: HotkeyConfig,
}

export interface State {
    settings: SettingsDescriptionJson,
}

export class SettingsEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            settings: props.hotkeyConfig.settingsDescriptionAsJson(),
        };
    }

    public render() {
        return (
            <div className="settings-editor">
                <SettingsComponent
                    factory={SettingValue}
                    state={this.state.settings}
                    setValue={(index, value) => {
                        if (!this.props.hotkeyConfig.setValue(index, value)) {
                            toast.error("The hotkey is already in use.");
                            return;
                        }
                        this.update();
                    }}
                />
            </div>
        );
    }

    private update() {
        this.setState({
            ...this.state,
            settings: this.props.hotkeyConfig.settingsDescriptionAsJson(),
        });
    }
}
