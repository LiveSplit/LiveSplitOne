export function openFileAsArrayBuffer(callback: (data: ArrayBuffer, file: File) => void) {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.onchange = (e: any) => {
        const file: File | null = e.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const contents = e.target.result;
            callback(contents, file);
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
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
