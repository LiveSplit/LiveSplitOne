import * as React from "react";
import { Option, map } from "../util/OptionUtil";

import "../css/HotkeyButton.scss";

let layoutMap: { get: (keyCode: string) => string | undefined; } | null = null;

(navigator as any).keyboard?.getLayoutMap()?.then((m: any) => {
    layoutMap = m;
});

function resolveKey(keyCode: string): string {
    if (layoutMap == null) {
        return keyCode;
    }
    const lowercase = layoutMap.get(keyCode);
    if (lowercase === undefined) {
        return keyCode;
    }
    if (lowercase === "ß") {
        // ß uppercases to SS, but that's not what's on the keyboard.
        return lowercase;
    }
    return lowercase.toUpperCase();
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
            buttonText = resolveKey(value);
        } else if (this.state.listener != null) {
            buttonText = <i className="fa fa-circle" aria-hidden="true" />;
        }

        return (
            <div className="hotkey-box">
                <button
                    className={`hotkey-button ${this.state.listener != null ? "focused" : ""}`}
                    onClick={() => this.focusButton()}
                >
                    {buttonText}
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
                handleEvent: (ev: KeyboardEvent) => this.props.setValue(ev.code),
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
