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
}

export default class AutoRefreshLayout extends React.Component<Props, State> {
    intervalID: any;

    constructor(props: Props) {
        super(props);

        this.state = {
            layoutState: this.props.getState(),
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
                            onClick={(_) => this.props.onClick(i)}
                            draggable={true}
                            onDragStart={(_) => this.props.onDrag(i)}
                            onDragOver={(e) => {
                                if (e.preventDefault) {
                                    e.preventDefault();
                                }
                                e.dataTransfer.dropEffect = 'move';
                            }}
                            onDragEnd={(_) => {
                                this.props.onDragEnd(i);
                                this.setState({ ...this.state });
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
                                this.props.isSelected(i)
                                    ? <div style={{
                                        border: "2px solid rgb(50, 114, 241)",
                                        position: "absolute",
                                        width: "calc(100% - 4px)",
                                        height: "calc(100% - 4px)",
                                    }} />
                                    : null
                            }
                            <Component state={c} layoutState={layoutState} />
                        </div>
                    )
                }
            </div>
        );
    }
}
