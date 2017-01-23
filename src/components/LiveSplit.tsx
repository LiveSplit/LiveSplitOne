import * as React from "react";
import { Run, Segment, SegmentList, Timer, TimingMethod } from "../livesplit";
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
    timingMethod?: TimingMethod,
}

export class LiveSplit extends React.Component<Props, State> {
    intervalID: number;
    keyEvent: EventListenerObject;
    rightClickEvent: EventListenerObject;

    constructor(props: Props) {
        super(props);

        let segments = new SegmentList();
        segments.push(new Segment("Time"));
        let run = new Run(segments);
        run.setGame("Game");
        run.setCategory("Category");

        if (window.location.hash.indexOf("#/splits-io/") == 0) {
            run.setGame("Loading...");
            run.setCategory("Loading...");
            this.loadFromSplitsIO(window.location.hash.substr("#/splits-io/".length));
        } else {
            let lss = localStorage.getItem("splits");
            if (lss != undefined && lss != null && lss.length > 0) {
                new Timer(run).drop(); // TODO Drop this more nicely
                run = Run.parseString(lss);
            }
        }

        this.state = {
            timer: new Timer(run),
            sidebarOpen: false,
        };
    }

    componentWillMount() {
        this.keyEvent = { handleEvent: (e: KeyboardEvent) => this.onKeyPress(e) };
        window.addEventListener('keypress', this.keyEvent);
        this.rightClickEvent = { handleEvent: (e: any) => this.onRightClick(e) };
        window.addEventListener('contextmenu', this.rightClickEvent, false);
        this.intervalID = setInterval(
            () => this.update(),
            1000 / 30
        );
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
        window.removeEventListener('keypress', this.keyEvent);
        window.removeEventListener('contextmenu', this.rightClickEvent);
        this.state.timer.drop();
    }

    update() {
        this.setState({
            ...this.state,
            timingMethod: this.state.timer.currentTimingMethod(),
        });
    }

    onSetSidebarOpen(open: boolean) {
        this.setState({
            ...this.state,
            sidebarOpen: open,
        });
    }

    onRightClick(e: any) {
        this.onSetSidebarOpen(true);
        e.preventDefault();
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

    importSplits() {
        let component = this;

        var input = document.createElement('input');
        input.setAttribute("type", "file");
        input.onchange = (e: any) => {
            var file = e.target.files[0];
            if (!file) {
                return;
            }
            var reader = new FileReader();
            reader.onload = function (e: any) {
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

    exportSplits() {
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

    saveSplits() {
        let lss = this.state.timer.saveRunAsLSS();
        localStorage.setItem("splits", lss);
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
                this.importSplits();
                break;
            }
            case 56: {
                // NumPad 8
                this.onUndo();
                break;
            }
            case 57: {
                // NumPad 9
                this.exportSplits();
                break;
            }
        }
    }

    render() {
        var sidebarContent = (
            <div className="sidebar-buttons">
                <button onClick={(e) => this.saveSplits()}><i className="fa fa-floppy-o" aria-hidden="true"></i> Save</button>
                <button onClick={(e) => this.importSplits()}><i className="fa fa-upload" aria-hidden="true"></i> Import</button>
                <button onClick={(e) => this.exportSplits()}><i className="fa fa-download" aria-hidden="true"></i> Export</button>
                <button onClick={(e) => this.openFromSplitsIO()}><i className="fa fa-cloud-download" aria-hidden="true"></i> From splits i/o</button>
                <hr />
                <h2>Compare Against</h2>
                <div className="small">
                    <button onClick={(e) => this.state.timer.setCurrentTimingMethod(TimingMethod.RealTime)} className={(this.state.timingMethod == TimingMethod.RealTime ? "button-pressed" : "") + " toggle-left"}>Real Time</button>
                    <button onClick={(e) => this.state.timer.setCurrentTimingMethod(TimingMethod.GameTime)} className={(this.state.timingMethod == TimingMethod.GameTime ? "button-pressed" : "") + " toggle-right"}>Game Time</button>
                </div>
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
                    <button onClick={(e) => this.onSplit()}><i className="fa fa-play" aria-hidden="true"></i></button>
                    <div className="small">
                        <button onClick={(e) => this.onUndo()}><i className="fa fa-arrow-up" aria-hidden="true"></i></button>
                        <button onClick={(e) => this.onPause()}><i className="fa fa-pause" aria-hidden="true"></i></button>
                    </div>
                    <div className="small">
                        <button onClick={(e) => this.onSkip()}><i className="fa fa-arrow-down" aria-hidden="true"></i></button>
                        <button onClick={(e) => this.onReset()}><i className="fa fa-times" aria-hidden="true"></i></button>
                    </div>
                </div>
            </Sidebar>
        );
    }
}
