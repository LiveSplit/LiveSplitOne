import * as React from "react";
import * as Core from "../livesplit";
import { Component as CurrentComparisonComponent } from "./CurrentComparison";
import { Component as CurrentPaceComponent } from "./CurrentPace";
import { Component as DeltaComponent } from "./Delta";
import { Component as DetailedTimerComponent } from "./DetailedTimer";
import { Component as GraphComponent } from "./Graph";
import { Component as PossibleTimeSaveComponent } from "./PossibleTimeSave";
import { Component as PreviousSegmentComponent } from "./PreviousSegment";
import { Component as SplitsComponent } from "./Splits";
import { Component as SumOfBestComponent } from "./SumOfBest";
import { Component as TimerComponent } from "./Timer";
import { Component as TitleComponent } from "./Title";
import { Component as TotalPlaytimeComponent } from "./TotalPlaytime";
import { RunEditor as RunEditorComponent } from "./RunEditor";
import { LayoutEditor as LayoutEditorComponent } from "./LayoutEditor";
import Sidebar from "react-sidebar";

export interface Props { }
export interface State {
    timer: Core.Timer,
    layout: Core.Layout,
    layoutState: Core.ComponentStateJson[],
    sidebarOpen: boolean,
    timingMethod?: Core.TimingMethod,
    comparison?: string,
    runEditor?: Core.RunEditor,
    layoutEditor?: Core.LayoutEditor,
}

export class LiveSplit extends React.Component<Props, State> {
    intervalID: any;
    keyEvent: EventListenerObject;
    scrollEvent: EventListenerObject;
    rightClickEvent: EventListenerObject;

    constructor(props: Props) {
        super(props);

        let run = Core.Run.new();
        run.setGameName("Game");
        run.setCategoryName("Category");
        run.pushSegment(Core.Segment.new("Time"));

        if (window.location.hash.indexOf("#/splits-io/") == 0) {
            run.setGameName("Loading...");
            run.setCategoryName("Loading...");
            this.loadFromSplitsIO(window.location.hash.substr("#/splits-io/".length));
        } else {
            let lss = localStorage.getItem("splits");
            if (lss != undefined && lss != null && lss.length > 0) {
                run.dispose();
                run = Core.Run.parseString(lss);
            }
        }

        var layout: Core.Layout = null;
        try {
            let data = localStorage.getItem("layout");
            layout = Core.Layout.parseJson(JSON.parse(data));
        } catch (e) { }
        if (layout == null) {
            layout = Core.Layout.new();
            layout.push(Core.TitleComponent.new().intoGeneric());
            layout.push(Core.SplitsComponent.new().intoGeneric());
            layout.push(Core.TimerComponent.new().intoGeneric());
            layout.push(Core.PreviousSegmentComponent.new().intoGeneric());
        }

        this.state = {
            timer: Core.Timer.new(run),
            layout: layout,
            layoutState: [],
            sidebarOpen: false,
        };
    }

    componentWillMount() {
        this.scrollEvent = { handleEvent: (e: MouseWheelEvent) => this.onScroll(e) };
        window.addEventListener('wheel', this.scrollEvent);
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
        window.removeEventListener('wheel', this.scrollEvent);
        window.removeEventListener('keypress', this.keyEvent);
        window.removeEventListener('contextmenu', this.rightClickEvent);
        this.state.timer.dispose();
        this.state.layout.dispose();
    }

