import * as React from "react";
import { Option, map } from "../util/OptionUtil";

import "../css/HotkeyButton.scss";

export interface Props {
    value: Option<string>,
    setValue: (value: Option<string>) => void,
}

export interface State {
    listener: Option<EventListenerObject>,
}

export class HotkeyButton extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            listener: null,
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

                        this.setState({
                            ...this.state,
                            listener,
                        });
                    }}
                    onBlur={() => {
                        if (this.state.listener != null) {
                            window.removeEventListener("keypress", this.state.listener);

                            this.setState({
                                ...this.state,
                                listener: null,
                            });
                        }
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
