import * as React from "react";
import { ResizableBox } from "react-resizable";
import { LayoutStateRef } from "../livesplit-core";
import { WebRenderer } from "../livesplit-core/livesplit_core";
import AutoRefresh from "../util/AutoRefresh";
import { UrlCache } from "../util/UrlCache";
import "../css/Layout.scss";
import { GeneralSettings } from "../ui/MainSettings";

export interface Props {
    getState: () => LayoutStateRef,
    layoutUrlCache: UrlCache,
    allowResize: boolean,
    width: number,
    height: number,
    generalSettings: GeneralSettings,
    renderer: WebRenderer,
    onResize(width: number, height: number): void,
}

export default class Layout extends React.Component<Props, unknown> {
    public refreshLayout() {
        const layoutState = this.props.getState();
        const newDims = this.props.renderer.render(layoutState.ptr, this.props.layoutUrlCache.imageCache.ptr);
        if (newDims !== undefined) {
            this.props.onResize(newDims[0], newDims[1]);
        }
    }

    public render() {
        return (
            <AutoRefresh
                frameRate={this.props.generalSettings.frameRate}
                update={() => this.refreshLayout()}
            >
                <div className="layout" style={{ width: this.props.width, height: this.props.height }}>
                    <div
                        style={{ width: "inherit", height: "inherit" }}
                        ref={(element) => element?.appendChild(this.props.renderer.element())}
                    />
                    {
                        this.props.allowResize && <div className="resizable-layout">
                            <ResizableBox
                                axis="x"
                                width={this.props.width}
                                height={this.props.height}
                                minConstraints={[100, 40]}
                                handle={<div onClick={(e) => e.stopPropagation()} className="resizable-handle-east" />}
                                onResize={(_event, data) => this.props.onResize(data.size.width, data.size.height)}
                            />
                            <ResizableBox
                                axis="y"
                                width={this.props.width}
                                height={this.props.height}
                                minConstraints={[100, 40]}
                                handle={<div onClick={(e) => e.stopPropagation()} className="resizable-handle-south" />}
                                onResize={(_event, data) => this.props.onResize(data.size.width, data.size.height)}
                            />
                            <ResizableBox
                                axis="both"
                                width={this.props.width}
                                height={this.props.height}
                                minConstraints={[100, 40]}
                                handle={<div onClick={(e) => e.stopPropagation()} className="resizable-handle-south-east" />}
                                onResize={(_event, data) => this.props.onResize(data.size.width, data.size.height)}
                            />
                        </div>
                    }
                </div>
            </AutoRefresh>
        );
    }
}
