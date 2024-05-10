import * as React from "react";

import { JsonSettingValueFactory, SettingsComponent } from "./Settings";
import { SettingsDescriptionJson, SettingValue, HotkeyConfig } from "../livesplit-core";
import { toast } from "react-toastify";
import { UrlCache } from "../util/UrlCache";
import { FRAME_RATE_AUTOMATIC as FRAME_RATE_BATTERY_AWARE, FRAME_RATE_MATCH_SCREEN as FRAME_RATE_MATCH_SCREEN, FrameRateSetting } from "../util/FrameRate";

import "../css/SettingsEditor.scss";

export interface GeneralSettings {
    showControlButtons: boolean,
    frameRate: FrameRateSetting,
}

export interface Props {
    generalSettings: GeneralSettings,
    hotkeyConfig: HotkeyConfig,
    urlCache: UrlCache,
    callbacks: Callbacks,
}

export interface State {
    settings: SettingsDescriptionJson,
    generalSettings: GeneralSettings,
}

interface Callbacks {
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
    closeSettingsEditor(save: boolean, newGeneralSettings: GeneralSettings): void,
}

export class SettingsEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            settings: props.hotkeyConfig.settingsDescriptionAsJson(),
            generalSettings: { ...props.generalSettings },
        };
    }

    public render() {
        const renderedView = this.renderView();
        const sidebarContent = this.renderSidebarContent();
        return this.props.callbacks.renderViewWithSidebar(renderedView, sidebarContent);
    }

    private renderView() {
        return (
            <div className="settings-editor">
                <h2>Hotkeys</h2>
                <SettingsComponent
                    context="settings-editor-hotkeys"
                    factory={SettingValue}
                    state={this.state.settings}
                    editorUrlCache={this.props.urlCache}
                    setValue={(index, value) => {
                        if (!this.props.hotkeyConfig.setValue(index, value)) {
                            toast.error("The hotkey is already in use.");
                            return;
                        }
                        this.update();
                    }}
                />
                <h2>General</h2>
                <SettingsComponent
                    context="settings-editor-general"
                    factory={new JsonSettingValueFactory()}
                    state={{
                        fields: [
                            {
                                text: "Show Control Buttons",
                                tooltip: "Determines whether to show buttons beneath the timer that allow controlling it. When disabled, you have to use the hotkeys instead.",
                                value: { Bool: this.state.generalSettings.showControlButtons },
                            },
                            {
                                text: "Frame Rate",
                                tooltip: "Determines the frame rate at which to display the timer. \"Battery Aware\" tries determining the type of device and charging status to select a good frame rate. \"Match Screen\" makes the timer match the screen's refresh rate.",
                                value: {
                                    CustomCombobox: {
                                        value: this.state.generalSettings.frameRate === FRAME_RATE_MATCH_SCREEN ? FRAME_RATE_MATCH_SCREEN : this.state.generalSettings.frameRate === FRAME_RATE_BATTERY_AWARE ? FRAME_RATE_BATTERY_AWARE : this.state.generalSettings.frameRate.toString() + " FPS",
                                        list: [FRAME_RATE_BATTERY_AWARE, "30 FPS", "60 FPS", "120 FPS", FRAME_RATE_MATCH_SCREEN],
                                        mandatory: true,
                                    }
                                },
                            },
                        ],
                    }}
                    editorUrlCache={this.props.urlCache}
                    setValue={(index, value) => {
                        switch (index) {
                            case 0:
                                if ("Bool" in value) {
                                    this.setState({
                                        generalSettings: {
                                            ...this.state.generalSettings,
                                            showControlButtons: value.Bool,
                                        },
                                    });
                                }
                                break;
                            case 1:
                                if ("String" in value) {
                                    this.setState({
                                        generalSettings: {
                                            ...this.state.generalSettings,
                                            frameRate: value.String === FRAME_RATE_MATCH_SCREEN
                                                ? FRAME_RATE_MATCH_SCREEN
                                                : value.String === FRAME_RATE_BATTERY_AWARE
                                                    ? FRAME_RATE_BATTERY_AWARE
                                                    : parseInt(value.String.split(' ')[0], 10) as FrameRateSetting,
                                        },
                                    });
                                }
                                break;
                        }
                    }}
                />
            </div>
        );
    }

    private renderSidebarContent() {
        return (
            <div className="sidebar-buttons">
                <h1>Settings</h1>
                <hr />
                <div className="small">
                    <button
                        className="toggle-left"
                        onClick={(_) => this.props.callbacks.closeSettingsEditor(true, this.state.generalSettings)}
                    >
                        <i className="fa fa-check" aria-hidden="true" /> OK
                    </button>
                    <button
                        className="toggle-right"
                        onClick={(_) => this.props.callbacks.closeSettingsEditor(false, this.state.generalSettings)}
                    >
                        <i className="fa fa-times" aria-hidden="true" /> Cancel
                    </button>
                </div>
            </div>
        );
    }

    private update() {
        this.setState({
            settings: this.props.hotkeyConfig.settingsDescriptionAsJson(),
        });
    }
}
