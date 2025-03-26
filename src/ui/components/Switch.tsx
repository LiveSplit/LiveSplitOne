import React from "react";

import * as classes from "../../css/Switch.module.scss";

export function Switch({
    checked,
    setIsChecked,
}: {
    checked: boolean;
    setIsChecked: (checked: boolean) => void;
}) {
    return (
        <label className={classes.label}>
            <div className={classes.switch}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                />
                <span />
            </div>
        </label>
    );
}
