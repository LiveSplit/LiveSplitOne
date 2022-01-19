import * as React from "react";
import { LayoutStateJson, LayoutStateRef } from "../livesplit-core";
import AutoRefresh from "../util/AutoRefresh";
import Layout from "./Layout";

export interface Props {
    getState: () => LayoutStateJson,
    stateRef: LayoutStateRef,
    allowResize: boolean,
    width: number,
    onResize(width: number): void,
}

export interface State {
    layoutState: LayoutStateJson,
}

export default class AutoRefreshLayout extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            layoutState: this.props.getState(),
        };
    }

    public refreshLayout() {
        this.setState({
            layoutState: this.props.getState(),
        });
    }

    public render() {
        return (
            <AutoRefresh update={() => this.refreshLayout()} >
                <Layout
                    state={this.state.layoutState}
                    stateRef={this.props.stateRef}
                    allowResize={this.props.allowResize}
                    width={this.props.width}
                    onResize={this.props.onResize}
                />
            </AutoRefresh>
        );
    }
}
