import React, { useCallback, useEffect, useState } from "react";
import { type Option, expect } from "../../../util/OptionUtil";
import { hotkeySystem } from "../../LiveSplit";
import { Circle, Trash } from "lucide-react";
import { Label, orAutoLang, resolve } from "../../../localization";
import { type Language } from "../../../livesplit-core";

import classes from "../../../css/HotkeyButton.module.css";
import tooltipClasses from "../../../css/Tooltip.module.css";

function resolveHotkey(
    hotkey: string,
    lang: Language | undefined,
): Promise<string> | string {
    return expect(
        hotkeySystem,
        "The Hotkey System should always be initialized.",
        lang,
    ).resolveHotkey(hotkey, orAutoLang(lang));
}

export function HotkeyButton({
    value,
    setValue,
    lang,
}: {
    value: Option<string>;
    setValue: (value: Option<string>) => void;
    lang: Language | undefined;
}) {
    const [listener, setListener] = useState<Option<EventListenerObject>>(null);
    const [intervalHandle, setIntervalHandle] = useState<Option<number>>(null);
    const [resolvedKey, setResolvedKey] = useState<Option<string>>(null);

    const updateResolvedKey = useCallback(
        async (value: Option<string>): Promise<void> => {
            // Resolve the entire binding in core so modifier names and their
            // order follow the selected language and native platform. Keep
            // `value` unchanged: only stable identifiers belong in the config.
            setResolvedKey(
                value != null ? await resolveHotkey(value, lang) : "",
            );
        },
        [lang],
    );

    useEffect(() => {
        updateResolvedKey(value);
    }, [value, updateResolvedKey]);

    const focusButton = () => {
        let newListener = listener;
        let newIntervalHandle = intervalHandle;

        if (newListener == null) {
            newListener = {
                handleEvent: (ev: KeyboardEvent) => {
                    if (ev.repeat) {
                        return;
                    }
                    let text = "";
                    if (
                        ev.ctrlKey &&
                        ev.code !== "ControlLeft" &&
                        ev.code !== "ControlRight"
                    ) {
                        text += "Ctrl + ";
                    }
                    if (
                        ev.altKey &&
                        ev.code !== "AltLeft" &&
                        ev.code !== "AltRight"
                    ) {
                        text += "Alt + ";
                    }
                    if (
                        ev.metaKey &&
                        ev.code !== "MetaLeft" &&
                        ev.code !== "MetaRight"
                    ) {
                        text += "Meta + ";
                    }
                    if (
                        ev.shiftKey &&
                        ev.code !== "ShiftLeft" &&
                        ev.code !== "ShiftRight"
                    ) {
                        text += "Shift + ";
                    }
                    text += ev.code;
                    setValue(text);
                    ev.preventDefault();
                },
            };

            window.addEventListener("keydown", newListener);
        }

        if (newIntervalHandle == null) {
            const oldButtonState: boolean[][] = [];
            newIntervalHandle = window.setInterval(() => {
                const gamepads = navigator.getGamepads();

                let gamepadIdx = 0;
                for (const gamepad of gamepads) {
                    const gamepadState = oldButtonState[gamepadIdx] ?? [];
                    oldButtonState[gamepadIdx] = gamepadState;

                    if (gamepad != null) {
                        let buttonIdx = 0;
                        for (const button of gamepad.buttons) {
                            const oldState = gamepadState[buttonIdx] ?? false;
                            if (button.pressed && !oldState) {
                                setValue(`Gamepad${buttonIdx}`);
                            }

                            gamepadState[buttonIdx] = button.pressed;

                            buttonIdx++;
                        }
                    }

                    gamepadIdx++;
                }
            }, 1000 / 60.0);
        }

        setListener(newListener);
        setIntervalHandle(newIntervalHandle);
    };

    const blurButton = () => {
        if (listener != null) {
            window.removeEventListener("keydown", listener);
        }
        if (intervalHandle != null) {
            window.clearInterval(intervalHandle);
        }
        setListener(null);
        setIntervalHandle(null);
    };

    let buttonText: Option<string> | React.JSX.Element = null;
    if (value != null) {
        buttonText = resolvedKey;
    } else if (listener != null) {
        buttonText = <Circle strokeWidth={0} size={16} fill="currentColor" />;
    }

    return (
        <div className={classes.hotkeyBox}>
            <button
                className={`${tooltipClasses.tooltip} ${listener != null ? classes.focused : ""}`}
                onClick={focusButton}
            >
                {buttonText}
                <span className={tooltipClasses.tooltipText}>
                    {resolve(Label.HotkeyButtonTooltip, lang)}
                </span>
            </button>
            {value && (
                <Trash
                    className={classes.trash}
                    strokeWidth={2.5}
                    size={20}
                    onClick={() => setValue(null)}
                />
            )}
            {listener != null && (
                <div className={classes.overlay} onClick={blurButton} />
            )}
        </div>
    );
}
