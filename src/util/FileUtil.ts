export function openFileAsArrayBuffer(callback: (data: ArrayBuffer) => void) {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const contents = e.target.result;
            callback(contents);
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}
