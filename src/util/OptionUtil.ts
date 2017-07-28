export function unwrap<T>(obj: T | null): T {
    if (obj != null) {
        return obj;
    }
    throw "Object is null";
}

export function expect<T>(obj: T | null, message: string): T {
    if (obj != null) {
        return obj;
    }
    throw message;
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
