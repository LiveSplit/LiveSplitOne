import * as React from "react";
import { LayoutStateJson } from "../livesplit-core";
import AutoRefresh from "../util/AutoRefresh";
import { backgroundToCss, colorToCss } from "../util/ColorUtil";
import { Option } from "../util/OptionUtil";
import Component from "./Component";
import { getLayoutStateStyle } from "./Layout";
import { UrlCache } from "../util/UrlCache";

export interface Props {
    getState: () => LayoutStateJson,
    layoutUrlCache: UrlCache,
    layoutWidth: number,
    onClick: (componentIndex: number) => void,
    onDrag: (componentIndex: number) => void,
    onDragEnd: (componentIndex: number) => void,
    onDrop: (componentIndex: number) => void,
    isSelected: (componentIndex: number) => boolean,
}

export interface State {
    layoutState: LayoutStateJson,
    startIndex: Option<number>,
    hoverIndex: Option<number>,
}

export default class DragAutoRefreshLayout extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            hoverIndex: null,
            layoutState: this.props.getState(),
            startIndex: null,
        };
    }

    public refreshLayout() {
        this.setState({
            layoutState: this.props.getState(),
        });
    }

    public render() {
        const layoutState = this.state.layoutState;
        const layoutStateStyle = getLayoutStateStyle(layoutState);
        const counts = new Map<string, number>();

        const background = backgroundToCss(
            layoutState.background,
            this.props.layoutUrlCache,
            this.props.layoutWidth,
        );

        const dragLayout = (
            <div
                className="layout"
                style={{
                    overflow: "hidden",
                    color: colorToCss(layoutState.text_color),
                    width: this.props.layoutWidth,
                    ...layoutStateStyle
                }}
            >
                <div style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    zIndex: -1,
                    ...background,
                }} />
                {
                    layoutState.components.map((c, i) => {
                        const componentType = Object.keys(c)[0];
                        const id = counts.get(componentType) || 0;
                        counts.set(componentType, id + 1);

                        const key = `${componentType}${id}`;

                        return <div
                            key={key}
                            onClick={(_) => this.props.onClick(i)}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", "");
                                this.setState({
                                    ...this.state,
                                    hoverIndex: i,
                                    startIndex: i,
                                });
                                this.props.onDrag(i);
                            }}
                            onDragOver={(e) => {
                                if (e.preventDefault) {
                                    e.preventDefault();
                                }
                                e.dataTransfer.dropEffect = "move";
                            }}
                            onDragEnter={(_) => {
                                this.setState({
                                    ...this.state,
                                    hoverIndex: i,
                                });
                            }}
                            onDragEnd={(_) => {
                                this.props.onDragEnd(i);
                                this.setState({
                                    ...this.state,
                                    hoverIndex: null,
                                    startIndex: null,
                                });
                            }}
                            onDrop={(e) => {
                                if (e.stopPropagation) {
                                    e.stopPropagation();
                                }
                                this.props.onDrop(i);
                                return false;
                            }}
                            style={{
                                cursor: "pointer",
                                position: "relative",
                            }}
                        >
                            {
                                getBorderDiv(i, this.state, this.props)
                            }
                            <Component
                                state={c}
                                layoutUrlCache={this.props.layoutUrlCache}
                                layoutWidth={this.props.layoutWidth}
                                componentId={key}
                            />
                        </div>;
                    })
                }
            </div>
        );

        return (
            <AutoRefresh update={() => this.refreshLayout()}>
                {dragLayout}
            </AutoRefresh>
        );
    }
}

function getBorderDiv(index: number, state: State, props: Props): Option<JSX.Element> {
    const style: any = {
        height: "100%",
        position: "absolute",
        width: "100%",
        zIndex: 2,
    };

    if (state.startIndex == null || state.startIndex === state.hoverIndex) {
        if (props.isSelected(index)) {
            style.border = "2px solid rgb(50, 114, 241)";
            style.width = "calc(100% - 4px)";
            style.height = "calc(100% - 4px)";
        } else {
            return null;
        }
    } else if (index === state.hoverIndex) {
        if (index < state.startIndex) {
            style.borderTop = "2px solid rgb(50, 114, 241)";
        } else {
            style.borderBottom = "2px solid rgb(50, 114, 241)";
            style.height = "calc(100% - 2px)";
        }
    } else {
        return null;
    }

    return <div style={style} />;
}
