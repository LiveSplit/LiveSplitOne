import * as React from "react";

export interface Props {
    className?: string;
    value?: any;
    onChange?: React.EventHandler<React.ChangeEvent<HTMLInputElement>>;
    onBlur?: React.EventHandler<React.FocusEvent<HTMLInputElement>>;
    label: string;
    invalid?: boolean;
    small?: boolean;
    list?: [string, string[]];
}

export class TextBox extends React.Component<Props> {
    public render() {
        let className = "group";
        if (this.props.invalid) {
            className += " invalid";
        }
        if (this.props.small) {
            className += " small";
        }
        let name;
        let list;
        if (this.props.list !== undefined) {
            name = this.props.list[0];
            list = (
                <datalist id={name}>
                    {this.props.list[1].map((n, i) => (
                        <option key={i} value={n} />
                    ))}
                </datalist>
            );
        }

        return (
            <div className={className}>
                <input
                    list={name}
                    type="text text-box"
                    required
                    className={this.props.className}
                    value={this.props.value}
                    onChange={this.props.onChange}
                    onBlur={this.props.onBlur}
                />
                {list}
                <span className="bar"></span>
                <label>{this.props.label}</label>
            </div>
        );
    }
}
