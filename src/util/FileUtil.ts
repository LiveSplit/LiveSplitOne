import { Option } from "./OptionUtil";

// Workaround for Chrome sometimes garbage collecting the input element while it
// is being used, preventing the onchange event from triggering.
// @ts-expect-error Unused variable due to above issue
let fileInputElement = null; // eslint-disable-line

export const FILE_EXT_SPLITS = ".lss";
export const FILE_EXT_LAYOUTS = ".ls1l,.lsl";
export const FILE_EXT_IMAGES = "image/*";

function openFile(accept: string): Promise<File | undefined> {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", accept);
        input.onchange = () => {
            const file: Option<File> = input.files?.[0];
            if (file === undefined) {
                resolve(undefined);
                return;
            }
            resolve(file);
        };
        input.click();
        fileInputElement = input;
    });
}

export async function convertFileToArrayBuffer(
    file: File,
): Promise<[ArrayBuffer, File] | Error> {
    return new Promise((resolve: (_: [ArrayBuffer, File] | Error) => void) => {
        try {
            const reader = new FileReader();
            reader.onload = () => {
                const contents = reader.result as Option<ArrayBuffer>;
                if (contents != null) {
                    resolve([contents, file]);
                } else {
                    resolve(new Error("Failed to read the file."));
                }
            };
            reader.onerror = () => {
                resolve(new Error("Failed to read the file."));
            };
            reader.readAsArrayBuffer(file);
        } catch (e) {
            if (e instanceof Error) {
                resolve(e);
            } else {
                resolve(new Error("Unknown error while reading the file."));
            }
        }
    });
}

export async function openFileAsArrayBuffer(
    accept: string,
): Promise<[ArrayBuffer, File] | Error | undefined> {
    const file = await openFile(accept);
    if (file === undefined) {
        return undefined;
    }
    return convertFileToArrayBuffer(file);
}

export async function convertFileToString(
    file: File,
): Promise<[string, File] | Error> {
    return new Promise((resolve: (_: [string, File] | Error) => void) => {
        try {
            const reader = new FileReader();
            reader.onload = () => {
                const contents = reader.result as Option<string>;
                if (contents != null) {
                    resolve([contents, file]);
                } else {
                    resolve(new Error("Failed to read the file."));
                }
            };
            reader.onerror = () => {
                resolve(new Error("Failed to read the file."));
            };
            reader.readAsText(file);
        } catch (e) {
            if (e instanceof Error) {
                resolve(e);
            } else {
                resolve(new Error("Unknown error while reading the file."));
            }
        }
    });
}

export async function openFileAsString(
    accept: string,
): Promise<[string, File] | Error | undefined> {
    const file = await openFile(accept);
    if (file === undefined) {
        return undefined;
    }
    return convertFileToString(file);
}

export function exportFile(filename: string, data: BlobPart) {
    const url = URL.createObjectURL(
        new Blob([data], { type: "application/octet-stream" }),
    );
    try {
        const element = document.createElement("a");
        element.setAttribute("href", url);
        element.setAttribute("download", filename);

        element.style.display = "none";
        document.body.appendChild(element);
        try {
            element.click();
        } finally {
            document.body.removeChild(element);
        }
    } finally {
        URL.revokeObjectURL(url);
    }
}
