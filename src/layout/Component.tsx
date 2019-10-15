import * as React from "react";
import { ComponentStateJson, LayoutStateJson } from "../livesplit";
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
    layoutState: LayoutStateJson,
    componentId: string,
}

export default class Component extends React.Component<Props> {
    public render() {
        const { state, layoutState } = this.props;
        if ("KeyValue" in state) {
            return <KeyValue state={state.KeyValue} />;
        } else if ("DetailedTimer" in state) {
            return <DetailedTimer state={state.DetailedTimer} />;
        } else if ("Graph" in state) {
            return <Graph state={state.Graph} />;
        } else if ("Splits" in state) {
            return <Splits
                state={state.Splits}
                layoutState={layoutState}
            />;
        } else if ("Text" in state) {
            return <Text state={state.Text} />;
        } else if ("Timer" in state) {
            return <Timer state={state.Timer} componentId={this.props.componentId} />;
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
}
