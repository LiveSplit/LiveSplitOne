import * as React from "react";
import { LayoutStateJson } from "../livesplit-core";
import Layout from "./Layout";

export interface Props {
    getState: () => LayoutStateJson,
    allowResize: boolean,
    width: number,
    onResize(width: number): void,
}

export interface State {
    layoutState: LayoutStateJson,
}

export default class AutoRefreshLayout extends React.Component<Props, State> {
    private reqId: any;

    constructor(props: Props) {
        super(props);

        this.state = {
            layoutState: this.props.getState(),
        };
    }

    public componentWillMount() {
        let tick = () => {
            this.setState({
                layoutState: this.props.getState(),
            });
            this.reqId = requestAnimationFrame(tick)
        }

        this.reqId = requestAnimationFrame(tick)
    }

    public componentWillUnmount() {
        cancelAnimationFrame(this.reqId);
    }

    public render() {
        return (
            <Layout
                state={this.state.layoutState}
                allowResize={this.props.allowResize}
                width={this.props.width}
                onResize={this.props.onResize}
            />
        );
    }
}
