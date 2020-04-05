import * as React from "react";
import Sidebar from "react-sidebar";
import DragUpload from "./DragUpload";
import AutoRefreshLayout from "../layout/AutoRefreshLayout";
import {
    HotkeySystem, Layout, LayoutEditor, Run, RunEditor,
    Segment, SharedTimer, Timer, TimingMethod,
    TimeSpan, TimerRef, TimerRefMut, HotkeyConfig,
} from "../livesplit-core";
import { convertFileToArrayBuffer, convertFileToString, exportFile, openFileAsArrayBuffer, openFileAsString } from "../util/FileUtil";
import { Option, assertNull, expect, maybeDisposeAndThen, panic } from "../util/OptionUtil";
import * as SplitsIO from "../util/SplitsIO";
import { LayoutEditor as LayoutEditorComponent } from "./LayoutEditor";
import { RunEditor as RunEditorComponent } from "./RunEditor";
import { SettingsEditor as SettingsEditorComponent } from "./SettingsEditor";
import { About } from "./About";
import AutoRefresh from "../util/AutoRefresh";
import { toast } from "react-toastify";
import * as Storage from "../storage";

import "react-toastify/dist/ReactToastify.css";
import "../css/LiveSplit.scss";
import { SplitsSelection, EditingInfo } from "./SplitsSelection";

import LiveSplitIcon from "../assets/icon_small.png";

export enum MenuKind {
    Timer,
    Splits,
    RunEditor,
    Layout,
    LayoutEditor,
    SettingsEditor,
    About,
}

type Menu =
    { kind: MenuKind.Timer } |
    { kind: MenuKind.Splits } |
    { kind: MenuKind.RunEditor, editor: RunEditor, splitsKey?: number } |
    { kind: MenuKind.Layout } |
    { kind: MenuKind.LayoutEditor, editor: LayoutEditor } |
    { kind: MenuKind.SettingsEditor, config: HotkeyConfig } |
    { kind: MenuKind.About };

export interface Props {
    splits?: Uint8Array,
    layout?: Storage.LayoutSettings,
    hotkeys?: Storage.HotkeyConfigSettings,
    layoutWidth: number,
    splitsKey?: number,
}

export interface State {
    hotkeySystem: HotkeySystem,
    isBrowserSource: boolean,
    isDesktop: boolean,
    timer: SharedTimer,
    layout: Layout,
    layoutWidth: number,
    sidebarOpen: boolean,
    sidebarTransitionsEnabled: boolean,
    menu: Menu,
    comparison: Option<string>,
    timingMethod: Option<TimingMethod>,
    openedSplitsKey?: number,
}

export class LiveSplit extends React.Component<Props, State> {
    public static async loadStoredData() {
        const splitsKey = await Storage.loadSplitsKey();
        const splits = splitsKey !== undefined ? await Storage.loadSplits(splitsKey) : undefined;
        const layout = await Storage.loadLayout();
        const hotkeys = await Storage.loadHotkeys();
        const layoutWidth = await Storage.loadLayoutWidth();

        return {
            splits,
            splitsKey,
            layout,
            hotkeys,
            layoutWidth,
        };
    }

    private isDesktopQuery = window.matchMedia("(min-width: 600px)");
    private containerRef: React.RefObject<HTMLDivElement>;
    private scrollEvent: Option<EventListenerObject>;
    private rightClickEvent: Option<EventListenerObject>;
    private resizeEvent: Option<EventListenerObject>;
    private connection: Option<WebSocket>;

    constructor(props: Props) {
        super(props);

        const run = this.getDefaultRun();
        const timer = expect(
            Timer.new(run),
            "The Default Run should be a valid Run",
        ).intoShared();

        let hotkeySystem: Option<HotkeySystem> = null;
        const hotkeys = props.hotkeys;
        try {
            if (hotkeys !== undefined) {
                const config = HotkeyConfig.parseJson(hotkeys);
                if (config !== null) {
                    hotkeySystem = HotkeySystem.withConfig(timer.share(), config);
                }
            }
        } catch (_) { /* Looks like the storage has no valid data */ }
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
        } else if (props.splits !== undefined) {
            const result = Run.parseArray(props.splits, "", false);
            if (result.parsedSuccessfully()) {
                result.unwrap().with((r) => timer.writeWith((t) => t.setRun(r)))?.dispose();
            }
        }

