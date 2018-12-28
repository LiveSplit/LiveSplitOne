import * as React from "react";
import Sidebar from "react-sidebar";
import AutoRefreshLayout from "../layout/AutoRefreshLayout";
import {
    HotkeySystem, Layout, LayoutEditor, Run, RunEditor,
    Segment, SharedTimer, Timer, TimerPhase, TimingMethod,
    TimeSpan, TimerRef, TimerRefMut, HotkeyConfig,
} from "../livesplit";
import { exportFile, openFileAsArrayBuffer, openFileAsString } from "../util/FileUtil";
import { Option, assertNull, expect, maybeDispose, maybeDisposeAndThen, map, panic } from "../util/OptionUtil";
import * as SplitsIO from "../util/SplitsIO";
import { LayoutEditor as LayoutEditorComponent } from "./LayoutEditor";
import { RunEditor as RunEditorComponent } from "./RunEditor";
import { SettingsEditor as SettingsEditorComponent } from "./SettingsEditor";
import { Route, SideBarContent } from "./SideBarContent";
import { toast } from "react-toastify";

enum MenuKind {
    Timer,
    RunEditor,
    LayoutEditor,
    SettingsEditor,
}

type Menu =
    { kind: MenuKind.Timer } |
    { kind: MenuKind.RunEditor, editor: RunEditor } |
    { kind: MenuKind.LayoutEditor, editor: LayoutEditor } |
    { kind: MenuKind.SettingsEditor, config: HotkeyConfig };

export interface State {
    hotkeySystem: HotkeySystem,
    timer: SharedTimer,
    layout: Layout,
    sidebarOpen: boolean,
    menu: Menu,
}

export class LiveSplit extends React.Component<{}, State> {
    private scrollEvent: Option<EventListenerObject>;
    private rightClickEvent: Option<EventListenerObject>;
    private connection: Option<WebSocket>;

    constructor(props: {}) {
        super(props);

        const run = Run.new();
        run.setGameName("Game");
        run.setCategoryName("Category");
        run.pushSegment(Segment.new("Time"));

        const timer = expect(
            Timer.new(run),
            "The Default Run should be a valid Run",
        ).intoShared();

        let hotkeySystem = null;
        const settings = localStorage.getItem("settings");
        try {
            if (settings) {
                const config = HotkeyConfig.parseJson(JSON.parse(settings).hotkeys);
                if (config != null) {
                    hotkeySystem = HotkeySystem.withConfig(timer.share(), config);
                }
            }
        } catch (_) { /* Looks like local storage has no valid data */ }
        if (hotkeySystem == null) {
            hotkeySystem = expect(
                HotkeySystem.new(timer.share()),
                "Couldn't initialize the hotkeys",
            );
        }

        if (window.location.hash.indexOf("#/splits-io/") === 0) {
            const loadingRun = Run.new();
            loadingRun.setGameName("Loading...");
            loadingRun.setCategoryName("Loading...");
            loadingRun.pushSegment(Segment.new("Time"));
            assertNull(
                timer.writeWith((t) => t.setRun(loadingRun)),
                "The Default Loading Run should be a valid Run",
            );
            this.loadFromSplitsIO(window.location.hash.substr("#/splits-io/".length));
        } else {
            const lss = localStorage.getItem("splits");
            if (lss != null) {
                const result = Run.parseString(lss, "", false);
                if (result.parsedSuccessfully()) {
                    maybeDispose(result.unwrap().with(
                        (r) => timer.writeWith((t) => t.setRun(r)),
                    ));
                }
            }
        }

        let layout: Option<Layout> = null;
        try {
            const data = localStorage.getItem("layout");
            if (data) {
                layout = Layout.parseJson(JSON.parse(data));
            }
        } catch (_) { /* Looks like local storage has no valid data */ }
        if (layout == null) {
            layout = Layout.defaultLayout();
        }

        this.state = {
            layout,
            menu: { kind: MenuKind.Timer },
            sidebarOpen: false,
            timer,
            hotkeySystem,
        };
    }

