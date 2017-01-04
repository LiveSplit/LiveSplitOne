import * as React from "react";
import { Run, Segment, SegmentList, Timer } from "../livesplit";
import { Component as TimerComponent } from "./Timer";
import { Component as TitleComponent } from "./Title";
import { Component as SplitsComponent } from "./Splits";
import { Component as PreviousSegmentComponent } from "./PreviousSegment";

export interface Props { }
export interface State {
    timer: Timer,
}

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

        this.state = { timer: new Timer(run) };
    }

    componentWillMount() {
        this.event = { handleEvent: (e: KeyboardEvent) => this.onKeyPress(e) };
        window.addEventListener('keypress', this.event);
    }

    componentWillUnmount() {
        window.removeEventListener('keypress', this.event);
        this.state.timer.drop();
    }

    onSplit() {
        this.state.timer.split();
        this.state.timer.start();
    }

    onReset() {
        this.state.timer.reset(true);
    }

    onPause() {
        this.state.timer.pause();
    }

    onUndo() {
        this.state.timer.undoSplit();
    }

    onSkip() {
        this.state.timer.skipSplit();
    }

    onPrintDebug() {
        this.state.timer.printDebug();
    }

    openSplits() {
        let component = this;

        var input = document.createElement('input');
        input.setAttribute("type", "file");
        input.onchange = (e: any) => {
            var file = e.target.files[0];
            if (!file) {
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e: any) {
                var contents = e.target.result;
                let oldTimer = component.state.timer;
                component.setState({ timer: new Timer(Run.fromFile(contents)) });
                oldTimer.drop();
            };
            reader.readAsText(file);
        };
        input.click();
    }

    saveSplits() {
        function download(filename: any, text: any) {
            var element = document.createElement('a');
            element.setAttribute('href', 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', filename);

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        }

        let lss = this.state.timer.saveRunAsLSS();
        download("splits.lss", lss);
    }

    onKeyPress(e: KeyboardEvent) {
        switch (e.charCode) {
            case 49: {
                // NumPad 1
                this.onSplit();
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
            case 57: {
                // NumPad 9
                this.openSplits();
                break;
            }
        }
    }

    render() {
        return (
            <div>
                <div className="livesplit">
                    <TitleComponent timer={this.state.timer} />
                    <SplitsComponent timer={this.state.timer} />
                    <TimerComponent timer={this.state.timer} />
                    <PreviousSegmentComponent timer={this.state.timer} />
                </div>
                <div className="buttons">
                    <button onClick={(e) => this.onSplit()}>Split</button>
                    <div className="small">
                        <button onClick={(e) => this.onUndo()}>Undo</button>
                        <button onClick={(e) => this.onPause()}>Pause</button>
                    </div>
                    <div className="small">
                        <button onClick={(e) => this.onSkip()}>Skip</button>
                        <button onClick={(e) => this.onReset()}>Reset</button>
                    </div>
                    <button onClick={(e) => this.openSplits()}>Open</button>
                    <button onClick={(e) => this.saveSplits()}>Save</button>
                </div>
            </div>
        );
    }
}
