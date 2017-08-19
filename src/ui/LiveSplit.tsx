import * as React from "react";
import Sidebar from "react-sidebar";
import AutoRefreshLayout from "../layout/AutoRefreshLayout";
import { Layout, LayoutEditor, Run, RunEditor, Segment, Timer, TimerPhase, TimingMethod } from "../livesplit";
import { exportFile, openFileAsArrayBuffer } from "../util/FileUtil";
import { andThen, assertNull, expect, maybeDispose, maybeDisposeAndThen } from "../util/OptionUtil";
import { LayoutEditor as LayoutEditorComponent } from "./LayoutEditor";
import { RunEditor as RunEditorComponent } from "./RunEditor";
import { Route, SideBarContent } from "./SideBarContent";

export interface State {
    timer: Timer,
    layout: Layout,
    sidebarOpen: boolean,
    runEditor: RunEditor | null,
    layoutEditor: LayoutEditor | null,
}

export class LiveSplit extends React.Component<{}, State> {
    private keyEvent: EventListenerObject;
    private scrollEvent: EventListenerObject;
    private rightClickEvent: EventListenerObject;

    constructor(props: {}) {
        super(props);

        const run = Run.new();
        run.setGameName("Game");
        run.setCategoryName("Category");
        run.pushSegment(Segment.new("Time"));
        const timer = expect(
            Timer.new(run),
            "The Default Run should be a valid Run",
        );

        if (window.location.hash.indexOf("#/splits-io/") === 0) {
            const loadingRun = Run.new();
            loadingRun.setGameName("Loading...");
            loadingRun.setCategoryName("Loading...");
            loadingRun.pushSegment(Segment.new("Time"));
            assertNull(
                timer.setRun(loadingRun),
                "The Default Loading Run should be a valid Run",
            );
            this.loadFromSplitsIO(window.location.hash.substr("#/splits-io/".length));
        } else {
            const lss = localStorage.getItem("splits");
            if (lss && lss.length > 0) {
                maybeDispose(
                    andThen(
                        Run.parseString(lss),
                        (r) => timer.setRun(r),
                    ),
                );
            }
        }

        let layout: Layout | null = null;
        try {
            const data = localStorage.getItem("layout");
            if (data) {
                layout = Layout.parseJson(JSON.parse(data));
            }
        } catch (_) { /* Looks like local storage has no valid data */ }
        if (!layout) {
            layout = Layout.defaultLayout();
        }

        this.state = {
            layout,
            layoutEditor: null,
            runEditor: null,
            sidebarOpen: false,
            timer,
        };
    }

    public componentWillMount() {
        this.scrollEvent = { handleEvent: (e: MouseWheelEvent) => this.onScroll(e) };
        window.addEventListener("wheel", this.scrollEvent);
        this.keyEvent = { handleEvent: (e: KeyboardEvent) => this.onKeyPress(e) };
        window.addEventListener("keypress", this.keyEvent);
        this.rightClickEvent = { handleEvent: (e: any) => this.onRightClick(e) };
        window.addEventListener("contextmenu", this.rightClickEvent, false);
    }

    public componentWillUnmount() {
        window.removeEventListener("wheel", this.scrollEvent);
        window.removeEventListener("keypress", this.keyEvent);
        window.removeEventListener("contextmenu", this.rightClickEvent);
        this.state.timer.dispose();
        this.state.layout.dispose();
    }

    public render() {
        const { route, content } = ((): { route: Route, content: JSX.Element } => {
            if (this.state.runEditor) {
                return {
                    route: "run-editor",
                    content: <RunEditorComponent editor={this.state.runEditor} />,
                };
            } else if (this.state.layoutEditor) {
                return {
                    route: "layout-editor",
                    content: <LayoutEditorComponent
                        editor={this.state.layoutEditor}
                        timer={this.state.timer}
                    />,
                };
            } else {
                return {
                    route: "main",
                    content: <div
                        style={{
                            margin: "10px",
                            marginBottom: "5px",
                        }}
                    >
                        <AutoRefreshLayout
                            getState={() => this.state.layout.stateAsJson(this.state.timer)}
                        />
                        <div className="buttons">
                            <button onClick={(_) => this.onSplit()}>
                                <i className="fa fa-play" aria-hidden="true" />
                            </button>
                            <div className="small">
                                <button onClick={(_) => this.onUndo()}>
                                    <i className="fa fa-arrow-up" aria-hidden="true" /></button>
                                <button onClick={(_) => this.onPause()}>
                                    <i className="fa fa-pause" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="small">
                                <button onClick={(_) => this.onSkip()}>
                                    <i className="fa fa-arrow-down" aria-hidden="true" />
                                </button>
                                <button onClick={(_) => this.onReset()}>
                                    <i className="fa fa-times" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>,
                };
            }
        })();

        const sidebarContent = (
            <SideBarContent
                route={route}
                callbacks={this}
                accessTimer={(closure) => {
                    closure(this.state.timer);
                }}
            />
        );

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

    public importSplits() {
        openFileAsArrayBuffer((file) => {
            const timer = this.state.timer;
            const run = Run.parseArray(new Int8Array(file));
            if (run) {
                maybeDisposeAndThen(
                    timer.setRun(run),
                    () => alert("Empty Splits are not supported."),
                );
            } else {
                alert("Couldn't parse the splits.");
            }
        });
    }

    public setCurrentTimingMethod(timingMethod: TimingMethod) {
        this.state.timer.setCurrentTimingMethod(timingMethod);
    }

    public switchToPreviousComparison() {
        this.state.timer.switchToPreviousComparison();
    }

    public switchToNextComparison() {
        this.state.timer.switchToNextComparison();
    }

    public openFromSplitsIO() {
        let id = prompt("Specify the splits i/o URL or ID:");
        if (!id) {
            return;
        }
        if (id.indexOf("https://splits.io/") === 0) {
            id = id.substr("https://splits.io/".length);
        }
        this.loadFromSplitsIO(id);
    }

    public uploadToSplitsIO() {
        const lss = this.state.timer.getRun().saveAsLss();
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "https://splits.io/api/v4/runs", true);
        xhr.onload = () => {
            const response = JSON.parse(xhr.responseText);
            const claim_uri = response.uris.claim_uri;
            const request = response.presigned_request;

            xhr = new XMLHttpRequest();
            xhr.open(request.method, request.uri, true);

            const formData = new FormData();
            const fields = request.fields;

            formData.append("key", fields.key);
            formData.append("policy", fields.policy);
            formData.append("x-amz-credential", fields["x-amz-credential"]);
            formData.append("x-amz-algorithm", fields["x-amz-algorithm"]);
            formData.append("x-amz-date", fields["x-amz-date"]);
            formData.append("x-amz-signature", fields["x-amz-signature"]);
            formData.append("file", lss);

            xhr.onload = () => {
                window.open(claim_uri);
            };
            xhr.onerror = () => {
                alert("Failed to upload the splits.");
            };

            xhr.send(formData);
        };
        xhr.onerror = () => {
            alert("Failed to upload the splits.");
        };
        xhr.send(null);
    }