    public componentWillMount() {
        this.scrollEvent = { handleEvent: (e: MouseWheelEvent) => this.onScroll(e) };
        window.addEventListener("wheel", this.scrollEvent);
        this.rightClickEvent = { handleEvent: (e: any) => this.onRightClick(e) };
        window.addEventListener("contextmenu", this.rightClickEvent, false);
        window.onbeforeunload = (e) => {
            const hasBeenModified = this.state.timer.readWith((t) => t.getRun().hasBeenModified());
            if (hasBeenModified) {
                e.returnValue = "There are unsaved changes. Do you really want to close LiveSplit One?";
                return e.returnValue;
            }
            return null;
        };
    }

    public componentWillUnmount() {
        window.removeEventListener(
            "wheel",
            expect(this.scrollEvent, "A Scroll Event should exist"),
        );
        window.removeEventListener(
            "contextmenu",
            expect(this.rightClickEvent, "A Right Click Event should exist"),
        );
        this.state.timer.dispose();
        this.state.layout.dispose();
        maybeDispose(this.state.hotkeySystem);
    }

    public render() {
        const [route, content] = ((): [Route, JSX.Element] => {
            if (this.state.menu.kind === MenuKind.RunEditor) {
                return [
                    "run-editor",
                    <RunEditorComponent editor={this.state.menu.editor} />,
                ];
            } else if (this.state.menu.kind === MenuKind.LayoutEditor) {
                return [
                    "layout-editor",
                    <LayoutEditorComponent
                        editor={this.state.menu.editor}
                        timer={this.state.timer}
                    />,
                ];
            } else if (this.state.menu.kind === MenuKind.SettingsEditor) {
                return [
                    "settings-editor",
                    <SettingsEditorComponent hotkeyConfig={this.state.menu.config} />,
                ];
            } else {
                return [
                    "main",
                    <div
                        style={{
                            margin: "10px",
                            marginBottom: "5px",
                        }}
                    >
                        <div
                            onClick={(_) => this.splitOrStart()}
                            style={{
                                display: "inline-block",
                                cursor: "pointer",
                            }}
                        >
                            <AutoRefreshLayout
                                getState={() => this.state.timer.readWith(
                                    (t) => this.state.layout.stateAsJson(t),
                                )}
                            />
                        </div>
                        <div className="buttons">
                            <div className="small">
                                <button onClick={(_) => this.undoSplit()}>
                                    <i className="fa fa-arrow-up" aria-hidden="true" /></button>
                                <button onClick={(_) => this.togglePauseOrStart()}>
                                    <i className="fa fa-pause" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="small">
                                <button onClick={(_) => this.skipSplit()}>
                                    <i className="fa fa-arrow-down" aria-hidden="true" />
                                </button>
                                <button onClick={(_) => this.reset()}>
                                    <i className="fa fa-times" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>,
                ];
            }
        })();

        const sidebarContent = (
            <SideBarContent
                route={route}
                callbacks={this}
                timer={this.state.timer}
                sidebarOpen={this.state.sidebarOpen}
                connectionState={map(this.connection, (s) => s.readyState) || WebSocket.CLOSED}
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

    public async importSplits() {
        const [file] = await openFileAsArrayBuffer();
        const timer = this.state.timer;
        const result = Run.parseArray(new Int8Array(file), "", false);
        if (result.parsedSuccessfully()) {
            const run = result.unwrap();
            maybeDisposeAndThen(
                timer.writeWith((t) => t.setRun(run)),
                () => toast.error("Empty Splits are not supported."),
            );
        } else {
            toast.error("Couldn't parse the splits.");
        }
    }

    public setCurrentTimingMethod(timingMethod: TimingMethod) {
        this.writeWith((t) => t.setCurrentTimingMethod(timingMethod));
    }

    public switchToPreviousComparison() {
        this.writeWith((t) => t.switchToPreviousComparison());
    }

    public switchToNextComparison() {
        this.writeWith((t) => t.switchToNextComparison());
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

    public async uploadToSplitsIO(): Promise<Option<Window>> {
        const lss = this.readWith((t) => t.getRun().saveAsLss());

        try {
            const claimUri = await SplitsIO.uploadLss(lss);
            return window.open(claimUri);
        } catch (_) {
            toast.error("Failed to upload the splits.");
            return null;
        }
    }

    public exportSplits() {
        const [lss, name] = this.writeWith((t) => {
            t.markAsUnmodified();
            const run = t.getRun();
            return [
                run.saveAsLss(),
                run.extendedFileName(true),
            ];
        });
        try {
            exportFile(name + ".lss", lss);
        } catch (_) {
            toast.error("Failed to export the splits.");
        }
    }

    public saveSplits() {
        const lss = this.writeWith((t) => {
            t.markAsUnmodified();
            return t.saveAsLss();
        });
        try {
            localStorage.setItem("splits", lss);
        } catch (_) {
            toast.error("Failed to save the splits.");
        }
    }

    public saveLayout() {
        try {
            const layout = this.state.layout.settingsAsJson();
            localStorage.setItem("layout", JSON.stringify(layout));
        } catch (_) {
            toast.error("Failed to save the layout.");
        }
    }

    public async importLayout() {
        const [file] = await openFileAsString();
        let layout = null;
        try {
            layout = Layout.parseJson(JSON.parse(file));
        } catch (_) { /* Failed to load the layout */ }
        if (layout == null) {
            layout = Layout.parseOriginalLivesplitString(file);
        }
        if (layout != null) {
            this.state.layout.dispose();
            this.setState({
                ...this.state,
                layout,
            });
            layout.remount();
            return;
        }
        toast.error("The layout could not be loaded. This may not be a valid LiveSplit or LiveSplit One Layout.");
    }

    public exportLayout() {
        const layout = this.state.layout.settingsAsJson();
        exportFile("layout.ls1l", JSON.stringify(layout, null, 4));
    }

    public openRunEditor() {
        const run = this.readWith((t) => {
            if (t.currentPhase() === TimerPhase.NotRunning) {
                return t.getRun().clone();
            } else {
                return null;
            }
        });

        if (run != null) {
            this.state.hotkeySystem.deactivate();
            const editor = expect(
                RunEditor.new(run),
                "The Run Editor should always be able to be opened.",
            );
            this.setState({
                ...this.state,
                menu: { kind: MenuKind.RunEditor, editor },
                sidebarOpen: false,
            });
        } else {
            toast.error("You can't edit your run while the timer is running.");
        }
    }

    public closeRunEditor(save: boolean) {
        if (this.state.menu.kind !== MenuKind.RunEditor) {
            panic("No Run Editor to close");
            return;
        }
        const runEditor = this.state.menu.editor;
        const run = runEditor.close();
        if (save) {
            assertNull(
                this.writeWith((t) => t.setRun(run)),
                "The Run Editor should always return a valid Run.",
            );
            this.setState({
                ...this.state,
                menu: { kind: MenuKind.Timer },
                sidebarOpen: false,
            });
        } else {
            run.dispose();
            this.setState({
                ...this.state,
                menu: { kind: MenuKind.Timer },
                sidebarOpen: false,
            });
        }
        this.state.layout.remount();
        this.state.hotkeySystem.activate();
    }

    public openLayoutEditor() {
        this.state.hotkeySystem.deactivate();

        const layout = this.state.layout.clone();
        const editor = expect(
            LayoutEditor.new(layout),
            "The Layout Editor should always be able to be opened.",
        );
        this.setState({
            ...this.state,
            menu: { kind: MenuKind.LayoutEditor, editor },
            sidebarOpen: false,
        });
    }

    public closeLayoutEditor(save: boolean) {
        if (this.state.menu.kind !== MenuKind.LayoutEditor) {
            panic("No Layout Editor to close.");
            return;
        }
        const layoutEditor = this.state.menu.editor;
        const layout = layoutEditor.close();
        if (save) {
            this.state.layout.dispose();
            this.setState({
                ...this.state,
                layout,
                menu: { kind: MenuKind.Timer },
                sidebarOpen: false,
            });
            layout.remount();
        } else {
            layout.dispose();
            this.setState({
                ...this.state,
                menu: { kind: MenuKind.Timer },
                sidebarOpen: false,
            });
            this.state.layout.remount();
        }
        this.state.hotkeySystem.activate();
    }

    public openSettingsEditor() {
        this.state.hotkeySystem.deactivate();
        this.setState({
            ...this.state,
            menu: {
                kind: MenuKind.SettingsEditor,
                config: this.state.hotkeySystem.config(),
            },
            sidebarOpen: false,
        });
    }

    public closeSettingsEditor(save: boolean) {
        const menu = this.state.menu;

        if (menu.kind !== MenuKind.SettingsEditor) {
            panic("No Settings Editor to close.");
            return;
        }

        if (save) {
            try {
                const hotkeys = menu.config.asJson();
                const settings = { hotkeys };
                localStorage.setItem("settings", JSON.stringify(settings));
            } catch (_) {
                toast.error("Failed to save the settings.");
            }
            this.state.hotkeySystem.setConfig(menu.config);
        } else {
            menu.config.dispose();
        }

        this.setState({
            ...this.state,
            menu: { kind: MenuKind.Timer },
            sidebarOpen: false,
        });

        this.state.layout.remount();
        this.state.hotkeySystem.activate();
    }

    public connectToServerOrDisconnect() {
        if (this.connection) {
            if (this.connection.readyState === WebSocket.OPEN) {
                this.connection.close();
                this.forceUpdate();
            }
            return;
        }
        const url = prompt("Specify the WebSocket URL:");
        if (!url) {
            return;
        }
        try {
            this.connection = new WebSocket(url);
        } catch (e) {
            toast.error(`Failed to connect: ${e}`);
            throw e;
        }
        this.forceUpdate();
        let wasConnected = false;
        this.connection.onopen = (_) => {
            wasConnected = true;
            toast.info("Connected to server");
            this.forceUpdate();
        };
        this.connection.onerror = (e) => {
            toast.error(e);
        };
        this.connection.onmessage = (e) => {
            // TODO Clone the Shared Timer. This assumes that `this` is always
            // mounted.
            if (typeof e.data === "string") {
                const [command, ...args] = e.data.split(" ");
                switch (command) {
                    case "start": this.start(); break;
                    case "split": this.split(); break;
                    case "splitorstart": this.splitOrStart(); break;
                    case "reset": this.reset(); break;
                    case "togglepause": this.togglePauseOrStart(); break;
                    case "undo": this.undoSplit(); break;
                    case "skip": this.skipSplit(); break;
                    case "initgametime": this.initializeGameTime(); break;
                    case "setgametime": this.setGameTime(args[0]); break;
                    case "setloadingtimes": this.setLoadingTimes(args[0]); break;
                    case "pausegametime": this.pauseGameTime(); break;
                    case "resumegametime": this.resumeGameTime(); break;
                }
            }
        };
        this.connection.onclose = (_) => {
            if (wasConnected) {
                toast.info("Closed connection to server");
            }
            this.connection = null;
            this.forceUpdate();
        };
    }

    private async loadFromSplitsIO(id: string) {
        try {
            const run = await SplitsIO.downloadById(id);
            maybeDisposeAndThen(
                this.writeWith((t) => t.setRun(run)),
                () => toast.error("The downloaded splits are not valid."),
            );
        } catch (_) {
            toast.error("Failed to download the splits.");
        }
    }

    private onScroll(e: WheelEvent) {
        const delta = Math.max(-1, Math.min(1, -e.deltaY));
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

    private writeWith<T>(action: (timer: TimerRefMut) => T): T {
        return this.state.timer.writeWith(action);
    }

    private readWith<T>(action: (timer: TimerRef) => T): T {
        return this.state.timer.readWith(action);
    }

    private start() {
        this.writeWith((t) => t.start());
    }

    private split() {
        this.writeWith((t) => t.split());
    }

    private splitOrStart() {
        this.writeWith((t) => t.splitOrStart());
    }

    private reset() {
        this.writeWith((t) => t.reset(true));
    }

    private togglePauseOrStart() {
        this.writeWith((t) => t.togglePauseOrStart());
    }

    private undoSplit() {
        this.writeWith((t) => t.undoSplit());
    }

    private skipSplit() {
        this.writeWith((t) => t.skipSplit());
    }

    private initializeGameTime() {
        this.writeWith((t) => t.initializeGameTime());
    }

    private setGameTime(gameTime: string) {
        const time = TimeSpan.parse(gameTime);
        if (time != null) {
            time.with((time) => {
                this.writeWith((t) => t.setGameTime(time));
            });
        }
    }

    private setLoadingTimes(loadingTimes: string) {
        const time = TimeSpan.parse(loadingTimes);
        if (time != null) {
            time.with((time) => {
                this.writeWith((t) => t.setLoadingTimes(time));
            });
        }
    }

    private pauseGameTime() {
        this.writeWith((t) => t.pauseGameTime());
    }

    private resumeGameTime() {
        this.writeWith((t) => t.resumeGameTime());
    }
}
