import * as React from "react";
import { Option } from "../util/OptionUtil";

import "./HotkeyButton.css";

export interface Props {
    value: string,
    setValue: (value: string) => void,
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
                {this.props.value}
            </button>
        );
    }
}
