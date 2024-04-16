import * as React from "react";
import { LayoutStateJson } from "../livesplit-core";
import AutoRefresh from "../util/AutoRefresh";
import Layout from "./Layout";
import { UrlCache } from "../util/UrlCache";

export interface Props {
    getState: () => LayoutStateJson,
    layoutUrlCache: UrlCache,
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
                    layoutUrlCache={this.props.layoutUrlCache}
                    allowResize={this.props.allowResize}
                    width={this.props.width}
                    onResize={this.props.onResize}
                />
            </AutoRefresh>
        );
    }
}
