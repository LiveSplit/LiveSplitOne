import * as React from "react";
import deepEqual from "fast-deep-equal";
import { ComponentStateJson, Color } from "../livesplit-core";
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

export interface Props {
    state: ComponentStateJson,
    layoutState: {
        thin_separators_color: Color,
        separators_color: Color,
    },
    layoutWidth: number,
    componentId: string,
}

export default class Component extends React.Component<Props> {
    public render() {
        const { state, layoutState } = this.props;
        if ("KeyValue" in state) {
            return <KeyValue state={state.KeyValue} />;
        } else if ("DetailedTimer" in state) {
            return <DetailedTimer
                state={state.DetailedTimer}
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
                layoutState={layoutState}
            />;
        } else if ("Text" in state) {
            return <Text state={state.Text} />;
        } else if ("Timer" in state) {
            return <Timer
                state={state.Timer}
                layoutWidth={this.props.layoutWidth}
                componentId={this.props.componentId}
            />;
        } else if ("Title" in state) {
            return <Title state={state.Title} />;
        } else if ("Separator" in state) {
            return <Separator layoutState={layoutState} />;
        } else if ("BlankSpace" in state) {
            return <BlankSpace state={state.BlankSpace} />;
        } else {
            return assertNever(state);
        }
    }

    public shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
        return !deepEqual(nextProps.state, this.props.state) ||
            !deepEqual(nextProps.layoutState, this.props.layoutState) ||
            nextProps.layoutWidth !== this.props.layoutWidth ||
            nextProps.componentId !== this.props.componentId;
    }
}
