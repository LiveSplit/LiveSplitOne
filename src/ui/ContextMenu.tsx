import React, { createContext, useContext, ReactNode } from "react";
import { expect } from "../util/OptionUtil";

import * as classes from "../css/ContextMenu.module.css";

export interface Position {
    x: number;
    y: number;
}

const InfoContext = createContext<{ onClose: () => void } | undefined>(
    undefined,
);

export function ContextMenu({
    position,
    onClose,
    children,
}: {
    position: Position;
    onClose: () => void;
    children: ReactNode;
}) {
    return (
        <InfoContext.Provider value={{ onClose }}>
            <nav
                role="menu"
                className={classes.contextMenu}
                style={{
                    top: `${position.y}px`,
                    left: `${position.x}px`,
                }}
            >
                <div className={classes.overlay} onClick={onClose} />
                <div className={classes.panel}>{children}</div>
            </nav>
        </InfoContext.Provider>
    );
}

export function MenuItem({
    children,
    onClick,
    className,
}: {
    children: ReactNode;
    onClick: () => void;
    className?: string;
}) {
    const { onClose } = expect(
        useContext(InfoContext),
        "MenuItem must be used within a ContextMenu",
    );

    return (
        <div
            className={`${classes.entry} ${className}`}
            role="menuitem"
            onClick={() => {
                onClick();
                onClose();
            }}
        >
            {children}
        </div>
    );
}

export function Separator() {
    return <hr className={classes.hr} />;
}
