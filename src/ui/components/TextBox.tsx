import * as React from "react";

import classes from "../../css/TextBox.module.css";

export function TextBox({
    className,
    value,
    onChange,
    onBlur,
    label,
    invalid,
    list,
}: {
    className?: string;
    value?: string | number | readonly string[];
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    label: string;
    invalid?: boolean;
    list?: [string, string[]];
}) {
    let outerClassName = classes.group;
    if (invalid) {
        outerClassName += ` ${classes.invalid}`;
    }

    let name;
    let listElement;
    if (list !== undefined) {
        name = list[0];
        listElement = (
            <datalist id={name}>
                {list[1].map((n, i) => (
                    <option key={i} value={n} />
                ))}
            </datalist>
        );
    }

    return (
        <div className={outerClassName}>
            <input
                list={name}
                type="text text-box"
                required
                className={className}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
            />
            {listElement}
            <span className={classes.bar}></span>
            <label>{label}</label>
        </div>
    );
}