        let layout: Option<Layout> = null;
        try {
            const data = props.layout;
            if (data !== undefined) {
                layout = Layout.parseJson(data);
            }
        } catch (_) { /* Looks like the storage has no valid data */ }
        if (layout === null) {
            layout = Layout.defaultLayout();
        }

        const isDesktop = this.isDesktopQuery.matches;
        const isBrowserSource = !!(window as any).obsstudio;

        this.state = {
            isDesktop: isDesktop && !isBrowserSource,
            isBrowserSource,
            layout,
            layoutWidth: props.layoutWidth,
            menu: { kind: MenuKind.Timer },
            sidebarOpen: false,
            sidebarTransitionsEnabled: false,
            timer,
            hotkeySystem,
            comparison: null,
            timingMethod: null,
            openedSplitsKey: props.splitsKey,
        };

        this.mediaQueryChanged = this.mediaQueryChanged.bind(this);

        this.containerRef = React.createRef();
    }

    public componentDidMount() {
        this.scrollEvent = { handleEvent: (e: MouseWheelEvent) => this.onScroll(e) };
        window.addEventListener("wheel", this.scrollEvent);
        this.rightClickEvent = { handleEvent: (e: any) => this.onRightClick(e) };
        window.addEventListener("contextmenu", this.rightClickEvent, false);
        this.resizeEvent = { handleEvent: () => this.handleAutomaticResize() };
        window.addEventListener("resize", this.resizeEvent, false);

        window.onbeforeunload = (e: BeforeUnloadEvent) => {
            const hasBeenModified = this.readWith((t) => t.getRun().hasBeenModified());
            if (hasBeenModified) {
                e.returnValue = "There are unsaved changes. Do you really want to close LiveSplit One?";
                return e.returnValue;
            }
            return null;
        };

        this.isDesktopQuery.addListener(this.mediaQueryChanged);

        if (this.state.isBrowserSource) {
            document.body.className = "browser-source";
        }

        this.handleAutomaticResize();
    }

    public componentDidUpdate() {
        this.handleAutomaticResize();
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
        window.removeEventListener(
            "resize",
            expect(this.resizeEvent, "A Resize Event should exist"),
        );
        this.state.timer.dispose();
        this.state.layout.dispose();
        this.state.hotkeySystem?.dispose();
        this.isDesktopQuery.removeListener(this.mediaQueryChanged);
    }

    public render() {
        if (this.state.menu.kind === MenuKind.RunEditor) {
            return <RunEditorComponent
                editor={this.state.menu.editor}
                callbacks={this}
            />;
        } else if (this.state.menu.kind === MenuKind.LayoutEditor) {
            return <LayoutEditorComponent
                editor={this.state.menu.editor}
                layoutWidth={this.state.layoutWidth}
                timer={this.state.timer}
                callbacks={this}
            />;
        } else if (this.state.menu.kind === MenuKind.SettingsEditor) {
            return <SettingsEditorComponent
                hotkeyConfig={this.state.menu.config}
                callbacks={this}
            />;
        } else if (this.state.menu.kind === MenuKind.About) {
            return <About callbacks={this} />;
        } else if (this.state.menu.kind === MenuKind.Splits) {
            return <SplitsSelection
                timer={this.state.timer}
                openedSplitsKey={this.state.openedSplitsKey}
                callbacks={this}
            />;
        } else {
            const renderedView = this.renderTimerView();
            const sidebarContent = this.renderTimerViewSidebarContent();
            return this.renderViewWithSidebar(renderedView, sidebarContent);
        }
    }

    public renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element) {
        return (
            <div className={this.state.isDesktop ? "" : "is-mobile"}>
                <Sidebar
                    sidebar={sidebarContent}
                    docked={this.state.isDesktop}
                    open={this.state.sidebarOpen}
                    transitions={this.state.sidebarTransitionsEnabled}
                    onSetOpen={((e: boolean) => this.onSetSidebarOpen(e)) as any}
                    sidebarClassName="sidebar"
                    contentClassName="livesplit-container"
                    overlayClassName="sidebar-overlay"
                >
                    {
                        !this.state.isDesktop &&
                        !this.state.sidebarOpen &&
                        <button
                            aria-label="Open Sidebar"
                            className="sidebar-button fa fa-bars"
                            onClick={(() => this.onSetSidebarOpen(true)) as any}
                        />
                    }
                    <div
                        className="view-container"
                        ref={this.containerRef}
                    >
                        {renderedView}
                    </div>
                </Sidebar>
            </div>
        );
    }

    public openTimerView(remount: boolean, layout: Layout = this.state.layout) {
        this.setState({
            layout,
            menu: { kind: MenuKind.Timer },
            sidebarOpen: false,
        });
        if (remount) {
            layout.remount();
            this.state.hotkeySystem.activate();
        }
    }

    public openSplitsView() {
        this.setState({
            menu: { kind: MenuKind.Splits },
            sidebarOpen: false,
        });
        this.state.hotkeySystem.deactivate();
    }

    public openLayoutView() {
        this.setState({
            menu: { kind: MenuKind.Layout },
        });
    }

    public openAboutView() {
        this.setState({
            menu: { kind: MenuKind.About },
            sidebarOpen: false,
        });
        this.state.hotkeySystem.deactivate();
    }

    public async importSplits() {
        const splits = await openFileAsArrayBuffer();
        try {
            this.importSplitsFromArrayBuffer(splits);
        } catch (err) {
            toast.error(err.message);
        }
    }

    public async importSplitsFromFile(file: File) {
        const splits = await convertFileToArrayBuffer(file);
        this.importSplitsFromArrayBuffer(splits);
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
        let id = prompt("Specify the Splits.io URL or ID:");
        if (!id) {
            return;
        }
        if (id.indexOf("https://splits.io/") === 0) {
            id = id.substr("https://splits.io/".length);
        }
        this.loadFromSplitsIO(id);
    }

    public async uploadToSplitsIO(): Promise<Option<Window>> {
        const lss = this.readWith((t) => t.saveAsLssBytes());

        try {
            const claimUri = await SplitsIO.uploadLss(new Blob([lss]));
            return window.open(claimUri);
        } catch (_) {
            toast.error("Failed to upload the splits.");
            return null;
        }
    }

    public exportSplits() {
        const [lss, name] = this.writeWith((t) => {
            t.markAsUnmodified();
            const name = t.getRun().extendedFileName(true);
            const lss = t.saveAsLssBytes();
            return [lss, name];
        });
        try {
            exportFile(name + ".lss", lss);
        } catch (_) {
            toast.error("Failed to export the splits.");
        }
    }

    public async saveSplits() {
        try {
            const openedSplitsKey = await Storage.storeSplits(
                (callback) => {
                    this.writeWith((timer) => {
                        callback(timer.getRun(), timer.saveAsLssBytes());
                        timer.markAsUnmodified();
                    });
                },
                this.state.openedSplitsKey,
            );
            if (this.state.openedSplitsKey === undefined) {
                this.setState({
                    openedSplitsKey,
                });
                await Storage.storeSplitsKey(openedSplitsKey);
            }
        } catch (_) {
            toast.error("Failed to save the splits.");
        }
    }

    public async saveLayout() {
        try {
            const layout = this.state.layout.settingsAsJson();
            await Storage.storeLayout(layout);
        } catch (_) {
            toast.error("Failed to save the layout.");
        }
    }

    public async importLayout() {
        const [file] = await openFileAsString();
        try {
            this.importLayoutFromString(file);
        } catch (err) {
            toast.error(err.message);
        }
    }

    public async importLayoutFromFile(file: File) {
        const [fileString] = await convertFileToString(file);
        this.importLayoutFromString(fileString);
    }

    public exportLayout() {
        const layout = this.state.layout.settingsAsJson();
        exportFile("layout.ls1l", JSON.stringify(layout, null, 4));
    }

    public loadDefaultSplits() {
        const run = this.getDefaultRun();
        this.setRun(run, () => { throw Error("Could not set default run."); });
    }

    public loadDefaultLayout() {
        const layout = Layout.defaultLayout();
        this.setLayout(layout);
    }

    public openRunEditor({ splitsKey, run }: EditingInfo) {
        const editor = expect(
            RunEditor.new(run),
            "The Run Editor should always be able to be opened.",
        );
        this.setState({
            menu: { kind: MenuKind.RunEditor, editor, splitsKey },
            sidebarOpen: false,
        });
    }

    public closeRunEditor(save: boolean) {
        if (this.state.menu.kind !== MenuKind.RunEditor) {
            panic("No Run Editor to close");
        }
        const { editor, splitsKey } = this.state.menu;
        const run = editor.close();
        if (save) {
            if (splitsKey == null) {
                assertNull(
                    this.writeWith((t) => t.setRun(run)),
                    "The Run Editor should always return a valid Run.",
                );
            } else {
                Storage.storeRunAndDispose(run, splitsKey);
            }
        } else {
            run.dispose();
        }
        this.openSplitsView();
    }

    public setSplitsKey(openedSplitsKey?: number) {
        this.setState({
            openedSplitsKey,
        });
        if (openedSplitsKey !== undefined) {
            Storage.storeSplitsKey(openedSplitsKey);
        }
    }

    public openLayoutEditor() {
        this.state.hotkeySystem.deactivate();

        const layout = this.state.layout.clone();
        const editor = expect(
            LayoutEditor.new(layout),
            "The Layout Editor should always be able to be opened.",
        );
        this.setState({
            menu: { kind: MenuKind.LayoutEditor, editor },
            sidebarOpen: false,
        });
    }

    public closeLayoutEditor(save: boolean) {
        if (this.state.menu.kind !== MenuKind.LayoutEditor) {
            panic("No Layout Editor to close.");
        }
        const layoutEditor = this.state.menu.editor;
        const layout = layoutEditor.close();
        if (save) {
            this.state.layout.dispose();
            this.openTimerView(true, layout);
        } else {
            layout.dispose();
            this.openTimerView(true);
        }
    }

    public openSettingsEditor() {
        this.state.hotkeySystem.deactivate();
        this.setState({
            menu: {
                kind: MenuKind.SettingsEditor,
                config: this.state.hotkeySystem.config(),
            },
            sidebarOpen: false,
        });
    }

    public async closeSettingsEditor(save: boolean) {
        const menu = this.state.menu;

        if (menu.kind !== MenuKind.SettingsEditor) {
            panic("No Settings Editor to close.");
        }

        if (save) {
            try {
                const hotkeys = menu.config.asJson();
                await Storage.storeHotkeys(hotkeys);
            } catch (_) {
                toast.error("Failed to save the settings.");
            }
            this.state.hotkeySystem.setConfig(menu.config);
        } else {
            menu.config.dispose();
        }

        this.openTimerView(true);
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

    private renderTimerView() {
        return <DragUpload
            importLayout={this.importLayoutFromFile.bind(this)}
            importSplits={this.importSplitsFromFile.bind(this)}
        >
            <div>
                <div
                    onClick={(_) => this.splitOrStart()}
                    style={{
                        display: "inline-block",
                        cursor: "pointer",
                    }}
                >
                    <AutoRefreshLayout
                        getState={() => this.readWith(
                            (t) => this.state.layout.stateAsJson(t),
                        )}
                        allowResize={this.state.isDesktop}
                        width={this.state.layoutWidth}
                        onResize={(width) => this.onResize(width)}
                    />
                </div>
                <div className="buttons" style={{ width: this.state.layoutWidth }}>
                    <div className="small">
                        <button aria-label="Undo Split" onClick={(_) => this.undoSplit()}>
                            <i className="fa fa-arrow-up" aria-hidden="true" /></button>
                        <button aria-label="Pause" onClick={(_) => this.togglePauseOrStart()}>
                            <i className="fa fa-pause" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="small">
                        <button aria-label="Skip Split" onClick={(_) => this.skipSplit()}>
                            <i className="fa fa-arrow-down" aria-hidden="true" />
                        </button>
                        <button aria-label="Reset" onClick={(_) => this.reset()}>
                            <i className="fa fa-times" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </DragUpload>;
    }

    private renderTimerViewSidebarContent() {
        switch (this.state.menu.kind) {
            case MenuKind.Layout: {
                return (
                    <div className="sidebar-buttons">
                        <h1>Layout</h1>
                        <hr />
                        <button onClick={(_) => this.openLayoutEditor()}>
                            <i className="fa fa-edit" aria-hidden="true" /> Edit
                        </button>
                        <button onClick={(_) => this.saveLayout()}>
                            <i className="fa fa-save" aria-hidden="true" /> Save
                        </button>
                        <button onClick={(_) => this.importLayout()}>
                            <i className="fa fa-download" aria-hidden="true" /> Import
                        </button>
                        <button onClick={(_) => this.exportLayout()}>
                            <i className="fa fa-upload" aria-hidden="true" /> Export
                        </button>
                        <button onClick={(_) => this.loadDefaultLayout()}>
                            <i className="fa fa-sync" aria-hidden="true" /> Default
                        </button>
                        <hr />
                        <button onClick={(_) => this.openTimerView(false)}>
                            <i className="fa fa-caret-left" aria-hidden="true" /> Back
                        </button>
                    </div>
                );
            }
            case MenuKind.Timer: {
                return (
                    <AutoRefresh update={() => this.updateSidebar()}>
                        <div className="sidebar-buttons">
                            <div className="livesplit-title">
                                <span className="livesplit-icon">
                                    <img src={LiveSplitIcon} alt="LiveSplit Logo" />
                                </span>
                                <h1> LiveSplit One</h1>
                            </div>
                            <hr className="livesplit-title-separator" />
                            <button onClick={(_) => this.openSplitsView()}>
                                <i className="fa fa-list" aria-hidden="true" /> Splits
                            </button>
                            <button onClick={(_) => this.openLayoutView()}>
                                <i className="fa fa-layer-group" aria-hidden="true" /> Layout
                            </button>
                            <hr />
                            <h2>Compare Against</h2>
                            <div className="choose-comparison">
                                <button
                                    aria-label="Switch to Previous Comparison"
                                    onClick={(_) => this.switchToPreviousComparison()}
                                >
                                    <i className="fa fa-caret-left" aria-hidden="true" />
                                </button>
                                <span>{this.state.comparison}</span>
                                <button
                                    aria-label="Switch to Next Comparison"
                                    onClick={(_) => this.switchToNextComparison()}
                                >
                                    <i className="fa fa-caret-right" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="small">
                                <button
                                    onClick={(_) => {
                                        this.setCurrentTimingMethod(TimingMethod.RealTime);
                                        this.updateSidebar();
                                    }}
                                    className={
                                        (this.state.timingMethod === TimingMethod.RealTime ? "button-pressed" : "") +
                                        " toggle-left"
                                    }
                                >
                                    Real Time
                                </button>
                                <button
                                    onClick={(_) => {
                                        this.setCurrentTimingMethod(TimingMethod.GameTime);
                                        this.updateSidebar();
                                    }}
                                    className={
                                        (this.state.timingMethod === TimingMethod.GameTime ? "button-pressed" : "") +
                                        " toggle-right"
                                    }
                                >
                                    Game Time
                                </button>
                            </div>
                            <hr />
                            <button onClick={(_) => this.connectToServerOrDisconnect()}>
                                {
                                    (() => {
                                        const connectionState = this.connection?.readyState ?? WebSocket.CLOSED;
                                        switch (connectionState) {
                                            case WebSocket.OPEN:
                                                return <div>
                                                    <i className="fa fa-power-off" aria-hidden="true" /> Disconnect
                                                </div>;
                                            case WebSocket.CLOSED:
                                                return <div>
                                                    <i className="fa fa-desktop" aria-hidden="true" /> Connect to Server
                                                </div>;
                                            case WebSocket.CONNECTING:
                                                return <div>Connecting...</div>;
                                            case WebSocket.CLOSING:
                                                return <div>Disconnecting...</div>;
                                            default: throw new Error("Unknown WebSocket State");
                                        }
                                    })()
                                }
                            </button>
                            <button onClick={() => this.openSettingsEditor()}>
                                <i className="fa fa-cog" aria-hidden="true" /> Settings
                            </button>
                            <hr />
                            <button onClick={(_) => this.openAboutView()}>
                                <i className="fa fa-info-circle" aria-hidden="true" /> About
                            </button>
                        </div >
                    </AutoRefresh>
                );
            }
        }
        throw Error(`Invalid menu: ${this.state.menu}`);
    }

    private updateSidebar() {
        if (this.state.menu.kind === MenuKind.Timer && (this.state.sidebarOpen || this.state.isDesktop)) {
            const [comparison, timingMethod] = this.state.timer.readWith((t): [string, number] => {
                return [
                    t.currentComparison(),
                    t.currentTimingMethod(),
                ];
            });

            if (comparison !== this.state.comparison || timingMethod !== this.state.timingMethod) {
                this.setState({
                    ...this.state,
                    comparison,
                    timingMethod,
                });
            }
        }
    }

    private getDefaultRun() {
        const run = Run.new();
        run.pushSegment(Segment.new("Time"));
        return run;
    }

    private handleAutomaticResize() {
        if (!this.state.isDesktop) {
            const fullWidth = this.containerRef.current?.clientWidth;
            if (fullWidth && fullWidth !== this.state.layoutWidth) {
                this.setState({
                    layoutWidth: fullWidth,
                });
            }
        }
    }

    private async onResize(width: number) {
        this.setState({
            layoutWidth: width,
        });
        await Storage.storeLayoutWidth(width);
    }

    private mediaQueryChanged() {
        const isDesktop = this.isDesktopQuery.matches && !this.state.isBrowserSource;
        if (isDesktop) {
            this.setState({
                isDesktop,
                layoutWidth: this.props.layoutWidth,
                sidebarTransitionsEnabled: false,
            });
        } else {
            this.setState({
                isDesktop,
                sidebarTransitionsEnabled: false,
            });
        }
    }

    private importLayoutFromString(file: string) {
        let layout = null;
        try {
            layout = Layout.parseJson(JSON.parse(file));
        } catch (_) { /* Failed to load the layout */ }
        if (layout === null) {
            layout = Layout.parseOriginalLivesplitString(file);
        }
        if (layout !== null) {
            this.setLayout(layout);
            return;
        }
        throw Error("The layout could not be loaded. This may not be a valid LiveSplit or LiveSplit One Layout.");
    }

    private setLayout(layout: Layout) {
        this.state.layout.dispose();
        this.setState({
            layout,
        });
        layout.remount();
    }

    private setRun(run: Run, callback: () => void) {
        maybeDisposeAndThen(
            this.writeWith((t) => t.setRun(run)),
            callback,
        );
        this.setSplitsKey(undefined);
    }

    private importSplitsFromArrayBuffer(buffer: [ArrayBuffer, File]) {
        const [file] = buffer;
        const result = Run.parseArray(new Uint8Array(file), "", false);
        if (result.parsedSuccessfully()) {
            const run = result.unwrap();
            this.setRun(run, () => { throw Error("Empty Splits are not supported."); });
        } else {
            throw Error("Couldn't parse the splits.");
        }
    }

    private async loadFromSplitsIO(id: string) {
        try {
            const run = await SplitsIO.downloadById(id);
            this.setRun(run, () => toast.error("The downloaded splits are not valid."));
        } catch (_) {
            toast.error("Failed to download the splits.");
        }
    }

    private onScroll(e: WheelEvent) {
        const delta = Math.sign(-e.deltaY);
        if (delta === 1) {
            this.state.layout.scrollUp();
        } else if (delta === -1) {
            this.state.layout.scrollDown();
        }
    }

    private onSetSidebarOpen(open: boolean) {
        if (!this.state.isDesktop) {
            this.setState({
                sidebarOpen: open,
                sidebarTransitionsEnabled: true,
            });
        }
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
        if (time !== null) {
            time.with((time) => {
                this.writeWith((t) => t.setGameTime(time));
            });
        }
    }

    private setLoadingTimes(loadingTimes: string) {
        const time = TimeSpan.parse(loadingTimes);
        if (time !== null) {
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
