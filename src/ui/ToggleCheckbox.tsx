import * as React from "react";
import Toggle from 'react-toggle';

import "react-toggle/style.css";
import "../css/ToggleCheckbox.scss";

export interface Props {
    value: boolean,
    setValue: (value: boolean) => void,
}

export default class ToggleCheckbox extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    public render() {
        return (
            <div className="toggle-checkbox">
                <Toggle
                    defaultChecked={this.props.value}
                    icons={false}
                    onChange={(event) => this.props.setValue(event.target.checked)}
                />
            </div>
        );
    }
}
