import * as React from "react";
import { LayoutStateJson } from "../livesplit-core";
import Layout from "./Layout";

export interface Props {
    getState: () => LayoutStateJson,
    width: number,
}

export interface State {
    layoutState: LayoutStateJson,
}

export default class AutoRefreshLayout extends React.Component<Props, State> {
    private intervalID: any;

    constructor(props: Props) {
        super(props);

        this.state = {
            layoutState: this.props.getState(),
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
        return (
            <Layout
                state={this.state.layoutState}
                width={this.props.width}
            />
        );
    }
}
