import React, { useEffect, useRef } from "react";
import { toast } from "react-toastify";

import classes from "../../css/DragUpload.module.css";

export function DragUpload({
    children,
    importLayout,
    importSplits,
}: {
    children: React.ReactNode;
    importLayout?: (file: File) => Promise<void>;
    importSplits: (file: File) => Promise<void>;
}) {
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const dropZoneOverlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const dropZone = dropZoneRef.current;
        const dropZoneOverlay = dropZoneOverlayRef.current;

        if (!dropZone) {
            return;
        }

        const handleDragEnter = (event: DragEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (dropZoneOverlay) {
                dropZoneOverlay.style.visibility = "visible";
            }
        };

        const handleDragLeave = (event: DragEvent) => {
            if (
                dropZoneOverlay &&
                (event.pageX < 10 ||
                    event.pageY < 10 ||
                    window.innerWidth - event.pageX < 10 ||
                    window.innerHeight - event.pageY < 10)
            ) {
                dropZoneOverlay.style.visibility = "hidden";
            }
        };

        const handleDragOver = (event: DragEvent) => {
            event.preventDefault();
            event.stopPropagation();
        };

        const handleDrop = (event: DragEvent) => {
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
        };

        dropZone.addEventListener("dragenter", handleDragEnter);
        dropZone.addEventListener("dragleave", handleDragLeave);
        dropZone.addEventListener("dragover", handleDragOver);
        dropZone.addEventListener("drop", handleDrop);

        return () => {
            dropZone.removeEventListener("dragenter", handleDragEnter);
            dropZone.removeEventListener("dragleave", handleDragLeave);
            dropZone.removeEventListener("dragover", handleDragOver);
            dropZone.removeEventListener("drop", handleDrop);
        };
    }, [importLayout, importSplits]);

    return (
        <div ref={dropZoneRef} className={classes.uploadDropZone}>
            <div ref={dropZoneOverlayRef} className={classes.overlay}>
                <div className={classes.overlayText}>Waiting for drop...</div>
            </div>
            {children}
        </div>
    );
}
