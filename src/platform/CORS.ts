export async function corsBustingFetch(
    url: string,
    signal?: AbortSignal,
): Promise<ArrayBuffer> {
    let response: Response | undefined;
    const options = signal === undefined ? {} : { signal };
    if (window.__TAURI__ != null) {
        response = await window.__TAURI__.http.fetch(url, options);
    } else {
        response = await fetch(url, options);
    }
    return response.arrayBuffer();
}
