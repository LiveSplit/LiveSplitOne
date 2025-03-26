import * as React from "react";
import { ResizableBox } from "react-resizable";
import { LayoutStateRef } from "../../livesplit-core";
import { WebRenderer } from "../../livesplit-core/livesplit_core";
import AutoRefresh from "../../util/AutoRefresh";
import { UrlCache } from "../../util/UrlCache";
import { GeneralSettings } from "../views/MainSettings";

import * as classes from "../../css/Layout.module.scss";

export default function Layout({
    getState,
    layoutUrlCache,
    allowResize,
    width,
    height,
    generalSettings,
    renderer,
    onResize,
}: {
    getState: () => LayoutStateRef;
    layoutUrlCache: UrlCache;
    allowResize: boolean;
    width: number;
    height: number;
    generalSettings: GeneralSettings;
    renderer: WebRenderer;
    onResize: (width: number, height: number) => void;
}) {
    const update = () => {
        const layoutState = getState();
        const newDims = renderer.render(
            layoutState.ptr,
            layoutUrlCache.imageCache.ptr,
        );
        if (newDims != null) {
            onResize(newDims[0], newDims[1]);
        }
    };

    return (
        <AutoRefresh frameRate={generalSettings.frameRate} update={update}>
            <div style={{ width, height }}>
                <div
                    style={{ width, height }}
                    ref={(element) => {
                        element?.appendChild(renderer.element());
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
