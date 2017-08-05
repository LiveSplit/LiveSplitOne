import * as React from "react";
import { ComponentStateJson, LayoutStateJson } from "../livesplit";
import CurrentComparison from "./CurrentComparison";
import CurrentPace from "./CurrentPace";
import Delta from "./Delta";
import DetailedTimer from "./DetailedTimer";
import Graph from "./Graph";
import PossibleTimeSave from "./PossibleTimeSave";
import PreviousSegment from "./PreviousSegment";
import Splits from "./Splits";
import SumOfBest from "./SumOfBest";
import Timer from "./Timer";
import Title from "./Title";
import TotalPlaytime from "./TotalPlaytime";
import Separator from "./Separator";
import BlankSpace from "./BlankSpace";

export interface Props {
    state: ComponentStateJson,
    layoutState: LayoutStateJson,
}

export default class Component extends React.Component<Props> {
    render() {
        const componentState: any = this.props.state;
        const layoutState = this.props.layoutState;

        switch (Object.keys(componentState)[0]) {
            case "CurrentComparison": {
                return <CurrentComparison state={componentState.CurrentComparison} />;
            }
            case "CurrentPace": {
                return <CurrentPace state={componentState.CurrentPace} />;
            }
            case "Delta": {
                return <Delta state={componentState.Delta} />;
            }
            case "DetailedTimer": {
                return <DetailedTimer state={componentState.DetailedTimer} />;
            }
            case "Graph": {
                return <Graph state={componentState.Graph} />;
            }
            case "PossibleTimeSave": {
                return <PossibleTimeSave state={componentState.PossibleTimeSave} />;
            }
            case "PreviousSegment": {
                return <PreviousSegment state={componentState.PreviousSegment} />;
            }
            case "Splits": {
                return <Splits
                    state={componentState.Splits}
                    layoutState={layoutState}
                />;
            }
            case "SumOfBest": {
                return <SumOfBest state={componentState.SumOfBest} />;
            }
            case "Text": {
                return null;
                // return <Text state={componentState.Text} />;
            }
            case "Timer": {
                return <Timer state={componentState.Timer} />;
            }
            case "Title": {
                return <Title state={componentState.Title} />;
            }
            case "TotalPlaytime": {
                return <TotalPlaytime state={componentState.TotalPlaytime} />;
            }
            case "Separator": {
                return <Separator layoutState={layoutState} />;
            }
            case "BlankSpace": {
                return <BlankSpace state={componentState.BlankSpace} />;
            }
            default: {
                return null;
            }
        }
    }
}
