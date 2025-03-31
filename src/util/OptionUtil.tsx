import * as React from "react";
import { toast } from "react-toastify";

import * as toastClasses from "../css/Toast.module.scss";

export type Option<T> = T | null | undefined;

export function expect<T>(obj: Option<T>, message: string): T {
    if (obj != null) {
        return obj;
    }
    return panic(message);
}

interface Disposable {
    [Symbol.dispose](): void;
}

export function panic(message: string): never {
    bug(message);
    throw new Error(message);
}

export function bug(message: string): void {
    toast.error(
        <div>
            <b>You encountered a bug:</b>
            <p>
                <i>{message}</i>
            </p>
            Please report this issue{" "}
            <a href="https://github.com/LiveSplit/LiveSplitOne" target="_blank">
                here
            </a>
            .
        </div>,
        {
            autoClose: false,
            className: `${toastClasses.toastClass} ${toastClasses.toastBug}`,
        },
    );
}

export function assertNever(x: never): never {
    return x;
}

export function assert(condition: boolean, message: string): asserts condition {
    if (!condition) {
        panic(message);
    }
}

export function assertNull<T>(
    obj: Option<T | Disposable>,
    message: string,
): asserts obj is null | undefined {
    if (obj != null) {
        (obj as any)[Symbol.dispose]?.();
        panic(message);
    }
}

export function maybeDisposeAndThen(obj: Option<Disposable>, f: () => void) {
    if (obj != null) {
        obj[Symbol.dispose]();
        f();
    }
}

export function map<T, R>(obj: Option<T>, f: (obj: T) => R): R | undefined {
    if (obj != null) {
        return f(obj);
    } else {
        return undefined;
    }
}
