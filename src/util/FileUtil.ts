import { Option, map } from "./OptionUtil";

// Workaround for Chrome sometimes garbage collecting the input element while it
// is being used, preventing the onchange event from triggering.
// @ts-ignore
let fileInputElement = null;

function openFile(): Promise<File> {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.onchange = () => {
            const file: Option<File> = map(input.files, (f) => f[0]);
            if (file == null) {
                reject();
                return;
            }
            resolve(file);
        };
        input.click();
        fileInputElement = input;
    });
}

export async function openFileAsArrayBuffer(): Promise<[ArrayBuffer, File]> {
    const file = await openFile();
    return new Promise((resolve: (_: [ArrayBuffer, File]) => void) => {
        const reader = new FileReader();
        reader.onload = () => {
            const contents = reader.result as Option<ArrayBuffer>;
            if (contents != null) {
                resolve([contents, file]);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

export async function openFileAsString(): Promise<[string, File]> {
    const file = await openFile();
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

export function exportFile(filename: string, data: any) {
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
