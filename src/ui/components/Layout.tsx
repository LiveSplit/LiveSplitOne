import * as React from "react";
import { ResizableBox } from "react-resizable";
import { type LayoutStateRef } from "../../livesplit-core";
import { type WebRenderer } from "../../livesplit-core/livesplit_core";
import AutoRefresh from "../../util/AutoRefresh";
import { type UrlCache } from "../../util/UrlCache";
import { type GeneralSettings } from "../views/MainSettings";

import classes from "../../css/Layout.module.css";

export function Layout({
    getState,
    layoutUrlCache,
    allowResize,
    width,
    height,
    generalSettings,
    renderer,
    onResize,
    onScroll,
    window,
}: {
    getState: () => LayoutStateRef;
    layoutUrlCache: UrlCache;
    generalSettings: GeneralSettings;
    renderer: WebRenderer;
    onResize: (width: number, height: number) => void;
    onScroll?: (e: WheelEvent) => void;
    window: Window;
} & (
    | {
          allowResize: false;
          width: string | number;
          height: string | number;
      }
    | { allowResize: true; width: number; height: number }
)) {
    const update = () => {
        const layoutState = getState();
        const newDims = renderer.render(
            layoutState.ptr,
            layoutUrlCache.imageCache.ptr,
        );
        if (newDims != null) {
            const [newWidth, newHeight] = newDims;
            if (newWidth === undefined || newHeight === undefined) {
                // The renderer contract returns exactly two dimensions. Treat
                // malformed binding data as an error instead of forwarding
                // undefined dimensions into the layout state.
                throw new Error("Renderer returned incomplete dimensions.");
            }
            onResize(newWidth, newHeight);
        }
    };

    return (
        <AutoRefresh
            frameRate={generalSettings.frameRate}
            update={update}
            window={window}
        >
            <div style={{ width, height }}>
                <div
                    style={{ width, height }}
                    ref={(element) => {
                        element?.appendChild(renderer.element());
                        if (onScroll) {
                            element?.addEventListener("wheel", onScroll);
                        }
                    }}
                />
                {allowResize && (
                    <div className={classes.resizableLayout}>
                        <ResizableBox
                            axis="x"
                            width={width}
                            height={height}
                            minConstraints={[100, 40]}
                            handle={
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={classes.handleEast}
                                />
                            }
                            onResize={(_event, data) =>
                                onResize(data.size.width, data.size.height)
                            }
                        />
                        <ResizableBox
                            axis="y"
                            width={width}
                            height={height}
                            minConstraints={[100, 40]}
                            handle={
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={classes.handleSouth}
                                />
                            }
                            onResize={(_event, data) =>
                                onResize(data.size.width, data.size.height)
                            }
                        />
                        <ResizableBox
                            axis="both"
                            width={width}
                            height={height}
                            minConstraints={[100, 40]}
                            handle={
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={classes.handleSouthEast}
                                />
                            }
                            onResize={(_event, data) =>
                                onResize(data.size.width, data.size.height)
                            }
                        />
                    </div>
                )}
            </div>
        </AutoRefresh>
    );
}
