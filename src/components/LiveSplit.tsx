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
    comparison?: string,
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
            comparison: this.state.timer.currentComparison(),
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

    onPreviousComparison() {
        this.state.timer.switchToPreviousComparison();
    }

    onNextComparison() {
        this.state.timer.switchToNextComparison();
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

    uploadToSplitsIO() {
        let lss = this.state.timer.saveRunAsLSS();
        var xhr = new XMLHttpRequest();
        xhr.open('POST', "https://splits.io/api/v4/runs", true);
        xhr.onload = function () {
            let response = JSON.parse(xhr.responseText);
            let claim_uri = response.uris.claim_uri;
            let request = response.presigned_request;

            xhr = new XMLHttpRequest();
            xhr.open(request.method, request.uri, true);

            let formData = new FormData();
            let fields = request.fields;

            formData.append("key", fields.key);
            formData.append("policy", fields.policy);
            formData.append("x-amz-credential", fields["x-amz-credential"]);
            formData.append("x-amz-algorithm", fields["x-amz-algorithm"]);
            formData.append("x-amz-date", fields["x-amz-date"]);
            formData.append("x-amz-signature", fields["x-amz-signature"]);
            formData.append("file", lss);

            xhr.onload = function () {
                window.open(claim_uri);
            };
            xhr.onerror = function () {
                alert("Failed to upload the splits.");
            };

            xhr.send(formData);
        };
        xhr.onerror = function () {
            alert("Failed to upload the splits.");
        };
        xhr.send(null);
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
            case 52: {
                // NumPad 4
                this.onPreviousComparison();
                break;
            }
            case 53: {
                // NumPad 5
                this.onPause();
                break;
            }
            case 54: {
                // NumPad 6
                this.onNextComparison();
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
                <button onClick={(e) => this.importSplits()}><i className="fa fa-download" aria-hidden="true"></i> Import</button>
                <button onClick={(e) => this.exportSplits()}><i className="fa fa-upload" aria-hidden="true"></i> Export</button>
                <button onClick={(e) => this.openFromSplitsIO()}><i className="fa fa-cloud-download" aria-hidden="true"></i> From splits i/o</button>
                <button onClick={(e) => this.uploadToSplitsIO()}><i className="fa fa-cloud-upload" aria-hidden="true"></i> Upload to splits i/o</button>
                <hr />
                <h2>Compare Against</h2>
                <div className="choose-comparison">
                    <button onClick={(e) => this.onPreviousComparison()}><i className="fa fa-caret-left" aria-hidden="true"></i></button>
                    <span>{this.state.comparison}</span>
                    <button onClick={(e) => this.onNextComparison()}><i className="fa fa-caret-right" aria-hidden="true"></i></button>
                </div>
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
                sidebarClassName="sidebar"
                contentClassName="livesplit-container">
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
