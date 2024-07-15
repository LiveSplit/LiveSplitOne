export async function corsBustingFetch(url: string, signal?: AbortSignal): Promise<ArrayBuffer> {
    if (window.__TAURI__ != null) {
        const response = await window.__TAURI__.http.fetch(
            url,
            { responseType: 3 },
        );
        if (signal != null) {
            signal.throwIfAborted();
        }
        return new Uint8Array(response.data);
    } else {
        const response = await fetch(url, { signal });
        return response.arrayBuffer();
    }
}
