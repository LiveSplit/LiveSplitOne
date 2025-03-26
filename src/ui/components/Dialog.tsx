import React, { useState, useEffect } from "react";

import * as classes from "../../css/Dialog.module.scss";

export interface Options {
    title: string | React.JSX.Element;
    description: string | React.JSX.Element;
    textInput?: boolean;
    defaultText?: string;
    buttons: string[];
}

export interface State {
    options: Options;
    input: string;
}

let dialogElement: HTMLDialogElement | null = null;
let setStateFn: ((options: Options) => void) | undefined;
let resolveFn: ((_: [number, string]) => void) | undefined;
let onCloseFn: (() => void) | undefined;
let alreadyClosed = false;

export function showDialog(options: Options): Promise<[number, string]> {
    if (dialogElement) {
        dialogElement.showModal();
        alreadyClosed = false;
        dialogElement.setAttribute("disabled", "");
        const closeWith = options.buttons.length - 1;
        dialogElement.onclose = () => {
            if (!alreadyClosed) {
                resolveFn?.([closeWith, ""]);
                onCloseFn?.();
            }
        };
    }
    setStateFn?.(options);
    return new Promise((resolve) => (resolveFn = resolve));
}

export function DialogContainer({
    onShow,
    onClose,
}: {
    onShow: () => void;
    onClose: () => void;
}) {
    const [options, setOptions] = useState<Options>({
        title: "",
        description: "",
        buttons: [],
    });
    const [input, setInput] = useState("");

    useEffect(() => {
        onCloseFn = onClose;
    }, [onClose]);

    useEffect(() => {
        setStateFn = (options) => {
            onShow();
            setOptions(options);
            setInput(options.defaultText ?? "");
        };
    }, [onShow]);

    const handleClose = (i: number) => {
        alreadyClosed = true;
        dialogElement?.close();
        resolveFn?.([i, input]);
        onClose();
    };

    return (
        <dialog
            ref={(element) => {
                dialogElement = element;
            }}
            onKeyDown={(e) => {
                if (e?.key === "ArrowLeft") {
                    e.preventDefault();
                    (
                        document.activeElement?.previousElementSibling as any
                    )?.focus();
                } else if (e?.key === "ArrowRight") {
                    e.preventDefault();
                    (
                        document.activeElement?.nextElementSibling as any
                    )?.focus();
                }
            }}
        >
            <div className={classes.dialog}>
                <h1>{options.title}</h1>
                <p>{options.description}</p>
                {options.textInput && (
                    <input
                        type="text"
                        value={input}
                        autoFocus={true}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e?.key === "Enter") {
                                e.preventDefault();
                                handleClose(0);
                            }
                        }}
                    />
                )}
                <div className={classes.buttons}>
                    {options.buttons.map((button, i) => (
                        <button
                            key={i}
                            autoFocus={i === 0 && !options.textInput}
                            onClick={() => handleClose(i)}
                        >
                            {button}
                        </button>
                    ))}
                </div>
            </div>
        </dialog>
    );
}
