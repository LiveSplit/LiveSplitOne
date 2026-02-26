import React, { useState } from "react";

import {
    JsonSettingValueFactory,
    SettingsComponent,
} from "../components/Settings";
import {
    SettingsDescriptionJson,
    SettingValue,
    HotkeyConfig,
    Lang,
    Language,
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
import { Check, ExternalLink, FlaskConical, X } from "lucide-react";

import buttonGroupClasses from "../../css/ButtonGroup.module.css";
import { Label, orAutoLang, resolve, setHtmlLang } from "../../localization";

export interface GeneralSettings {
    themeMode: ThemeMode;
    frameRate: FrameRateSetting;
    showControlButtons: boolean;
    showManualGameTime: ManualGameTimeSettings | false;
    saveOnReset: boolean;
    speedrunComIntegration: boolean;
    serverUrl?: string;
    theRunGgIntegration?: TheRunGgSettings;
    alwaysOnTop?: boolean;
    lang: Language | undefined;
}

export interface TheRunGgSettings {
    uploadKey: string;
    liveTracking: boolean;
    statsUploading: boolean;
}

export type ThemeMode =
    | typeof THEME_MODE_AUTOMATIC
    | typeof THEME_MODE_LIGHT
    | typeof THEME_MODE_DARK;

export const THEME_MODE_AUTOMATIC = "automatic";
export const THEME_MODE_LIGHT = "light";
export const THEME_MODE_DARK = "dark";

export function previewThemeMode(themeMode: ThemeMode) {
    const root = document.documentElement;
    if (themeMode === THEME_MODE_AUTOMATIC) {
        root.removeAttribute("data-theme");
    } else {
        root.setAttribute("data-theme", themeMode);
    }
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
    // TODO: Use memo instead?
    const [generalSettingsState, setGeneralSettings] = useState(() => ({
        ...props.generalSettings,
    }));

    return props.callbacks.renderViewWithSidebar(
        <View
            {...props}
            generalSettings={generalSettingsState}
            setGeneralSettings={setGeneralSettings}
        />,
        <SideBar
            callbacks={props.callbacks}
            generalSettings={generalSettingsState}
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
    setGeneralSettings,
}: Props & {
    setGeneralSettings: React.Dispatch<React.SetStateAction<GeneralSettings>>;
}) {
    const [settings, setSettings] = useState(() =>
        hotkeyConfig.settingsDescriptionAsJson(
            orAutoLang(generalSettings.lang),
        ),
    );
    const [, forceUpdate] = useState({});

    const update = () => {
        setSettings(
            hotkeyConfig.settingsDescriptionAsJson(
                orAutoLang(generalSettings.lang),
            ),
        );
    };

    const lang = generalSettings.lang;

    const generalFields = [
        {
            text: resolve(Label.Language, lang),
            tooltip: resolve(Label.LanguageDescription, lang),
            value: {
                CustomCombobox: {
                    value:
                        generalSettings.lang != null
                            ? `${generalSettings.lang}`
                            : "Auto",
                    list: [
                        ["Auto", resolve(Label.LanguageAuto, lang)],
                        [`${Language.English}`, Lang.name(Language.English)],
                        [`${Language.Dutch}`, Lang.name(Language.Dutch)],
                        [`${Language.French}`, Lang.name(Language.French)],
                        [`${Language.German}`, Lang.name(Language.German)],
                        [`${Language.Italian}`, Lang.name(Language.Italian)],
                        [
                            `${Language.Portuguese}`,
                            Lang.name(Language.Portuguese),
                        ],
                        [`${Language.Polish}`, Lang.name(Language.Polish)],
                        [`${Language.Russian}`, Lang.name(Language.Russian)],
                        [`${Language.Spanish}`, Lang.name(Language.Spanish)],
                        [
                            `${Language.BrazilianPortuguese}`,
                            Lang.name(Language.BrazilianPortuguese),
                        ],
                        [
                            `${Language.ChineseSimplified}`,
                            Lang.name(Language.ChineseSimplified),
                        ],
                        [
                            `${Language.ChineseTraditional}`,
                            Lang.name(Language.ChineseTraditional),
                        ],
                        [`${Language.Japanese}`, Lang.name(Language.Japanese)],
                        [`${Language.Korean}`, Lang.name(Language.Korean)],
                    ] as [string, string][],
                    mandatory: true,
                },
            },
        },
        {
            text: resolve(Label.Theme, lang),
            tooltip: resolve(Label.ThemeDescription, lang),
            value: {
                CustomCombobox: {
                    value: generalSettings.themeMode,
                    list: [
                        [
                            THEME_MODE_AUTOMATIC,
                            resolve(Label.AlignmentAutomatic, lang),
                        ],
                        [THEME_MODE_LIGHT, resolve(Label.ThemeLightMode, lang)],
                        [THEME_MODE_DARK, resolve(Label.ThemeDarkMode, lang)],
                    ] as [string, string][],
                    mandatory: true,
                },
            },
        },
        {
            text: resolve(Label.FrameRate, lang),
            tooltip: resolve(Label.FrameRateDescription, lang),
            value: {
                CustomCombobox: {
                    value:
                        generalSettings.frameRate === FRAME_RATE_MATCH_SCREEN
                            ? FRAME_RATE_MATCH_SCREEN
                            : generalSettings.frameRate ===
                                FRAME_RATE_BATTERY_AWARE
                              ? FRAME_RATE_BATTERY_AWARE
                              : generalSettings.frameRate.toString() + " FPS",
                    list: [
                        [
                            FRAME_RATE_BATTERY_AWARE,
                            resolve(Label.FrameRateBatteryAware, lang),
                        ],
                        ["30 FPS", "30 FPS"],
                        ["60 FPS", "60 FPS"],
                        ["120 FPS", "120 FPS"],
                        [
                            FRAME_RATE_MATCH_SCREEN,
                            resolve(Label.FrameRateMatchScreen, lang),
                        ],
                    ] as [string, string][],
                    mandatory: true,
                },
            },
        },
        {
            text: resolve(Label.SaveOnReset, lang),
            tooltip: resolve(Label.SaveOnResetDescription, lang),
            value: {
                Bool: generalSettings.saveOnReset,
            },
        },
        {
            text: resolve(Label.ShowControlButtons, lang),
            tooltip: resolve(Label.ShowControlButtonsDescription, lang),
            value: { Bool: generalSettings.showControlButtons },
        },
        {
            text: resolve(Label.ShowManualGameTimeInput, lang),
            tooltip: resolve(Label.ShowManualGameTimeInputDescription, lang),
            value: {
                Bool: generalSettings.showManualGameTime !== false,
            },
        },
    ];

    let manualGameTimeModeIndex = 0;
    if (generalSettings.showManualGameTime) {
        manualGameTimeModeIndex = generalFields.length;
        generalFields.push({
            text: resolve(Label.ManualGameTimeMode, lang),
            tooltip: resolve(Label.ManualGameTimeModeDescription, lang),
            value: {
                CustomCombobox: {
                    value: generalSettings.showManualGameTime.mode,
                    list: [
                        [
                            MANUAL_GAME_TIME_MODE_SEGMENT_TIMES,
                            resolve(Label.ManualGameTimeModeSegmentTimes, lang),
                        ],
                        [
                            MANUAL_GAME_TIME_MODE_SPLIT_TIMES,
                            resolve(Label.ManualGameTimeModeSplitTimes, lang),
                        ],
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
            text: resolve(Label.AlwaysOnTop, lang),
            tooltip: resolve(Label.AlwaysOnTopDescription, lang),
            value: { Bool: generalSettings.alwaysOnTop! },
        });
    }

    return (
        <div>
            <h2>{resolve(Label.HotkeysHeading, lang)}</h2>
            <SettingsComponent
                context="settings-editor-hotkeys"
                factory={SettingValue}
                state={settings}
                editorUrlCache={urlCache}
                allComparisons={allComparisons}
                allVariables={allVariables}
                lang={lang}
                setValue={(index, value) => {
                    if (!hotkeyConfig.setValue(index, value)) {
                        toast.error(resolve(Label.HotkeyAlreadyInUse, lang));
                        return;
                    }
                    update();
                }}
            />
            <h2>{resolve(Label.GeneralHeading, lang)}</h2>
            <SettingsComponent
                context="settings-editor-general"
                factory={new JsonSettingValueFactory()}
                state={{
                    fields: generalFields,
                }}
                editorUrlCache={urlCache}
                allComparisons={allComparisons}
                allVariables={allVariables}
                lang={lang}
                setValue={(index, value) => {
                    switch (index) {
                        case 0:
                            if ("String" in value) {
                                const lang =
                                    value.String === "Auto"
                                        ? undefined
                                        : Number(value.String);

                                setHtmlLang(lang);

                                setSettings(
                                    hotkeyConfig.settingsDescriptionAsJson(
                                        orAutoLang(lang),
                                    ),
                                );

                                setGeneralSettings({
                                    ...generalSettings,
                                    lang,
                                });
                            }
                            break;
                        case 1:
                            if ("String" in value) {
                                const themeMode = value.String as ThemeMode;
                                if (
                                    themeMode !== THEME_MODE_AUTOMATIC &&
                                    themeMode !== THEME_MODE_LIGHT &&
                                    themeMode !== THEME_MODE_DARK
                                ) {
                                    break;
                                }

                                previewThemeMode(themeMode);

                                setGeneralSettings({
                                    ...generalSettings,
                                    themeMode,
                                });
                            }
                            break;
                        case 2:
                            if ("String" in value) {
                                setGeneralSettings({
                                    ...generalSettings,
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
                        case 3:
                            if ("Bool" in value) {
                                setGeneralSettings({
                                    ...generalSettings,
                                    saveOnReset: value.Bool,
                                });
                            }
                            break;
                        case 4:
                            if ("Bool" in value) {
                                setGeneralSettings({
                                    ...generalSettings,
                                    showControlButtons: value.Bool,
                                });
                            }
                            break;
                        case 5:
                            if ("Bool" in value) {
                                setGeneralSettings({
                                    ...generalSettings,
                                    showManualGameTime: value.Bool
                                        ? MANUAL_GAME_TIME_SETTINGS_DEFAULT
                                        : false,
                                });
                            }
                            break;
                        default:
                            if (index === alwaysOnTopIndex && "Bool" in value) {
                                setGeneralSettings({
                                    ...generalSettings,
                                    alwaysOnTop: value.Bool,
                                });
                            } else if (
                                index === manualGameTimeModeIndex &&
                                "String" in value
                            ) {
                                setGeneralSettings({
                                    ...generalSettings,
                                    showManualGameTime: {
                                        mode: value.String,
                                    },
                                });
                            }
                            break;
                    }
                }}
            />
            <h2>{resolve(Label.NetworkHeading, lang)}</h2>
            <SettingsComponent
                context="settings-editor-network"
                factory={new JsonSettingValueFactory()}
                state={{
                    fields: [
                        {
                            text: resolve(Label.SpeedrunComIntegration, lang),
                            tooltip: resolve(
                                Label.SpeedrunComIntegrationDescription,
                                lang,
                            ),
                            value: {
                                Bool: generalSettings.speedrunComIntegration,
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
                                    {resolve(Label.ServerConnection, lang)}
                                    <FlaskConical
                                        size={16}
                                        color="#07bc0c"
                                        strokeWidth={2.5}
                                    />
                                </div>
                            ),
                            tooltip: (
                                <>
                                    {resolve(
                                        Label.ServerConnectionDescription,
                                        lang,
                                    )}
                                    <br />
                                    <br />
                                    <b>
                                        {resolve(
                                            Label.ServerConnectionExperimental,
                                            lang,
                                        )}
                                    </b>
                                </>
                            ),
                            value: {
                                ServerConnection: {
                                    url: generalSettings.serverUrl,
                                    connection: serverConnection,
                                },
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
                                    {resolve(Label.TheRunGgIntegration, lang)}
                                    <a
                                        href="https://therun.gg/livesplit"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="therun.gg/livesplit"
                                    >
                                        <ExternalLink
                                            size={16}
                                            strokeWidth={2.5}
                                        />
                                    </a>
                                </div>
                            ),
                            tooltip: resolve(
                                Label.TheRunGgIntegrationDescription,
                                lang,
                            ),
                            hint: "Password" as const,
                            value: {
                                String:
                                    generalSettings.theRunGgIntegration
                                        ?.uploadKey ?? "",
                            },
                        },
                        ...(generalSettings.theRunGgIntegration
                            ? [
                                  {
                                      text: resolve(
                                          Label.TheRunGgLiveTracking,
                                          lang,
                                      ),
                                      tooltip: resolve(
                                          Label.TheRunGgLiveTrackingDescription,
                                          lang,
                                      ),
                                      value: {
                                          Bool: generalSettings
                                              .theRunGgIntegration.liveTracking,
                                      },
                                  },
                                  {
                                      text: resolve(
                                          Label.TheRunGgStatsUploading,
                                          lang,
                                      ),
                                      tooltip: resolve(
                                          Label.TheRunGgStatsUploadingDescription,
                                          lang,
                                      ),
                                      value: {
                                          Bool: generalSettings
                                              .theRunGgIntegration
                                              .statsUploading,
                                      },
                                  },
                              ]
                            : []),
                    ],
                }}
                editorUrlCache={urlCache}
                allComparisons={allComparisons}
                allVariables={allVariables}
                lang={lang}
                setValue={(index, value) => {
                    switch (index) {
                        case 0:
                            if ("Bool" in value) {
                                setGeneralSettings({
                                    ...generalSettings,
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
                                    ...generalSettings,
                                    serverUrl: value.String,
                                });
                            }
                            break;
                        case 2:
                            if ("String" in value) {
                                const uploadKey = value.String;
                                setGeneralSettings({
                                    ...generalSettings,
                                    theRunGgIntegration:
                                        uploadKey.length > 0
                                            ? {
                                                  uploadKey,
                                                  liveTracking:
                                                      generalSettings
                                                          .theRunGgIntegration
                                                          ?.liveTracking ??
                                                      true,
                                                  statsUploading:
                                                      generalSettings
                                                          .theRunGgIntegration
                                                          ?.statsUploading ??
                                                      true,
                                              }
                                            : undefined,
                                });
                            }
                            break;
                        case 3:
                            if (
                                "Bool" in value &&
                                generalSettings.theRunGgIntegration
                            ) {
                                setGeneralSettings({
                                    ...generalSettings,
                                    theRunGgIntegration: {
                                        ...generalSettings.theRunGgIntegration,
                                        liveTracking: value.Bool,
                                    },
                                });
                            }
                            break;
                        case 4:
                            if (
                                "Bool" in value &&
                                generalSettings.theRunGgIntegration
                            ) {
                                setGeneralSettings({
                                    ...generalSettings,
                                    theRunGgIntegration: {
                                        ...generalSettings.theRunGgIntegration,
                                        statsUploading: value.Bool,
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

export function SideBar({
    callbacks,
    generalSettings,
}: {
    callbacks: Callbacks;
    generalSettings: GeneralSettings;
}) {
    return (
        <>
            <h1>{resolve(Label.Settings, generalSettings.lang)}</h1>
            <hr />
            <div className={buttonGroupClasses.group}>
                <button
                    onClick={(_) =>
                        callbacks.closeMainSettings(true, generalSettings)
                    }
                >
                    <Check strokeWidth={2.5} />
                    {resolve(Label.Ok, generalSettings.lang)}
                </button>
                <button
                    onClick={(_) =>
                        callbacks.closeMainSettings(false, generalSettings)
                    }
                >
                    <X strokeWidth={2.5} />
                    {resolve(Label.Cancel, generalSettings.lang)}
                </button>
            </div>
        </>
    );
}