    onScroll(e: WheelEvent) {
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.deltaY)));
        if (delta == 1) {
            this.state.layout.scrollUp();
        } else if (delta == -1) {
            this.state.layout.scrollDown();
        }
    }

    update() {
        if (!this.state.runEditor && !this.state.layoutEditor) {
            let layoutState = this.state.layout.stateAsJson(this.state.timer);

            this.setState({
                ...this.state,
                layoutState: layoutState,
                timingMethod: this.state.timer.currentTimingMethod(),
                comparison: this.state.timer.currentComparison(),
            });
        }
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
                let run = Core.Run.parseArray(new Int8Array(contents));
                if (run) {
                    component.setState({
                        ...component.state,
                        timer: Core.Timer.new(run),
                    });
                    oldTimer.dispose();
                } else {
                    alert("Couldn't parse the splits.");
                }
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
                        timer: Core.Timer.new(Core.Run.parseArray(new Int8Array(xhr.response))),
                    });
                    oldTimer.dispose();
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
        let lss = this.state.timer.getRun().saveAsLss();
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

        let lss = this.state.timer.getRun().saveAsLss();
        download(this.state.timer.getRun().extendedFileName(true) + ".lss", lss);
    }

    saveSplits() {
        let lss = this.state.timer.getRun().saveAsLss();
        localStorage.setItem("splits", lss);
    }

    saveLayout() {
        let layout = this.state.layout.settingsAsJson();
        localStorage.setItem("layout", JSON.stringify(layout));
    }

    openRunEditor() {
        if (this.state.timer.currentPhase() == Core.TimerPhase.NotRunning) {
            let run = this.state.timer.getRun().clone();
            let editor = Core.RunEditor.new(run);
            this.setState({
                ...this.state,
                runEditor: editor,
                sidebarOpen: false,
            });
        } else {
            alert("Not ok");
        }
    }

    closeRunEditor(save: boolean) {
        if (save) {
            let run = this.state.runEditor.close();
            let timer = Core.Timer.new(run);
            this.state.timer.dispose();
            this.setState({
                ...this.state,
                timer: timer,
                runEditor: null,
                sidebarOpen: false,
            });
        } else {
            this.setState({
                ...this.state,
                runEditor: null,
                sidebarOpen: false,
            });
        }
        this.state.layout.remount();
    }

    openLayoutEditor() {
        let layout = this.state.layout.clone();
        let editor = Core.LayoutEditor.new(layout);
        this.setState({
            ...this.state,
            layoutEditor: editor,
            sidebarOpen: false,
        });
    }

    closeLayoutEditor(save: boolean) {
        if (save) {
            let layout = this.state.layoutEditor.close();
            this.state.layout.dispose();
            this.setState({
                ...this.state,
                layout: layout,
                layoutEditor: null,
                sidebarOpen: false,
            });
            layout.remount();
        } else {
            this.setState({
                ...this.state,
                layoutEditor: null,
                sidebarOpen: false,
            });
            this.state.layout.remount();
        }
    }

    onKeyPress(e: KeyboardEvent) {
        if (this.state.runEditor || this.state.layoutEditor) {
            return;
        }

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
        var sidebarContent;
        if (this.state.runEditor) {
            sidebarContent =
                <div className="sidebar-buttons">
                    <div className="small">
                        <button className="toggle-left" onClick={(e) => this.closeRunEditor(true)}><i className="fa fa-check" aria-hidden="true"></i> OK</button>
                        <button className="toggle-right" onClick={(e) => this.closeRunEditor(false)}><i className="fa fa-times" aria-hidden="true"></i> Cancel</button>
                    </div>
                </div>;
        } else if (this.state.layoutEditor) {
            sidebarContent =
                <div className="sidebar-buttons">
                    <div className="small">
                        <button className="toggle-left" onClick={(e) => this.closeLayoutEditor(true)}><i className="fa fa-check" aria-hidden="true"></i> OK</button>
                        <button className="toggle-right" onClick={(e) => this.closeLayoutEditor(false)}><i className="fa fa-times" aria-hidden="true"></i> Cancel</button>
                    </div>
                </div>;
        } else {
            sidebarContent =
                <div className="sidebar-buttons">
                    <button onClick={(e) => this.openRunEditor()}><i className="fa fa-pencil-square-o" aria-hidden="true"></i> Edit Splits</button>
                    <hr />
                    <button onClick={(e) => this.saveSplits()}><i className="fa fa-floppy-o" aria-hidden="true"></i> Save</button>
                    <button onClick={(e) => this.importSplits()}><i className="fa fa-download" aria-hidden="true"></i> Import</button>
                    <button onClick={(e) => this.exportSplits()}><i className="fa fa-upload" aria-hidden="true"></i> Export</button>
                    <button onClick={(e) => this.openFromSplitsIO()}><i className="fa fa-cloud-download" aria-hidden="true"></i> From splits i/o</button>
                    <button onClick={(e) => this.uploadToSplitsIO()}><i className="fa fa-cloud-upload" aria-hidden="true"></i> Upload to splits i/o</button>
                    <hr />
                    <button onClick={(e) => this.openLayoutEditor()}><i className="fa fa-pencil-square-o" aria-hidden="true"></i> Edit Layout</button>
                    <button onClick={(e) => this.saveLayout()}><i className="fa fa-floppy-o" aria-hidden="true"></i> Save Layout</button>
                    <hr />
                    <h2>Compare Against</h2>
                    <div className="choose-comparison">
                        <button onClick={(e) => this.onPreviousComparison()}><i className="fa fa-caret-left" aria-hidden="true"></i></button>
                        <span>{this.state.comparison}</span>
                        <button onClick={(e) => this.onNextComparison()}><i className="fa fa-caret-right" aria-hidden="true"></i></button>
                    </div>
                    <div className="small">
                        <button onClick={(e) => this.state.timer.setCurrentTimingMethod(Core.TimingMethod.RealTime)} className={(this.state.timingMethod == Core.TimingMethod.RealTime ? "button-pressed" : "") + " toggle-left"}>Real Time</button>
                        <button onClick={(e) => this.state.timer.setCurrentTimingMethod(Core.TimingMethod.GameTime)} className={(this.state.timingMethod == Core.TimingMethod.GameTime ? "button-pressed" : "") + " toggle-right"}>Game Time</button>
                    </div>
                </div>;
        }

        var content;
        if (this.state.runEditor) {
            content = <RunEditorComponent editor={this.state.runEditor} />;
        } else if (this.state.layoutEditor) {
            content = <LayoutEditorComponent editor={this.state.layoutEditor} />;
        } else {
            let components: any[] = [];

            this.state.layoutState.forEach((componentState: any) => {
                var component;
                switch (Object.keys(componentState)[0]) {
                    case "CurrentComparison": {
                        component = <CurrentComparisonComponent state={componentState.CurrentComparison} />;
                        break;
                    }
                    case "CurrentPace": {
                        component = <CurrentPaceComponent state={componentState.CurrentPace} />;
                        break;
                    }
                    case "Delta": {
                        component = <DeltaComponent state={componentState.Delta} />;
                        break;
                    }
                    case "DetailedTimer": {
                        component = <DetailedTimerComponent state={componentState.DetailedTimer} />;
                        break;
                    }
                    case "Graph": {
                        component = <GraphComponent state={componentState.Graph} />;
                        break;
                    }
                    case "PossibleTimeSave": {
                        component = <PossibleTimeSaveComponent state={componentState.PossibleTimeSave} />;
                        break;
                    }
                    case "PreviousSegment": {
                        component = <PreviousSegmentComponent state={componentState.PreviousSegment} />;
                        break;
                    }
                    case "Splits": {
                        component = <SplitsComponent state={componentState.Splits} />;
                        break;
                    }
                    case "SumOfBest": {
                        component = <SumOfBestComponent state={componentState.SumOfBest} />;
                        break;
                    }
                    case "Text": {
                        return;
                        // component = <TextComponent state={componentState.Text} />;
                        // break;
                    }
                    case "Timer": {
                        component = <TimerComponent state={componentState.Timer} />;
                        break;
                    }
                    case "Title": {
                        component = <TitleComponent state={componentState.Title} />;
                        break;
                    }
                    case "TotalPlaytime": {
                        component = <TotalPlaytimeComponent state={componentState.TotalPlaytime} />;
                        break;
                    }
                    default: return;
                }
                components.push(component);
            });

            content = <div>
                <div className="livesplit">
                    {
                        components
                    }
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
            </div>;
        }

        return (
            <Sidebar sidebar={sidebarContent}
                open={this.state.sidebarOpen}
                onSetOpen={((e: boolean) => this.onSetSidebarOpen(e)) as any}
                sidebarClassName="sidebar"
                contentClassName="livesplit-container">
                {
                    content
                }
            </Sidebar>
        );
    }
}
