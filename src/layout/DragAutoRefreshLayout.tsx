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
    intervalID: any;

    constructor(props: Props) {
        super(props);

        this.state = {
            layoutState: this.props.getState(),
            startIndex: null,
            hoverIndex: null,
        };
    }

    componentWillMount() {
        this.intervalID = setInterval(
            () => {
                this.setState({
                    layoutState: this.props.getState(),
                });
            },
            1000 / 30
        );
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    render() {
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
                            onClick={_ => this.props.onClick(i)}
                            draggable={true}
                            onDragStart={_ => {
                                this.setState({
                                    ...this.state,
                                    startIndex: i,
                                    hoverIndex: i,
                                });
                                this.props.onDrag(i);
                            }}
                            onDragOver={(e) => {
                                if (e.preventDefault) {
                                    e.preventDefault();
                                }
                                e.dataTransfer.dropEffect = 'move';
                            }}
                            onDragEnter={_ => {
                                this.setState({
                                    ...this.state,
                                    hoverIndex: i,
                                });
                            }}
                            onDragEnd={_ => {
                                this.props.onDragEnd(i);
                                this.setState({
                                    ...this.state,
                                    startIndex: null,
                                    hoverIndex: null,
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
                                position: "relative",
                                cursor: "pointer",
                            }}
                        >
                            {
                                getBorderDiv(i, this.state, this.props)
                            }
                            <Component state={c} layoutState={layoutState} />
                        </div>
                    )
                }
            </div>
        );
    }
}

function getBorderDiv(index: number, state: State, props: Props): JSX.Element | null {
    const style: any = {
        position: "absolute",
        zIndex: 2,
        width: "100%",
        height: "100%",
    };

    if (state.startIndex == null || state.startIndex == state.hoverIndex) {
        if (props.isSelected(index)) {
            style.border = "2px solid rgb(50, 114, 241)";
            style.width = "calc(100% - 4px)";
            style.height = "calc(100% - 4px)";
        } else {
            return null;
        }
    } else if (index == state.hoverIndex) {
        if (index < state.startIndex) {
            style.borderTop = "2px solid rgb(50, 114, 241)";
        } else if (index > state.startIndex) {
            style.borderBottom = "2px solid rgb(50, 114, 241)";
            style.height = "calc(100% - 2px)";
        } else {
            return null;
        }
    } else {
        return null;
    }

    return <div style={style} />;
}
