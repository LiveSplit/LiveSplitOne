import React, { useState } from "react";

import {
    JsonSettingValueFactory,
    SettingsComponent,
} from "../components/Settings";
import {
    SettingsDescriptionJson,
    SettingValue,
    HotkeyConfig,
} from "../../livesplit-core";
import { toast } from "react-toastify";
import { UrlCache } from "../../util/UrlCache";
import {
    FRAME_RATE_AUTOMATIC as FRAME_RATE_BATTERY_AWARE,
    FRAME_RATE_MATCH_SCREEN as FRAME_RATE_MATCH_SCREEN,
    FrameRateSetting,
} from "../../util/FrameRate";
import { LiveSplitServer } from "../../api/LiveSplitServer";
import { Option } from "../../util/OptionUtil";
import { LSOCommandSink } from "../../util/LSOCommandSink";
import { Check, FlaskConical, X } from "lucide-react";

import * as buttonGroupClasses from "../../css/ButtonGroup.module.scss";

export interface GeneralSettings {
    frameRate: FrameRateSetting;
    showControlButtons: boolean;
    showManualGameTime: ManualGameTimeSettings | false;
    saveOnReset: boolean;
    speedrunComIntegration: boolean;
    serverUrl?: string;
    alwaysOnTop?: boolean;
}

export interface ManualGameTimeSettings {
    mode: string;
}

export const MANUAL_GAME_TIME_MODE_SEGMENT_TIMES = "Segment Times";
export const MANUAL_GAME_TIME_MODE_SPLIT_TIMES = "Split Times";
export const MANUAL_GAME_TIME_SETTINGS_DEFAULT: ManualGameTimeSettings = {
    mode: MANUAL_GAME_TIME_MODE_SEGMENT_TIMES,
};

export interface Props {
    generalSettings: GeneralSettings;
    hotkeyConfig: HotkeyConfig;
    urlCache: UrlCache;
    callbacks: Callbacks;
    serverConnection: Option<LiveSplitServer>;
    commandSink: LSOCommandSink;
    allComparisons: string[];
    allVariables: Set<string>;
}

export interface State {
    settings: SettingsDescriptionJson;
    generalSettings: GeneralSettings;
}

interface Callbacks {
    renderViewWithSidebar(
        renderedView: React.JSX.Element,
        sidebarContent: React.JSX.Element,
    ): React.JSX.Element;
    closeMainSettings(save: boolean, newGeneralSettings: GeneralSettings): void;
    onServerConnectionOpened(serverConnection: LiveSplitServer): void;
    onServerConnectionClosed(): void;
    forceUpdate(): void;
}

export function MainSettings(props: Props) {
    return props.callbacks.renderViewWithSidebar(
        <View {...props} />,
        <SideBar
            callbacks={props.callbacks}
            generalSettings={props.generalSettings}
        />,
    );
}

