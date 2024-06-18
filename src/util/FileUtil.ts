import { Option } from "./OptionUtil";

// Workaround for Chrome sometimes garbage collecting the input element while it
// is being used, preventing the onchange event from triggering.
// @ts-expect-error Unused variable due to above issue
let fileInputElement = null; // eslint-disable-line

function openFile(): Promise<File | undefined> {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
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

export async function convertFileToArrayBuffer(file: File): Promise<[ArrayBuffer, File]> {
    return new Promise((resolve: (_: [ArrayBuffer, File]) => void) => {
        const reader = new FileReader();
        reader.onload = () => {
            const contents = reader.result as Option<ArrayBuffer>;
            if (contents != null) {
                resolve([contents, file]);
            }
        };
        // FIXME: onerror
        reader.readAsArrayBuffer(file);
    });
}

export async function openFileAsArrayBuffer(): Promise<[ArrayBuffer, File] | undefined> {
    const file = await openFile();
    if (file === undefined) {
        return undefined;
    }
    return convertFileToArrayBuffer(file);
}

export async function convertFileToString(file: File): Promise<[string, File]> {
    return new Promise((resolve: (_: [string, File]) => void) => {
        const reader = new FileReader();
        reader.onload = () => {
            const contents = reader.result as Option<string>;
            if (contents != null) {
                resolve([contents, file]);
            }
        };
        reader.readAsText(file);
    });
}

export async function openFileAsString(): Promise<[string, File] | undefined> {
    const file = await openFile();
    if (file === undefined) {
        return undefined;
    }
    return convertFileToString(file);
}

export function exportFile(filename: string, data: BlobPart) {
    const url = URL.createObjectURL(new Blob([data], { type: "application/octet-stream" }));
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
