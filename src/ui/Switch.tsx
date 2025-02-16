import React from "react";

import "../css/Switch.scss";

export default function Switch({ checked, setIsChecked }: {
    checked: boolean,
    setIsChecked: (checked: boolean) => void,
}) {
    return (
        <label style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="switch">
                <input type="checkbox" checked={checked} onChange={(e) => setIsChecked(e.target.checked)} />
                <span />
            </div>
        </label>
    );
}
