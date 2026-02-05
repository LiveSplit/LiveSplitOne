import * as React from "react";
import { toast } from "react-toastify";

import * as toastClasses from "../css/Toast.module.scss";
import { Label, resolve } from "../localization";
import { Language } from "../livesplit-core";

export type Option<T> = T | null | undefined;

export function expect<T>(
    obj: Option<T>,
    message: string,
    lang: Language | undefined,
): T {
    if (obj != null) {
        return obj;
    }
    return panic(message, lang);
}

interface Disposable {
    [Symbol.dispose](): void;
}

export function panic(message: string, lang: Language | undefined): never {
    bug(message, lang);
    throw new Error(message);
}

export function bug(message: string, lang: Language | undefined): void {
    toast.error(
        <div>
            <b>{resolve(Label.BugEncountered, lang)}</b>
            <p>
                <i>{message}</i>
            </p>
            <p>
                {resolve(Label.PleaseReportIssueStart, lang)}
                <a
                    href="https://github.com/LiveSplit/LiveSplitOne"
                    target="_blank"
                >
                    {resolve(Label.ReportHere, lang)}
                </a>
                {resolve(Label.PleaseReportIssueEnd, lang)}
            </p>
            {resolve(Label.BugReportInstructions, lang)}
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

export function assert(
    condition: boolean,
    message: string,
    lang: Language | undefined,
): asserts condition {
    if (!condition) {
        panic(message, lang);
    }
}

export function assertNull<T>(
    obj: Option<T | Disposable>,
    message: string,
    lang: Language | undefined,
): asserts obj is null | undefined {
    if (obj != null) {
        (obj as any)[Symbol.dispose]?.();
        panic(message, lang);
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
