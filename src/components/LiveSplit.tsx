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
    event: EventListenerObject;

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

    componentWillMount() {
        this.event = { handleEvent: (e: KeyboardEvent) => this.onKeyPress(e) };
        window.addEventListener('keypress', this.event);
    }

    componentWillUnmount() {
        window.removeEventListener('keypress', this.event);
        this.timer.drop();
    }

    onStart() {
        this.timer.start();
    }

    onSplit() {
        this.timer.split();
    }

    onReset() {
        this.timer.reset(true);
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

    onKeyPress(e: KeyboardEvent) {
        switch (e.keyCode) {
            case 49: {
                // NumPad 1
                this.onSplit();
                this.onStart();
                break;
            }
            case 50: {
                // NumPad 2
                this.onSkip();
                break;
            }
            case 51: {
                // NumPad 3
                this.onReset();
                break;
            }
            case 53: {
                // NumPad 5
                this.onPause();
                break;
            }
            case 55: {
                // NumPad 7
                this.onPrintDebug();
                break;
            }
            case 56: {
                // NumPad 8
                this.onUndo();
                break;
            }
        }
    }

    render() {
        return (
            <div className="livesplit">
                <TitleComponent timer={this.timer} />
                <SplitsComponent timer={this.timer} />
                <TimerComponent timer={this.timer} />
                <PreviousSegmentComponent timer={this.timer} />
            </div>
        );
    }
}
