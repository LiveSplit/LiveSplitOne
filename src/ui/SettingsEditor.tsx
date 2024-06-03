import * as React from "react";

import { JsonSettingValueFactory, SettingsComponent } from "./Settings";
import { SettingsDescriptionJson, SettingValue, HotkeyConfig } from "../livesplit-core";
import { toast } from "react-toastify";
import { UrlCache } from "../util/UrlCache";
import { FRAME_RATE_AUTOMATIC as FRAME_RATE_BATTERY_AWARE, FRAME_RATE_MATCH_SCREEN as FRAME_RATE_MATCH_SCREEN, FrameRateSetting } from "../util/FrameRate";
import { LiveSplitServer } from "../api/LiveSplitServer";
import { Option } from "../util/OptionUtil";
import { LSOEventSink } from "./LSOEventSink";

import "../css/SettingsEditor.scss";

export interface GeneralSettings {
    frameRate: FrameRateSetting,
    showControlButtons: boolean,
    showManualGameTime: boolean,
    saveOnReset: boolean,
    speedrunComIntegration: boolean,
    splitsIoIntegration: boolean,
    serverUrl: string | undefined,
}

export interface Props {
    generalSettings: GeneralSettings,
    hotkeyConfig: HotkeyConfig,
    urlCache: UrlCache,
    callbacks: Callbacks,
    serverConnection: Option<LiveSplitServer>,
    eventSink: LSOEventSink,
    allComparisons: string[],
}

export interface State {
    settings: SettingsDescriptionJson,
    generalSettings: GeneralSettings,
}

interface Callbacks {
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
    closeSettingsEditor(save: boolean, newGeneralSettings: GeneralSettings): void,
    onServerConnectionOpened(serverConnection: LiveSplitServer): void,
    onServerConnectionClosed(): void,
    forceUpdate(): void,
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
                    allComparisons={this.props.allComparisons}
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
                            {
                                text: "Show Control Buttons",
                                tooltip: "Determines whether to show buttons beneath the timer that allow controlling it. When disabled, you have to use the hotkeys instead.",
                                value: { Bool: this.state.generalSettings.showControlButtons },
                            },
                            {
                                text: "Show Manual Game Time Input",
                                tooltip: "Shows a text box beneath the timer that allows you to manually input the game time. You start the timer and do splits by pressing the Enter key in the text box. Make sure to compare against \"Game Time\".",
                                value: { Bool: this.state.generalSettings.showManualGameTime },
                            },
                            {
                                text: "Save On Reset",
                                tooltip: "Determines whether to automatically save the splits when resetting the timer.",
                                value: {
                                    Bool: this.state.generalSettings.saveOnReset,
                                },
                            },
                        ],
                    }}
                    editorUrlCache={this.props.urlCache}
                    allComparisons={this.props.allComparisons}
                    setValue={(index, value) => {
                        switch (index) {
                            case 0:
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
                            case 1:
                                if ("Bool" in value) {
                                    this.setState({
                                        generalSettings: {
                                            ...this.state.generalSettings,
                                            showControlButtons: value.Bool,
                                        },
                                    });
                                }
                                break;
                            case 2:
                                if ("Bool" in value) {
                                    this.setState({
                                        generalSettings: {
                                            ...this.state.generalSettings,
                                            showManualGameTime: value.Bool,
                                        },
                                    });
                                }
                                break;
                            case 3:
                                if ("Bool" in value) {
                                    this.setState({
                                        generalSettings: {
                                            ...this.state.generalSettings,
                                            saveOnReset: value.Bool,
                                        },
                                    });
                                }
                                break;
                        }
                    }}
                />
                <h2>Network</h2>
                <SettingsComponent
                    context="settings-editor-general"
                    factory={new JsonSettingValueFactory()}
                    state={{
                        fields: [
                            {
                                text: "Speedrun.com Integration",
                                tooltip: "Queries the list of games, categories, and the leaderboards from speedrun.com.",
                                value: { Bool: this.state.generalSettings.speedrunComIntegration },
                            },
                            {
                                text: "Splits.io Integration",
                                tooltip: "Allows you to upload splits to and download splits from splits.io.",
                                value: { Bool: this.state.generalSettings.splitsIoIntegration },
                            },
                            {
                                text: <>
                                    Server Connection <i className="fa fa-flask" style={{ color: "#07bc0c" }} aria-hidden="true" />
                                </>,
                                tooltip: <>
                                    Allows you to connect to a WebSocket server that can control the timer by sending various commands. The commands are currently a subset of the commands the original LiveSplit supports.<br /><br />
                                    This feature is <b>experimental</b> and the protocol will likely change in the future.
                                </>,
                                value: {
                                    ServerConnection: {
                                        url: this.props.generalSettings.serverUrl,
                                        connection: this.props.serverConnection,
                                    },
                                }
                            },
                        ],
                    }}
                    editorUrlCache={this.props.urlCache}
                    allComparisons={this.props.allComparisons}
                    setValue={(index, value) => {
                        switch (index) {
                            case 0:
                                if ("Bool" in value) {
                                    this.setState({
                                        generalSettings: {
                                            ...this.state.generalSettings,
                                            speedrunComIntegration: value.Bool,
                                        },
                                    });
                                }
                                break;
                            case 1:
                                if ("Bool" in value) {
                                    this.setState({
                                        generalSettings: {
                                            ...this.state.generalSettings,
                                            splitsIoIntegration: value.Bool,
                                        },
                                    });
                                }
                                break;
                            case 2:
                                if ("String" in value) {
                                    try {
                                        this.props.callbacks.onServerConnectionOpened(new LiveSplitServer(
                                            value.String,
                                            () => this.forceUpdate(),
                                            () => this.props.callbacks.onServerConnectionClosed(),
                                            this.props.eventSink,
                                        ));
                                    } catch {
                                        // It's fine if it fails.
                                    }
                                    this.setState({
                                        generalSettings: {
                                            ...this.state.generalSettings,
                                            serverUrl: value.String,
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
