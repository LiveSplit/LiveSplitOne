export async function corsBustingFetch(
    url: string,
    signal?: AbortSignal,
): Promise<ArrayBuffer> {
    let response: Response | undefined;
    if (window.__TAURI__ != null) {
        response = await window.__TAURI__.http.fetch(url, { signal });
    } else {
        response = await fetch(url, { signal });
    }
    return response.arrayBuffer();
}
