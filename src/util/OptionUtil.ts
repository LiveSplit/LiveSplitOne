export function expect<T>(obj: T | null, message: string): T {
    if (obj != null) {
        return obj;
    }
    throw message;
}

interface Disposable {
    dispose(): void,
}

interface MaybeDisposable {
    dispose?(): void,
}

export function assertNull(obj: MaybeDisposable | null, message: string) {
    if (obj != null) {
        if (obj.dispose) {
            obj.dispose();
        }
        throw message;
    }
}

export function maybeDispose(obj: Disposable | null) {
    if (obj) {
        obj.dispose();
    }
}

export function maybeDisposeAndThen(obj: Disposable | null, f: () => void) {
    if (obj) {
        obj.dispose();
        f();
    }
}

export function map<T, R>(obj: T | null, f: (obj: T) => R): R | null {
    if (obj) {
        return f(obj);
    } else {
        return null;
    }
}

export function andThen<T, R>(obj: T | null, f: (obj: T) => (R | null)): R | null {
    if (obj) {
        return f(obj);
    } else {
        return null;
    }
}
