import * as React from "react";
import { LayoutStateJson } from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import Component from "./Component";

export interface Props {
    getState: () => LayoutStateJson,
    onClick: (componentIndex: number) => void,
    onDrag: (componentIndex: number) => void,
    onDragEnd: (componentIndex: number) => void,
    onDrop: (componentIndex: number) => void,
    isSelected: (componentIndex: number) => boolean,
}

export interface State {
    layoutState: LayoutStateJson,
    startIndex: number | null,
    hoverIndex: number | null,
}

export default class AutoRefreshLayout extends React.Component<Props, State> {
    private intervalID: any;

    constructor(props: Props) {
        super(props);

        this.state = {
            hoverIndex: null,
            layoutState: this.props.getState(),
            startIndex: null,
        };
    }

    public componentWillMount() {
        this.intervalID = setInterval(
            () => {
                this.setState({
                    layoutState: this.props.getState(),
                });
            },
            1000 / 30,
        );
    }

    public componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    public render() {
        const layoutState = this.state.layoutState;

        return (
            <div
                className="layout"
                style={{
                    background: gradientToCss(layoutState.background),
                    color: colorToCss(layoutState.text_color),
                }}
            >
                {
                    layoutState.components.map((c, i) =>
                        <div
                            key={i}
                            onClick={(_) => this.props.onClick(i)}
                            draggable
                            onDragStart={(_) => {
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
                            <Component state={c} layoutState={layoutState} />
                        </div>,
                    )
                }
            </div>
        );
    }
}

function getBorderDiv(index: number, state: State, props: Props): JSX.Element | null {
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
