import * as React from "react";
import { Option, map, expect } from "../util/OptionUtil";
import { hotkeySystem } from "./LiveSplit";

import "../css/HotkeyButton.scss";

function resolveKey(keyCode: string): string {
    return expect(hotkeySystem, "The Hotkey System should always be initialized.").resolve(keyCode);
}

export interface Props {
    value: Option<string>,
    setValue: (value: Option<string>) => void,
}

export interface State {
    listener: Option<EventListenerObject>,
    intervalHandle: Option<number>,
}

export default class HotkeyButton extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            listener: null,
            intervalHandle: null,
        };
    }

    public render() {
        const value = this.props.value;
        let buttonText = null;
        if (value != null) {
            const matches = value.match(/(.+)\+\s*(.+)$/);
            if (matches != null) {
                buttonText = `${matches[1]}+ ${resolveKey(matches[2])}`;
            } else {
                buttonText = resolveKey(value);
            }
        } else if (this.state.listener != null) {
            buttonText = <i className="fa fa-circle" aria-hidden="true" />;
        }

        return (
            <div className="hotkey-box">
                <button
                    className={`hotkey-button tooltip ${this.state.listener != null ? "focused" : ""}`}
                    onClick={() => this.focusButton()}
                >
                    {buttonText}
                    <span className="tooltip-text">Click to record a hotkey. You may also use buttons on a gamepad.</span>
                </button>
                {
                    map(this.props.value, () => (
                        <button
                            className="hotkey-clear"
                            onClick={() => this.props.setValue(null)}
                        >
                            <i className="fa fa-trash" aria-hidden="true" />
                        </button>
                    ))
                }
                {this.state.listener != null &&
                    <div
                        style={{
                            bottom: "0px",
                            left: "0px",
                            position: "fixed",
                            right: "0px",
                            top: "0px",
                            zIndex: 5,
                        }}
                        onClick={() => this.blurButton()}
                    />
                }
            </div>
        );
    }

    private focusButton() {
        let listener = this.state.listener;
        let intervalHandle = this.state.intervalHandle;

        if (listener === null) {
            listener = {
                handleEvent: (ev: KeyboardEvent) => {
                    if (ev.repeat) {
                        return;
                    }
                    let text = "";
                    if (ev.ctrlKey && ev.code !== "ControlLeft" && ev.code !== "ControlRight") {
                        text += "Ctrl + ";
                    }
                    if (ev.altKey && ev.code !== "AltLeft" && ev.code !== "AltRight") {
                        text += "Alt + ";
                    }
                    if (ev.metaKey && ev.code !== "MetaLeft" && ev.code !== "MetaRight") {
                        text += "Meta + ";
                    }
                    if (ev.shiftKey && ev.code !== "ShiftLeft" && ev.code !== "ShiftRight") {
                        text += "Shift + ";
                    }
                    text += ev.code;
                    this.props.setValue(text);
                    ev.preventDefault();
                }
            };

            window.addEventListener("keydown", listener);
        }

        if (intervalHandle === null) {
            const oldButtonState: boolean[][] = [];
            intervalHandle = window.setInterval(() => {
                const gamepads = navigator.getGamepads();

                let gamepadIdx = 0;
                for (const gamepad of gamepads) {
                    if (gamepadIdx >= oldButtonState.length) {
                        oldButtonState[gamepadIdx] = [];
                    }

                    if (gamepad !== null) {
                        let buttonIdx = 0;
                        for (const button of gamepad.buttons) {
                            const oldState = oldButtonState[gamepadIdx]?.[buttonIdx] ?? false;
                            if (button.pressed && !oldState) {
                                this.props.setValue(`Gamepad${buttonIdx}`);
                            }

                            oldButtonState[gamepadIdx][buttonIdx] = button.pressed;

                            buttonIdx++;
                        }
                    }

                    gamepadIdx++;
                }
            }, 1000 / 60.0);
        }

        this.setState({
            listener,
            intervalHandle,
        });
    }

    private blurButton() {
        if (this.state.listener != null) {
            window.removeEventListener("keydown", this.state.listener);
        }
        if (this.state.intervalHandle != null) {
            window.clearTimeout(this.state.intervalHandle);
        }
        this.setState({
            listener: null,
            intervalHandle: null,
        });
    }
}
