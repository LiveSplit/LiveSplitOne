import * as React from "react";
import * as Core from "../livesplit";
import AutoRefreshLayout from "../layout/AutoRefreshLayout";
import { RunEditor as RunEditorComponent } from "./RunEditor";
import { LayoutEditor as LayoutEditorComponent } from "./LayoutEditor";
import Sidebar from "react-sidebar";
import { expect, andThen } from "../util/OptionUtil";

export interface Props { }
export interface State {
    timer: Core.Timer,
    layout: Core.Layout,
    sidebarOpen: boolean,
    timingMethod: Core.TimingMethod | null,
    comparison: string | null,
    runEditor: Core.RunEditor | null,
    layoutEditor: Core.LayoutEditor | null,
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
        let timer = expect(
            Core.Timer.new(run),
            "The Default Run should be a valid Run",
        );

        if (window.location.hash.indexOf("#/splits-io/") == 0) {
            run.setGameName("Loading...");
            run.setCategoryName("Loading...");
            this.loadFromSplitsIO(window.location.hash.substr("#/splits-io/".length));
        } else {
            let lss = localStorage.getItem("splits");
            if (lss && lss.length > 0) {
                const failedRun = andThen(
                    Core.Run.parseString(lss),
                    r => timer.setRun(r),
                );
                if (failedRun) {
                    failedRun.dispose();
                }
            }
        }

        let layout: Core.Layout | null = null;
        try {
            const data = localStorage.getItem("layout");
            if (data) {
                layout = Core.Layout.parseJson(JSON.parse(data));
            }
        } catch (e) { }
        if (!layout) {
            layout = Core.Layout.defaultLayout();
        }

