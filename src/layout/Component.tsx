import * as React from "react";
import { ComponentStateJson, LayoutStateJson } from "../livesplit";
import { assertNever } from "../util/OptionUtil";
import BlankSpace from "./BlankSpace";
import CurrentComparison from "./CurrentComparison";
import CurrentPace from "./CurrentPace";
import Delta from "./Delta";
import DetailedTimer from "./DetailedTimer";
import Graph from "./Graph";
import PossibleTimeSave from "./PossibleTimeSave";
import PreviousSegment from "./PreviousSegment";
import Separator from "./Separator";
import Splits from "./Splits";
import SumOfBest from "./SumOfBest";
import Text from "./Text";
import Timer from "./Timer";
import Title from "./Title";
import TotalPlaytime from "./TotalPlaytime";
import PbChance from "./PbChance";

export interface Props {
    state: ComponentStateJson,
    layoutState: LayoutStateJson,
    componentId: string,
}

export default class Component extends React.Component<Props> {
    public render() {
        const { state, layoutState } = this.props;
        if ("CurrentComparison" in state) {
            return <CurrentComparison state={state.CurrentComparison} />;
        } else if ("CurrentPace" in state) {
            return <CurrentPace state={state.CurrentPace} />;
        } else if ("Delta" in state) {
            return <Delta state={state.Delta} />;
        } else if ("DetailedTimer" in state) {
            return <DetailedTimer state={state.DetailedTimer} />;
        } else if ("Graph" in state) {
            return <Graph state={state.Graph} />;
        } else if ("PbChance" in state) {
            return <PbChance state={state.PbChance} />;
        } else if ("PossibleTimeSave" in state) {
            return <PossibleTimeSave state={state.PossibleTimeSave} />;
        } else if ("PreviousSegment" in state) {
            return <PreviousSegment state={state.PreviousSegment} />;
        } else if ("Splits" in state) {
            return <Splits
                state={state.Splits}
                layoutState={layoutState}
            />;
        } else if ("SumOfBest" in state) {
            return <SumOfBest state={state.SumOfBest} />;
        } else if ("Text" in state) {
            return <Text state={state.Text} />;
        } else if ("Timer" in state) {
            return <Timer state={state.Timer} componentId={this.props.componentId} />;
        } else if ("Title" in state) {
            return <Title state={state.Title} />;
        } else if ("TotalPlaytime" in state) {
            return <TotalPlaytime state={state.TotalPlaytime} />;
        } else if ("Separator" in state) {
            return <Separator layoutState={layoutState} />;
        } else if ("BlankSpace" in state) {
            return <BlankSpace state={state.BlankSpace} />;
        } else {
            return assertNever(state);
        }
    }
}
