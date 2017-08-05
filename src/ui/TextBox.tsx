import * as React from "react";

export interface Props {
    className?: string,
    value?: any,
    onChange?: React.EventHandler<React.ChangeEvent<HTMLInputElement>>,
    onBlur?: React.EventHandler<React.FocusEvent<HTMLInputElement>>,
    label: string,
    invalid?: boolean,
    small?: boolean,
}

export class TextBox extends React.Component<Props> {
    render() {
        let className = "group";
        if (this.props.invalid) {
            className += " invalid";
        }
        if (this.props.small) {
            className += " small";
        }

        return (
            <div className={className}>
                <input
                    type="text"
                    required
                    className={this.props.className}
                    value={this.props.value}
                    onChange={this.props.onChange}
                    onBlur={this.props.onBlur}
                />
                <span className="bar"></span>
                <label>{this.props.label}</label>
            </div>
        );
    }
}
