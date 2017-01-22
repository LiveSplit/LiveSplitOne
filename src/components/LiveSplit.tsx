import * as React from "react";
import { Run, Segment, SegmentList, Timer } from "../livesplit";
import { Component as TimerComponent } from "./Timer";
import { Component as TitleComponent } from "./Title";
import { Component as SplitsComponent } from "./Splits";
import { Component as PreviousSegmentComponent } from "./PreviousSegment";
import { Component as SumOfBestComponent } from "./SumOfBest";
import { Component as PossibleTimeSaveComponent } from "./PossibleTimeSave";
import Sidebar from "react-sidebar";

export interface Props { }
export interface State {
    timer: Timer,
    sidebarOpen: boolean,
}

export class LiveSplit extends React.Component<Props, State> {
    timer: Timer;
    keyEvent: EventListenerObject;

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

        if (window.location.hash.indexOf("#/splits-io/") == 0) {
            this.loadFromSplitsIO(window.location.hash.substr("#/splits-io/".length));
        }

        this.state = {
            timer: new Timer(run),
            sidebarOpen: false,
        };
    }

    componentWillMount() {
        this.keyEvent = { handleEvent: (e: KeyboardEvent) => this.onKeyPress(e) };
        window.addEventListener('keypress', this.keyEvent);
    }

    componentWillUnmount() {
        window.removeEventListener('keypress', this.keyEvent);
        this.state.timer.drop();
    }

    onSetSidebarOpen(open: boolean) {
        this.setState({
            ...this.state,
            sidebarOpen: open,
        });
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
                component.setState({
                    ...component.state,
                    timer: new Timer(Run.parse(new Int8Array(contents))),
                });
                oldTimer.drop();
            };
            reader.readAsArrayBuffer(file);
        };
        input.click();
    }

    loadFromSplitsIO(id: string) {
        var component = this;
        let apiXhr = new XMLHttpRequest();
        apiXhr.open('GET', "https://splits.io/api/v4/runs/" + id, true);
        apiXhr.onload = function () {
            let response = JSON.parse(apiXhr.responseText);
            if (response != null && response.run != null && response.run.program != null) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', "https://splits.io/" + id + "/download/" + response.run.program, true);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function () {
                    var oldTimer = component.state.timer;
                    component.setState({
                        ...component.state,
                        timer: new Timer(Run.parse(new Int8Array(xhr.response))),
                    });
                    oldTimer.drop();
                };
                xhr.onerror = function () {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', "https://splits.io/api/v4/runs/" + id + "/splits", true);
                    xhr.onload = function () {
                        response.splits = JSON.parse(xhr.responseText);
                        var oldTimer = component.state.timer;
                        component.setState({
                            ...component.state,
                            timer: new Timer(Run.parseString(JSON.stringify(response))),
                        });
                        oldTimer.drop();
                        alert("Due to a Cross-Origin Resource Sharing problem, the original splits file could not be loaded. " +
                        "A reconstruction of the splits file via the splits i/o API was loaded instead. " +
                        "While this may look like your original splits, some information might be lost.");
                    }
                    xhr.send(null);
                };
                xhr.send(null);
            }
        };
        apiXhr.send(null);
    }

    openFromSplitsIO() {
        var id = prompt("Specify the splits i/o URL or ID");
        if (id == null) {
            return;
        }
        if (id.indexOf("https://splits.io/") == 0) {
            id = id.substr("https://splits.io/".length);
        }
        this.loadFromSplitsIO(id);
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
            case 47: {
                // NumPad Slash
                this.onPrintDebug();
                break;
            }
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
                this.openSplits();
                break;
            }
            case 56: {
                // NumPad 8
                this.onUndo();
                break;
            }
            case 57: {
                // NumPad 9
                this.saveSplits();
                break;
            }
        }
    }

    render() {
        var sidebarContent = (
            <div className="sidebar-buttons">
                <button onClick={(e) => this.openSplits()}>Open</button>
                <button onClick={(e) => this.saveSplits()}>Save</button>
                <button onClick={(e) => this.openFromSplitsIO()}>From splits i/o</button>
            </div>
        );

        return (
            <Sidebar sidebar={sidebarContent}
                open={this.state.sidebarOpen}
                onSetOpen={((e: boolean) => this.onSetSidebarOpen(e)) as any}
                sidebarClassName="sidebar">
                <div className="livesplit">
                    <TitleComponent timer={this.state.timer} />
                    <SplitsComponent timer={this.state.timer} />
                    <TimerComponent timer={this.state.timer} />
                    <PreviousSegmentComponent timer={this.state.timer} />
                    <SumOfBestComponent timer={this.state.timer} />
                    <PossibleTimeSaveComponent timer={this.state.timer} />
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
                    <button onClick={(e) => this.onSetSidebarOpen(true)}>Menu</button>
                </div>
            </Sidebar>
        );
    }
}