export function View({
    generalSettings,
    hotkeyConfig,
    urlCache,
    callbacks,
    serverConnection,
    commandSink,
    allComparisons,
    allVariables,
}: Props) {
    const [settings, setSettings] = useState(() =>
        hotkeyConfig.settingsDescriptionAsJson(),
    );
    // TODO: Use memo instead?
    const [generalSettingsState, setGeneralSettings] = useState(() => ({
        ...generalSettings,
    }));
    const [, forceUpdate] = useState({});

    const update = () => {
        setSettings(hotkeyConfig.settingsDescriptionAsJson());
    };

    const generalFields = [
        {
            text: "Frame Rate",
            tooltip:
                'Determines the frame rate at which to display the timer. "Battery Aware" tries determining the type of device and charging status to select a good frame rate. "Match Screen" makes the timer match the screen\'s refresh rate.',
            value: {
                CustomCombobox: {
                    value:
                        generalSettingsState.frameRate ===
                        FRAME_RATE_MATCH_SCREEN
                            ? FRAME_RATE_MATCH_SCREEN
                            : generalSettingsState.frameRate ===
                                FRAME_RATE_BATTERY_AWARE
                              ? FRAME_RATE_BATTERY_AWARE
                              : generalSettingsState.frameRate.toString() +
                                " FPS",
                    list: [
                        FRAME_RATE_BATTERY_AWARE,
                        "30 FPS",
                        "60 FPS",
                        "120 FPS",
                        FRAME_RATE_MATCH_SCREEN,
                    ],
                    mandatory: true,
                },
            },
        },
        {
            text: "Save On Reset",
            tooltip:
                "Determines whether to automatically save the splits when resetting the timer.",
            value: {
                Bool: generalSettingsState.saveOnReset,
            },
        },
        {
            text: "Show Control Buttons",
            tooltip:
                "Determines whether to show buttons beneath the timer that allow controlling it. When disabled, you have to use the hotkeys instead.",
            value: { Bool: generalSettingsState.showControlButtons },
        },
        {
            text: "Show Manual Game Time Input",
            tooltip:
                'Shows a text box beneath the timer that allows you to manually input the game time. You start the timer and do splits by pressing the Enter key in the text box. Make sure to compare against "Game Time".',
            value: {
                Bool: generalSettingsState.showManualGameTime !== false,
            },
        },
    ];

    let manualGameTimeModeIndex = 0;
    if (generalSettingsState.showManualGameTime) {
        manualGameTimeModeIndex = generalFields.length;
        generalFields.push({
            text: "Manual Game Time Mode",
            tooltip:
                "Determines whether to input the manual game time as segment times or split times.",
            value: {
                CustomCombobox: {
                    value: generalSettingsState.showManualGameTime.mode,
                    list: [
                        MANUAL_GAME_TIME_MODE_SEGMENT_TIMES,
                        MANUAL_GAME_TIME_MODE_SPLIT_TIMES,
                    ],
                    mandatory: false,
                },
            },
        });
    }

    let alwaysOnTopIndex = 0;
    if (window.__TAURI__ != null) {
        alwaysOnTopIndex = generalFields.length;
        generalFields.push({
            text: "Always On Top",
            tooltip: "Keeps the window always on top of other windows.",
            value: { Bool: generalSettingsState.alwaysOnTop! },
        });
    }

    return (
        <div>
            <h2>Hotkeys</h2>
            <SettingsComponent
                context="settings-editor-hotkeys"
                factory={SettingValue}
                state={settings}
                editorUrlCache={urlCache}
                allComparisons={allComparisons}
                allVariables={allVariables}
                setValue={(index, value) => {
                    if (!hotkeyConfig.setValue(index, value)) {
                        toast.error("The hotkey is already in use.");
                        return;
                    }
                    update();
                }}
            />
            <h2>General</h2>
            <SettingsComponent
                context="settings-editor-general"
                factory={new JsonSettingValueFactory()}
                state={{
                    fields: generalFields,
                }}
                editorUrlCache={urlCache}
                allComparisons={allComparisons}
                allVariables={allVariables}
                setValue={(index, value) => {
                    switch (index) {
                        case 0:
                            if ("String" in value) {
                                setGeneralSettings({
                                    ...generalSettingsState,
                                    frameRate:
                                        value.String === FRAME_RATE_MATCH_SCREEN
                                            ? FRAME_RATE_MATCH_SCREEN
                                            : value.String ===
                                                FRAME_RATE_BATTERY_AWARE
                                              ? FRAME_RATE_BATTERY_AWARE
                                              : (parseInt(
                                                    value.String.split(" ")[0],
                                                    10,
                                                ) as FrameRateSetting),
                                });
                            }
                            break;
                        case 1:
                            if ("Bool" in value) {
                                setGeneralSettings({
                                    ...generalSettingsState,
                                    saveOnReset: value.Bool,
                                });
                            }
                            break;
                        case 2:
                            if ("Bool" in value) {
                                setGeneralSettings({
                                    ...generalSettingsState,
                                    showControlButtons: value.Bool,
                                });
                            }
                            break;
                        case 3:
                            if ("Bool" in value) {
                                setGeneralSettings({
                                    ...generalSettingsState,
                                    showManualGameTime: value.Bool
                                        ? MANUAL_GAME_TIME_SETTINGS_DEFAULT
                                        : false,
                                });
                            }
                            break;
                        default:
                            if (index === alwaysOnTopIndex && "Bool" in value) {
                                setGeneralSettings({
                                    ...generalSettingsState,
                                    alwaysOnTop: value.Bool,
                                });
                            } else if (
                                index === manualGameTimeModeIndex &&
                                "String" in value
                            ) {
                                setGeneralSettings({
                                    ...generalSettingsState,
                                    showManualGameTime: {
                                        mode: value.String,
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
                            tooltip:
                                "Queries the list of games, categories, and the leaderboards from speedrun.com.",
                            value: {
                                Bool: generalSettingsState.speedrunComIntegration,
                            },
                        },
                        {
                            text: (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.25em",
                                    }}
                                >
                                    Server Connection{" "}
                                    <FlaskConical
                                        size={16}
                                        color="#07bc0c"
                                        strokeWidth={2.5}
                                    />
                                </div>
                            ),
                            tooltip: (
                                <>
                                    Allows you to connect to a WebSocket server
                                    that can control the timer by sending
                                    various commands. The commands are currently
                                    a subset of the commands the original
                                    LiveSplit supports.
                                    <br />
                                    <br />
                                    This feature is <b>experimental</b> and the
                                    protocol will likely change in the future.
                                </>
                            ),
                            value: {
                                ServerConnection: {
                                    url: generalSettings.serverUrl,
                                    connection: serverConnection,
                                },
                            },
                        },
                    ],
                }}
                editorUrlCache={urlCache}
                allComparisons={allComparisons}
                allVariables={allVariables}
                setValue={(index, value) => {
                    switch (index) {
                        case 0:
                            if ("Bool" in value) {
                                setGeneralSettings({
                                    ...generalSettingsState,
                                    speedrunComIntegration: value.Bool,
                                });
                            }
                            break;
                        case 1:
                            if ("String" in value) {
                                try {
                                    callbacks.onServerConnectionOpened(
                                        new LiveSplitServer(
                                            value.String,
                                            () => forceUpdate({}),
                                            () =>
                                                callbacks.onServerConnectionClosed(),
                                            commandSink,
                                        ),
                                    );
                                } catch {
                                    // It's fine if it fails.
                                }
                                setGeneralSettings({
                                    ...generalSettingsState,
                                    serverUrl: value.String,
                                });
                            }
                            break;
                    }
                }}
            />
        </div>
    );
}

export function SideBar({
    callbacks,
    generalSettings,
}: {
    callbacks: Callbacks;
    generalSettings: GeneralSettings;
}) {
    return (
        <>
            <h1>Settings</h1>
            <hr />
            <div className={buttonGroupClasses.group}>
                <button
                    onClick={(_) =>
                        callbacks.closeMainSettings(true, generalSettings)
                    }
                >
                    <Check strokeWidth={2.5} /> OK
                </button>
                <button
                    onClick={(_) =>
                        callbacks.closeMainSettings(false, generalSettings)
                    }
                >
                    <X strokeWidth={2.5} /> Cancel
                </button>
            </div>
        </>
    );
}
