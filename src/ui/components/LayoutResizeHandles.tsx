import * as React from "react";

import classes from "../../css/Layout.module.css";

const MINIMUM_WIDTH = 100;
const MINIMUM_HEIGHT = 40;

type ResizeAxis = "horizontal" | "vertical" | "both";

export function LayoutResizeHandles({
    width,
    height,
    onResize,
}: {
    width: number;
    height: number;
    onResize: (width: number, height: number) => void;
}) {
    const stopListening = React.useRef<(() => void) | null>(null);

    React.useEffect(
        () => () => {
            stopListening.current?.();
        },
        [],
    );

    const startResize =
        (axis: ResizeAxis) => (event: React.PointerEvent<HTMLDivElement>) => {
            // Ignore secondary pointers and non-primary mouse buttons. Pointer
            // events cover mouse, touch, and pen input without needing separate
            // compatibility paths for each input type.
            if (!event.isPrimary || event.button !== 0) {
                return;
            }

            const pointerId = event.pointerId;
            const startX = event.clientX;
            const startY = event.clientY;
            let lastWidth = width;
            let lastHeight = height;
            const ownerDocument = event.currentTarget.ownerDocument;
            const ownerWindow = ownerDocument.defaultView;

            // Listen on the document while dragging so the hit area can remain
            // deliberately narrow without losing movement as soon as the
            // pointer leaves it. The cleanup ref also handles the component
            // being unmounted or the window losing focus mid-drag.
            function resize(pointerEvent: PointerEvent) {
                if (pointerEvent.pointerId !== pointerId) {
                    return;
                }

                const newWidth =
                    axis === "vertical"
                        ? width
                        : Math.max(
                              MINIMUM_WIDTH,
                              width + pointerEvent.clientX - startX,
                          );
                const newHeight =
                    axis === "horizontal"
                        ? height
                        : Math.max(
                              MINIMUM_HEIGHT,
                              height + pointerEvent.clientY - startY,
                          );

                if (newWidth !== lastWidth || newHeight !== lastHeight) {
                    lastWidth = newWidth;
                    lastHeight = newHeight;
                    onResize(newWidth, newHeight);
                }
                pointerEvent.preventDefault();
            }

            function stopResize(pointerEvent: PointerEvent) {
                if (pointerEvent.pointerId === pointerId) {
                    cleanup();
                }
            }

            function cleanup() {
                ownerDocument.removeEventListener("pointermove", resize);
                ownerDocument.removeEventListener("pointerup", stopResize);
                ownerDocument.removeEventListener("pointercancel", stopResize);
                ownerWindow?.removeEventListener("blur", cleanup);
                stopListening.current = null;
            }

            stopListening.current?.();
            stopListening.current = cleanup;
            ownerDocument.addEventListener("pointermove", resize, {
                passive: false,
            });
            ownerDocument.addEventListener("pointerup", stopResize);
            ownerDocument.addEventListener("pointercancel", stopResize);
            ownerWindow?.addEventListener("blur", cleanup);
            event.preventDefault();
        };

    const handleProps = {
        "aria-hidden": true,
        onClick: (event: React.MouseEvent) => event.stopPropagation(),
    } as const;

    return (
        <div className={classes.resizableLayout}>
            <div
                {...handleProps}
                className={classes.handleEast}
                onPointerDown={startResize("horizontal")}
            />
            <div
                {...handleProps}
                className={classes.handleSouth}
                onPointerDown={startResize("vertical")}
            />
            <div
                {...handleProps}
                className={classes.handleSouthEast}
                onPointerDown={startResize("both")}
            />
        </div>
    );
}
