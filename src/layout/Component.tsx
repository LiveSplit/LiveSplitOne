import * as React from "react";
import deepEqual from "fast-deep-equal";
import { ComponentStateJson } from "../livesplit-core";
import { assertNever } from "../util/OptionUtil";
import BlankSpace from "./BlankSpace";
import KeyValue from "./KeyValue";
import DetailedTimer from "./DetailedTimer";
import Graph from "./Graph";
import Separator from "./Separator";
import Splits from "./Splits";
import Text from "./Text";
import Timer from "./Timer";
import Title from "./Title";
import { UrlCache } from "../util/UrlCache";

export interface Props {
    state: ComponentStateJson,
    layoutUrlCache: UrlCache,
    layoutWidth: number,
    componentId: string,
}

export default class Component extends React.Component<Props> {
    public render() {
        const { state } = this.props;
        if ("KeyValue" in state) {
            return <KeyValue
                state={state.KeyValue}
            />;
        } else if ("DetailedTimer" in state) {
            return <DetailedTimer
                state={state.DetailedTimer}
                layoutUrlCache={this.props.layoutUrlCache}
                layoutWidth={this.props.layoutWidth}
            />;
        } else if ("Graph" in state) {
            return <Graph
                state={state.Graph}
                layoutWidth={this.props.layoutWidth}
            />;
        } else if ("Splits" in state) {
            return <Splits
                state={state.Splits}
                layoutUrlCache={this.props.layoutUrlCache}
            />;
        } else if ("Text" in state) {
            return <Text
                state={state.Text}
            />;
        } else if ("Timer" in state) {
            return <Timer
                state={state.Timer}
                layoutWidth={this.props.layoutWidth}
                componentId={this.props.componentId}
            />;
        } else if ("Title" in state) {
            return <Title
                state={state.Title}
                layoutUrlCache={this.props.layoutUrlCache}
            />;
        } else if ("Separator" in state) {
            return <Separator />;
        } else if ("BlankSpace" in state) {
            return <BlankSpace state={state.BlankSpace} />;
        } else {
            return assertNever(state);
        }
    }

    public shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
        return !deepEqual(nextProps.state, this.props.state) ||
            nextProps.layoutWidth !== this.props.layoutWidth ||
            nextProps.componentId !== this.props.componentId;
    }
}
