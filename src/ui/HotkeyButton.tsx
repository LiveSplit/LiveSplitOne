import * as React from "react";
import { Option, map } from "../util/OptionUtil";

import "../css/HotkeyButton.scss";

export interface Props {
    value: Option<string>,
    setValue: (value: Option<string>) => void,
}

export interface State {
    listener: Option<EventListenerObject>,
    intervalHandle: Option<number>,
}

export class HotkeyButton extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            listener: null,
            intervalHandle: null,
        };
    }

    public render() {
        return (
            <div className="hotkey-box">
                <button
                    className="hotkey-button"
                    onFocus={() => {
                        const listener = {
                            handleEvent: (ev: KeyboardEvent) => this.props.setValue(ev.code),
                        };

                        window.addEventListener("keypress", listener);

                        const oldButtonState: boolean[][] = [];
                        const intervalHandle = window.setInterval(() => {
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

                        this.setState({
                            listener,
                            intervalHandle,
                        });
                    }}
                    onBlur={() => {
                        if (this.state.listener != null) {
                            window.removeEventListener("keypress", this.state.listener);
                        }
                        if (this.state.intervalHandle != null) {
                            window.clearTimeout(this.state.intervalHandle);
                        }
                        this.setState({
                            listener: null,
                            intervalHandle: null,
                        });
                    }}
                >
                    {
                        this.props.value != null
                            ? this.props.value
                            : this.state.listener != null
                                ? <i className="fa fa-circle" aria-hidden="true" />
                                : null
                    }
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
            </div>
        );
    }
}