        this.state = {
            timer: timer,
            layout: layout,
            sidebarOpen: false,
            timingMethod: null,
            comparison: null,
            runEditor: null,
            layoutEditor: null,
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
        let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.deltaY)));
        if (delta == 1) {
            this.state.layout.scrollUp();
        } else if (delta == -1) {
            this.state.layout.scrollDown();
        }
    }

    update() {
        if (!this.state.runEditor && !this.state.layoutEditor) {
            this.setState({
                ...this.state,
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
        this.state.timer.splitOrStart();
    }

    onReset() {
        this.state.timer.reset(true);
    }

    onPause() {
        this.state.timer.togglePauseOrStart();
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

        let input = document.createElement('input');
        input.setAttribute("type", "file");
        input.onchange = (e: any) => {
            let file = e.target.files[0];
            if (!file) {
                return;
            }
            let reader = new FileReader();
            reader.onload = function (e: any) {
                let contents = e.target.result;
                let timer = component.state.timer;
                let run = Core.Run.parseArray(new Int8Array(contents));
                if (run) {
                    const failedRun = timer.setRun(run);
                    if (failedRun) {
                        failedRun.dispose();
                        alert("Empty Splits are not supported.");
                    }
                } else {
                    alert("Couldn't parse the splits.");
                }
            };
            reader.readAsArrayBuffer(file);
        };
        input.click();
    }

    loadFromSplitsIO(id: string) {
        let component = this;
        let apiXhr = new XMLHttpRequest();
        apiXhr.open('GET', "https://splits.io/api/v4/runs/" + id, true);
        apiXhr.onload = function () {
            let response = JSON.parse(apiXhr.responseText);
            if (response && response.run && response.run.program) {
                let xhr = new XMLHttpRequest();
                xhr.open('GET', "https://splits.io/" + id + "/download/" + response.run.program, true);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function () {
                    const timer = component.state.timer;
                    const failedRun = andThen(
                        Core.Run.parseArray(new Int8Array(xhr.response)),
                        r => timer.setRun(r),
                    );
                    if (failedRun) {
                        failedRun.dispose();
                    }
                };
                xhr.send(null);
            }
        };
        apiXhr.send(null);
    }

    openFromSplitsIO() {
        let id = prompt("Specify the splits i/o URL or ID");
        if (!id) {
            return;
        }
        if (id.indexOf("https://splits.io/") == 0) {
            id = id.substr("https://splits.io/".length);
        }
        this.loadFromSplitsIO(id);
    }

    uploadToSplitsIO() {
        let lss = this.state.timer.getRun().saveAsLss();
        let xhr = new XMLHttpRequest();
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
            let element = document.createElement('a');
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
            alert("You can't edit your run while the timer is running.");
        }
    }

    closeRunEditor(save: boolean) {
        const runEditor = expect(
            this.state.runEditor,
            "No Run Editor to close",
        );
        const run = runEditor.close();
        if (save) {
            const failedRun = this.state.timer.setRun(run);
            if (failedRun) {
                failedRun.dispose();
                throw "The Run Editor should always return a valid Run";
            }
            this.setState({
                ...this.state,
                runEditor: null,
                sidebarOpen: false,
            });
        } else {
            run.dispose();
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
        const layoutEditor = expect(
            this.state.layoutEditor,
            "No Layout Editor to close",
        );
        const layout = layoutEditor.close();
        if (save) {
            this.state.layout.dispose();
            this.setState({
                ...this.state,
                layout: layout,
                layoutEditor: null,
                sidebarOpen: false,
            });
            layout.remount();
        } else {
            layout.dispose();
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
        let sidebarContent;
        if (this.state.runEditor) {
            sidebarContent =
                <div className="sidebar-buttons">
                    <div className="small">
                        <button className="toggle-left" onClick={(_) => this.closeRunEditor(true)}><i className="fa fa-check" aria-hidden="true"></i> OK</button>
                        <button className="toggle-right" onClick={(_) => this.closeRunEditor(false)}><i className="fa fa-times" aria-hidden="true"></i> Cancel</button>
                    </div>
                </div>;
        } else if (this.state.layoutEditor) {
            sidebarContent =
                <div className="sidebar-buttons">
                    <div className="small">
                        <button className="toggle-left" onClick={(_) => this.closeLayoutEditor(true)}><i className="fa fa-check" aria-hidden="true"></i> OK</button>
                        <button className="toggle-right" onClick={(_) => this.closeLayoutEditor(false)}><i className="fa fa-times" aria-hidden="true"></i> Cancel</button>
                    </div>
                </div>;
        } else {
            sidebarContent =
                <div className="sidebar-buttons">
                    <button onClick={(_) => this.openRunEditor()}><i className="fa fa-pencil-square-o" aria-hidden="true"></i> Edit Splits</button>
                    <hr />
                    <button onClick={(_) => this.saveSplits()}><i className="fa fa-floppy-o" aria-hidden="true"></i> Save</button>
                    <button onClick={(_) => this.importSplits()}><i className="fa fa-download" aria-hidden="true"></i> Import</button>
                    <button onClick={(_) => this.exportSplits()}><i className="fa fa-upload" aria-hidden="true"></i> Export</button>
                    <button onClick={(_) => this.openFromSplitsIO()}><i className="fa fa-cloud-download" aria-hidden="true"></i> From splits i/o</button>
                    <button onClick={(_) => this.uploadToSplitsIO()}><i className="fa fa-cloud-upload" aria-hidden="true"></i> Upload to splits i/o</button>
                    <hr />
                    <button onClick={(_) => this.openLayoutEditor()}><i className="fa fa-pencil-square-o" aria-hidden="true"></i> Edit Layout</button>
                    <button onClick={(_) => this.saveLayout()}><i className="fa fa-floppy-o" aria-hidden="true"></i> Save Layout</button>
                    <hr />
                    <h2>Compare Against</h2>
                    <div className="choose-comparison">
                        <button onClick={(_) => this.onPreviousComparison()}><i className="fa fa-caret-left" aria-hidden="true"></i></button>
                        <span>{this.state.comparison}</span>
                        <button onClick={(_) => this.onNextComparison()}><i className="fa fa-caret-right" aria-hidden="true"></i></button>
                    </div>
                    <div className="small">
                        <button
                            onClick={(_) => {
                                this.state.timer.setCurrentTimingMethod(Core.TimingMethod.RealTime);
                                this.update();
                            }}
                            className={(this.state.timingMethod == Core.TimingMethod.RealTime ? "button-pressed" : "") + " toggle-left"}
                        >
                            Real Time
                        </button>
                        <button
                            onClick={(_) => {
                                this.state.timer.setCurrentTimingMethod(Core.TimingMethod.GameTime);
                                this.update();
                            }}
                            className={(this.state.timingMethod == Core.TimingMethod.GameTime ? "button-pressed" : "") + " toggle-right"}
                        >
                            Game Time
                        </button>
                    </div>
                </div>;
        }

        let content;
        if (this.state.runEditor) {
            content = <RunEditorComponent editor={this.state.runEditor} />;
        } else if (this.state.layoutEditor) {
            content = <LayoutEditorComponent
                editor={this.state.layoutEditor}
                timer={this.state.timer}
            />;
        } else {
            content = <div
                style={{
                    margin: "10px",
                    marginBottom: "5px",
                }}
            >
                <AutoRefreshLayout
                    getState={() => this.state.layout.stateAsJson(this.state.timer)}
                />
                <div className="buttons">
                    <button onClick={(_) => this.onSplit()}><i className="fa fa-play" aria-hidden="true"></i></button>
                    <div className="small">
                        <button onClick={(_) => this.onUndo()}><i className="fa fa-arrow-up" aria-hidden="true"></i></button>
                        <button onClick={(_) => this.onPause()}><i className="fa fa-pause" aria-hidden="true"></i></button>
                    </div>
                    <div className="small">
                        <button onClick={(_) => this.onSkip()}><i className="fa fa-arrow-down" aria-hidden="true"></i></button>
                        <button onClick={(_) => this.onReset()}><i className="fa fa-times" aria-hidden="true"></i></button>
                    </div>
                </div>
            </div>;
        }

        return (
            <Sidebar
                sidebar={sidebarContent}
                open={this.state.sidebarOpen}
                onSetOpen={((e: boolean) => this.onSetSidebarOpen(e)) as any}
                sidebarClassName="sidebar"
                contentClassName="livesplit-container"
            >
                {content}
            </Sidebar>
        );
    }
}