    public exportSplits() {
        const lss = this.state.timer.getRun().saveAsLss();
        exportFile(this.state.timer.getRun().extendedFileName(true) + ".lss", lss);
    }

    public saveSplits() {
        const lss = this.state.timer.getRun().saveAsLss();
        localStorage.setItem("splits", lss);
    }

    public saveLayout() {
        const layout = this.state.layout.settingsAsJson();
        localStorage.setItem("layout", JSON.stringify(layout));
    }

    public openRunEditor() {
        if (this.state.timer.currentPhase() === TimerPhase.NotRunning) {
            const run = this.state.timer.getRun().clone();
            const editor = RunEditor.new(run);
            this.setState({
                ...this.state,
                runEditor: editor,
                sidebarOpen: false,
            });
        } else {
            alert("You can't edit your run while the timer is running.");
        }
    }

    public closeRunEditor(save: boolean) {
        const runEditor = expect(
            this.state.runEditor,
            "No Run Editor to close",
        );
        const run = runEditor.close();
        if (save) {
            assertNull(
                this.state.timer.setRun(run),
                "The Run Editor should always return a valid Run",
            );
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

    public openLayoutEditor() {
        const layout = this.state.layout.clone();
        const editor = LayoutEditor.new(layout);
        this.setState({
            ...this.state,
            layoutEditor: editor,
            sidebarOpen: false,
        });
    }

    public closeLayoutEditor(save: boolean) {
        const layoutEditor = expect(
            this.state.layoutEditor,
            "No Layout Editor to close",
        );
        const layout = layoutEditor.close();
        if (save) {
            this.state.layout.dispose();
            this.setState({
                ...this.state,
                layout,
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

    private loadFromSplitsIO(id: string) {
        const component = this;
        const apiXhr = new XMLHttpRequest();
        apiXhr.open("GET", "https://splits.io/api/v4/runs/" + id, true);
        apiXhr.onload = () => {
            const response = JSON.parse(apiXhr.responseText);
            if (response && response.run && response.run.program) {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", "https://splits.io/" + id + "/download/" + response.run.program, true);
                xhr.responseType = "arraybuffer";
                xhr.onload = () => {
                    const timer = component.state.timer;
                    maybeDispose(
                        andThen(
                            Run.parseArray(new Int8Array(xhr.response)),
                            (r) => timer.setRun(r),
                        ),
                    );
                };
                xhr.send(null);
            }
        };
        apiXhr.send(null);
    }

    private onScroll(e: WheelEvent) {
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.deltaY)));
        if (delta === 1) {
            this.state.layout.scrollUp();
        } else if (delta === -1) {
            this.state.layout.scrollDown();
        }
    }

    private onSetSidebarOpen(open: boolean) {
        this.setState({
            ...this.state,
            sidebarOpen: open,
        });
    }

    private onRightClick(e: any) {
        this.onSetSidebarOpen(true);
        e.preventDefault();
    }

    private onSplit() {
        this.state.timer.splitOrStart();
    }

    private onReset() {
        this.state.timer.reset(true);
    }

    private onPause() {
        this.state.timer.togglePauseOrStart();
    }

    private onUndo() {
        this.state.timer.undoSplit();
    }

    private onSkip() {
        this.state.timer.skipSplit();
    }

    private onPrintDebug() {
        this.state.timer.printDebug();
    }

    private onKeyPress(e: KeyboardEvent) {
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
                this.switchToPreviousComparison();
                break;
            }
            case 53: {
                // NumPad 5
                this.onPause();
                break;
            }
            case 54: {
                // NumPad 6
                this.switchToNextComparison();
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
}
