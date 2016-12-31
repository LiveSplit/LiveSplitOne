import * as React from "react";
import { Run, Segment, SegmentList, Timer } from "../livesplit";
import { Component as TimerComponent } from "./Timer";
import { Component as TitleComponent } from "./Title";
import { Component as SplitsComponent } from "./Splits";
import { Component as PreviousSegmentComponent } from "./PreviousSegment";

export interface Props { }
export interface State { }

export class LiveSplit extends React.Component<Props, State> {
    timer: Timer;

    constructor(props: Props) {
        super(props);

        let segments = new SegmentList();
        segments.push(new Segment("Hero's Sword"));
        segments.push(new Segment("Leaving Outset"));
        segments.push(new Segment("Forsaken Fortress 1"));
        segments.push(new Segment("Wind Waker"));
        segments.push(new Segment("Empty Bottle"));
        segments.push(new Segment("Delivery Bag"));
        segments.push(new Segment("Kargoroc Key"));
        segments.push(new Segment("Grappling Hook"));
        segments.push(new Segment("Enter Gohma"));
        segments.push(new Segment("Dragon Roost Cavern"));
        segments.push(new Segment("Northern Triangle"));
        segments.push(new Segment("Greatfish"));
        segments.push(new Segment("Bombs"));
        segments.push(new Segment("Deku Leaf"));
        segments.push(new Segment("Enter Kalle Demos"));

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

    onPause() {
        this.timer.pause();
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
                <PreviousSegmentComponent timer={this.timer} />
                <br />
                <br />
                <button onClick={(e) => this.onStart()}>Start</button>
                <button onClick={(e) => this.onSplit()}>Split</button>
                <button onClick={(e) => this.onReset()}>Reset</button>
                <button onClick={(e) => this.onPause()}>Pause</button>
                <button onClick={(e) => this.onUndo()}>Undo</button>
                <button onClick={(e) => this.onSkip()}>Skip</button>
                <button onClick={(e) => this.onPrintDebug()}>Debug</button>
            </div>
        );
    }
}
