import * as React from "react";
import Sidebar from "react-sidebar";
import {
    HotkeySystem, Layout, LayoutEditor, Run, RunEditor,
    Segment, SharedTimer, Timer, TimerRef, TimerRefMut,
    HotkeyConfig, LayoutState,
} from "../livesplit-core";
import { convertFileToArrayBuffer, convertFileToString, exportFile, openFileAsString } from "../util/FileUtil";
import { Option, assertNull, expect, maybeDisposeAndThen, panic } from "../util/OptionUtil";
import * as SplitsIO from "../util/SplitsIO";
import { LayoutEditor as LayoutEditorComponent } from "./LayoutEditor";
import { RunEditor as RunEditorComponent } from "./RunEditor";
import { SettingsEditor as SettingsEditorComponent } from "./SettingsEditor";
import { TimerView } from "./TimerView";
import { About } from "./About";
import { SplitsSelection, EditingInfo } from "./SplitsSelection";
import { LayoutView } from "./LayoutView";
import { toast } from "react-toastify";
import * as Storage from "../storage";

import "react-toastify/dist/ReactToastify.css";
import "../css/LiveSplit.scss";

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
    layout: Layout,
    layoutState: LayoutState,
    layoutWidth: number,
    menu: Menu,
    openedSplitsKey?: number,
    sidebarOpen: boolean,
    sidebarTransitionsEnabled: boolean,
    storedLayoutWidth: number,
    timer: SharedTimer,
}

export let hotkeySystem: Option<HotkeySystem> = null;

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

    constructor(props: Props) {
        super(props);

        const run = this.getDefaultRun();
        const timer = expect(
            Timer.new(run),
            "The Default Run should be a valid Run",
        ).intoShared();

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
            Run.parseArray(props.splits, "", false).with((result) => {
                if (result.parsedSuccessfully()) {
                    result.unwrap().with((r) => timer.writeWith((t) => t.setRun(r)))?.dispose();
                }
            });
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
            layoutState: LayoutState.new(),
            layoutWidth: props.layoutWidth,
            menu: { kind: MenuKind.Timer },
            sidebarOpen: false,
            sidebarTransitionsEnabled: false,
            storedLayoutWidth: props.layoutWidth,
            timer,
            hotkeySystem,
            openedSplitsKey: props.splitsKey,
        };

        this.mediaQueryChanged = this.mediaQueryChanged.bind(this);

        this.containerRef = React.createRef();
    }

    public componentDidMount() {
        this.scrollEvent = { handleEvent: (e: WheelEvent) => this.onScroll(e) };
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

        this.isDesktopQuery.addEventListener("change", this.mediaQueryChanged);

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
        this.state.layoutState.dispose();
        this.state.hotkeySystem?.dispose();
        this.isDesktopQuery.removeEventListener("change", this.mediaQueryChanged);
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
        } else if (this.state.menu.kind === MenuKind.Timer) {
            return <TimerView
                layout={this.state.layout}
                layoutState={this.state.layoutState}
                layoutWidth={this.state.layoutWidth}
                isDesktop={this.state.isDesktop}
                renderWithSidebar={true}
                sidebarOpen={this.state.sidebarOpen}
                timer={this.state.timer}
                callbacks={this}
            />;
        } else if (this.state.menu.kind === MenuKind.Layout) {
            return <LayoutView
                layout={this.state.layout}
                layoutState={this.state.layoutState}
                layoutWidth={this.state.layoutWidth}
                isDesktop={this.state.isDesktop}
                renderWithSidebar={true}
                sidebarOpen={this.state.sidebarOpen}
                timer={this.state.timer}
                callbacks={this}
            />;
        }
        throw Error(`Invalid menu: ${this.state.menu}`);
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

    public openTimerView(layout: Layout = this.state.layout) {
        this.setState({
            layout,
            menu: { kind: MenuKind.Timer },
            sidebarOpen: false,
        });
        layout.remount();
        this.state.hotkeySystem.activate();
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
        this.state.layout.remount();
    }

    public openAboutView() {
        this.setState({
            menu: { kind: MenuKind.About },
            sidebarOpen: false,
        });
        this.state.hotkeySystem.deactivate();
    }

    public async importSplitsFromFile(file: File) {
        const splits = await convertFileToArrayBuffer(file);
        this.importSplitsFromArrayBuffer(splits);
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
            toast.error((err as Error).message);
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
            this.openTimerView(layout);
        } else {
            layout.dispose();
            this.openTimerView();
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

        this.openTimerView();
    }

    public async onResize(width: number) {
        this.setState({
            layoutWidth: width,
            storedLayoutWidth: width,
        });
        await Storage.storeLayoutWidth(width);
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

    private mediaQueryChanged() {
        const isDesktop = this.isDesktopQuery.matches && !this.state.isBrowserSource;
        this.setState({
            isDesktop,
            layoutWidth: isDesktop ? this.state.storedLayoutWidth : this.state.layoutWidth,
            sidebarTransitionsEnabled: false,
        });
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
        Run.parseArray(new Uint8Array(file), "", false).with((result) => {
            if (result.parsedSuccessfully()) {
                const run = result.unwrap();
                this.setRun(run, () => { throw Error("Empty Splits are not supported."); });
            } else {
                throw Error("Couldn't parse the splits.");
            }
        });
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
}
