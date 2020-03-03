import * as React from "react";
import { LayoutStateJson } from "../livesplit-core";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import Component from "./Component";
import { ResizableBox, ResizeCallbackData } from "react-resizable";

import "../css/Layout.scss";

export interface Props {
    state: LayoutStateJson,
    allowResize: boolean,
    width: number,
    onResize(width: number): void,
}

export default class Layout extends React.Component<Props> {
    public render() {
        const layoutState = this.props.state;
        const counts = new Map<string, number>();

        return (
            <div
                className="layout"
                style={{
                    background: gradientToCss(layoutState.background),
                    color: colorToCss(layoutState.text_color),
                    width: this.props.width,
                }}
            >
                {this.props.allowResize &&
                    <ResizableBox
                        className="resizable-layout"
                        width={this.props.width}
                        minConstraints={[160, 0]}
                        height={0}
                        handle={<span onClick={(event: React.SyntheticEvent) => { event.stopPropagation(); }} className="resizable-handle" />}
                        onResize={
                            (
                                _event: React.SyntheticEvent,
                                data: ResizeCallbackData,
                            ) => this.props.onResize(data.size.width)
                        }
                        axis="x"
                    />
                }
                {
                    this.props.state.components.map((c) => {
                        const componentType = Object.keys(c)[0];
                        const id = counts.get(componentType) || 0;
                        counts.set(componentType, id + 1);

                        const key = `${componentType}${id}`;

                        return <Component
                            key={key}
                            state={c}
                            componentId={key}
                            layoutState={layoutState}
                            layoutWidth={this.props.width}
                        />;
                    })
                }
            </div>
        );
    }
}
