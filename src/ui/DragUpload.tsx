import * as React from "react";
import { toast } from "react-toastify";

import "../css/DragUpload.scss";

export interface Props {
    children: React.ReactNode;
    importLayout?: (file: File) => Promise<void>;
    importSplits(file: File): Promise<void>;
}

export default class DragUpload extends React.Component<Props> {
    public componentDidMount() {
        const dropZone = document.getElementById("upload-drop-zone");
        const dropZoneOverlay = document.getElementById(
            "upload-drop-zone-overlay",
        );
        const importLayout = this.props.importLayout;
        const importSplits = this.props.importSplits;

        if (dropZone === null) {
            return;
        }

        dropZone.addEventListener("dragenter", (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (dropZoneOverlay) {
                dropZoneOverlay.style.visibility = "visible";
            }
        });

        dropZone.addEventListener("dragleave", (event) => {
            if (
                dropZoneOverlay &&
                (event.pageX < 10 ||
                    event.pageY < 10 ||
                    window.innerWidth - event.pageX < 10 ||
                    window.innerHeight - event.pageY < 10)
            ) {
                dropZoneOverlay.style.visibility = "hidden";
            }
        });

        dropZone.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.stopPropagation();
        });

        dropZone.addEventListener("drop", (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (dropZoneOverlay) {
                dropZoneOverlay.style.visibility = "hidden";
            }

            const dataTransfer = event.dataTransfer;
            if (dataTransfer) {
                const files = dataTransfer.files;
                const file = files[0];
                if (file) {
                    return importSplits(file).catch(() => {
                        if (importLayout !== undefined) {
                            return importLayout(file).catch(() => {
                                toast.error("The file could not be parsed.");
                            });
                        }
                        toast.error("The file could not be parsed.");
                        return null;
                    });
                }
            }
            return null;
        });
    }

    public render() {
        return (
            <div id="upload-drop-zone">
                <div id="upload-drop-zone-overlay">
                    <div className="overlay-text">Waiting for drop...</div>
                </div>
                {this.props.children}
            </div>
        );
    }
}
