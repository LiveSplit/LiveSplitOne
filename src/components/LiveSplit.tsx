import * as React from "react";
import { Run, Segment, SegmentList, Timer } from "../livesplit";
import { Component as TimerComponent } from "./Timer";
import { Component as TitleComponent } from "./Title";
import { Component as SplitsComponent } from "./Splits";

export interface Props { }
export interface State { }

export class LiveSplit extends React.Component<Props, State> {
    timer: Timer;

    constructor(props: Props) {
        super(props);

        let segments = new SegmentList();
        segments.push(new Segment("hi"));
        segments.push(new Segment("blargh"));

        let run = new Run(segments);
        run.setGame("The Legend of Zelda: The Wind Waker");
        run.setCategory("Any% (Tuner)");

        this.timer = new Timer(run);

        this.state = { };
    }

    componentWillUnmount() {
        this.timer.drop();
    }

    onStart() {
        this.timer.start();
    }

    onSplit() {
        this.timer.split();
    }

    onReset() {
        this.timer.reset();
    }

    onUndo() {
        this.timer.undoSplit();
    }

    onSkip() {
        this.timer.skipSplit();
    }

    onPrintDebug() {
        this.timer.printDebug();
    }

    render() {
        return (
            <div className="livesplit">
                <TitleComponent timer={this.timer} />
                <SplitsComponent timer={this.timer} />
                <TimerComponent timer={this.timer} />
                <button onClick={(e) => this.onStart()}>Start</button>
                <button onClick={(e) => this.onSplit()}>Split</button>
                <button onClick={(e) => this.onReset()}>Reset</button>
                <button onClick={(e) => this.onUndo()}>Undo</button>
                <button onClick={(e) => this.onSkip()}>Skip</button>
                <button onClick={(e) => this.onPrintDebug()}>Debug</button>
            </div>
        );
    }
}
