import * as React from "react";
import { LayoutStateJson } from "../livesplit";
import Layout from "./Layout";

export interface Props {
    getState: () => LayoutStateJson,
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
        return (
            <Layout state={this.state.layoutState} />
        );
    }
}
