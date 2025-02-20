import * as React from "react";
import { Option, map, expect } from "../util/OptionUtil";
import { hotkeySystem } from "./LiveSplit";

import "../css/HotkeyButton.scss";

function resolveKey(keyCode: string): Promise<string> | string {
    return expect(hotkeySystem, "The Hotkey System should always be initialized.").resolve(keyCode);
}

export interface Props {
    value: Option<string>,
    setValue: (value: Option<string>) => void,
}

export interface State {
    listener: Option<EventListenerObject>,
    intervalHandle: Option<number>,
    resolvedKey: Option<string>,
}

export default class HotkeyButton extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            listener: null,
            intervalHandle: null,
            resolvedKey: null,
        };

        this.updateResolvedKey(props.value);
    }
    public componentDidUpdate(previousProps: Props) {
        if (previousProps.value !== this.props.value) {
            this.updateResolvedKey(this.props.value);
        }
    }

    private async updateResolvedKey(value: Option<string>): Promise<void> {
        let resolvedKey = "";
        if (value != null) {
            const matches = value.match(/(.+)\+\s*(.+)$/);
            if (matches != null) {
                resolvedKey = `${matches[1]}+ ${await resolveKey(matches[2])}`;
            } else {
                resolvedKey = await resolveKey(value);
            }
        }
        this.setState({ resolvedKey });
    }

    public render() {
        let buttonText: Option<string> | React.JSX.Element = null;
        if (this.props.value != null) {
            buttonText = this.state.resolvedKey;
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
                    <span className="tooltip-text">
                        Click to record a hotkey. You may also use buttons on a gamepad.
                        Global hotkeys are currently not possible. Gamepad buttons work globally.
                    </span>
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
