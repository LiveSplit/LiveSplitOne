import { toast } from "react-toastify";

export type Option<T> = T | null | undefined;

export function expect<T>(obj: Option<T>, message: string): T {
    if (obj != null) {
        return obj;
    }
    return panic(message);
}

interface Disposable {
    dispose(): void,
}

interface MaybeDisposable {
    dispose?(): void,
}

export function panic(message: string): never {
    toast.error(`Bug: ${message}`);
    throw new Error(message);
}

export function assertNever(x: never): never { return x; }

export function assert(condition: boolean, message: string) {
    if (!condition) {
        panic(message);
    }
}

export function assertNull(obj: Option<MaybeDisposable>, message: string) {
    if (obj != null) {
        if (obj.dispose) {
            obj.dispose();
        }
        panic(message);
    }
}

export function maybeDispose(obj: Option<Disposable>) {
    if (obj != null) {
        obj.dispose();
    }
}

export function maybeDisposeAndThen(obj: Option<Disposable>, f: () => void) {
    if (obj != null) {
        obj.dispose();
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

export function unwrapOr<T>(obj: Option<T>, or: T): T {
    if (obj != null) {
        return obj;
    } else {
        return or;
    }
}
