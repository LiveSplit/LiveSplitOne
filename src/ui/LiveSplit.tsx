import * as React from "react";
import Sidebar from "react-sidebar";
import {
    HotkeySystem, Layout, LayoutEditor, Run, RunEditor, Segment,
    Timer, HotkeyConfig, LayoutState, LayoutStateJson,
    TimingMethod, TimerPhase,
} from "../livesplit-core";
import { convertFileToArrayBuffer, convertFileToString, exportFile, openFileAsString } from "../util/FileUtil";
import { Option, assertNull, expect, maybeDisposeAndThen, panic } from "../util/OptionUtil";
import * as SplitsIO from "../util/SplitsIO";
import { LayoutEditor as LayoutEditorComponent } from "./LayoutEditor";
import { RunEditor as RunEditorComponent } from "./RunEditor";
import { GeneralSettings, SettingsEditor as SettingsEditorComponent } from "./SettingsEditor";
import { TimerView } from "./TimerView";
import { About } from "./About";
import { SplitsSelection, EditingInfo } from "./SplitsSelection";
import { LayoutView } from "./LayoutView";
import { toast } from "react-toastify";
import * as Storage from "../storage";
import { UrlCache } from "../util/UrlCache";
import { WebRenderer } from "../livesplit-core/livesplit_core";
import variables from "../css/variables.scss";
import { LiveSplitServer } from "../api/LiveSplitServer";
import { LSOEventSink } from "./LSOEventSink";

import "react-toastify/dist/ReactToastify.css";
import "../css/LiveSplit.scss";

const buttonHeight = parseFloat(variables.buttonHeight);
const largeMargin = parseFloat(variables.largeMargin);
const manualGameTimeHeight = parseFloat(variables.manualGameTimeHeight);

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
    comparison?: string,
    timingMethod: TimingMethod,
    hotkeys?: Storage.HotkeyConfigSettings,
    layoutWidth: number,
    layoutHeight: number,
    generalSettings: GeneralSettings,
    splitsKey?: number,
}

export interface State {
    hotkeySystem: HotkeySystem,
    isBrowserSource: boolean,
    isDesktop: boolean,
    layout: Layout,
    layoutState: LayoutState,
    layoutUrlCache: UrlCache,
    runEditorUrlCache: UrlCache,
    layoutEditorUrlCache: UrlCache,
    layoutWidth: number,
    layoutHeight: number,
    menu: Menu,
    openedSplitsKey?: number,
    sidebarOpen: boolean,
    sidebarTransitionsEnabled: boolean,
    storedLayoutWidth: number,
    storedLayoutHeight: number,
    eventSink: LSOEventSink,
    renderer: WebRenderer,
    generalSettings: GeneralSettings,
    serverConnection: Option<LiveSplitServer>,
    currentComparison: string,
    currentTimingMethod: TimingMethod,
    currentPhase: TimerPhase,
    currentSplitIndex: number,
    allComparisons: string[],
    splitsModified: boolean,
    layoutModified: boolean,
}

export let hotkeySystem: Option<HotkeySystem> = null;

export class LiveSplit extends React.Component<Props, State> {
    public static async loadStoredData() {
        // FIXME: We should probably request all of these concurrently.
        const splitsKey = await Storage.loadSplitsKey();
        const splits = splitsKey !== undefined ? await Storage.loadSplits(splitsKey) : undefined;
        const layout = await Storage.loadLayout();
        const comparison = await Storage.loadComparison();
        const timingMethod = await Storage.loadTimingMethod();
        const hotkeys = await Storage.loadHotkeys();
        const [layoutWidth, layoutHeight] = await Storage.loadLayoutDims();
        const generalSettings = await Storage.loadGeneralSettings();

        return {
            splits,
            splitsKey,
            layout,
            comparison,
            timingMethod,
            hotkeys,
            layoutWidth,
            layoutHeight,
            generalSettings,
        };
    }

    private isDesktopQuery = window.matchMedia("(min-width: 600px)");
    private scrollEvent: Option<EventListenerObject>;
    private rightClickEvent: Option<EventListenerObject>;
    private resizeEvent: Option<EventListenerObject>;

    constructor(props: Props) {
        super(props);

        const run = this.getDefaultRun();
        const timer = expect(
            Timer.new(run),
            "The Default Run should be a valid Run",
        );

        const eventSink = new LSOEventSink(
            timer,
            () => this.currentComparisonChanged(),
            () => this.currentTimingMethodChanged(),
            () => this.currentPhaseChanged(),
            () => this.currentSplitChanged(),
            () => this.comparisonsListChanged(),
            () => this.splitsModifiedChanged(),
            () => this.onReset(),
        );

        const hotkeys = props.hotkeys;
        try {
            if (hotkeys !== undefined) {
                const config = HotkeyConfig.parseJson(hotkeys);
                if (config !== null) {
                    hotkeySystem = HotkeySystem.withConfig(eventSink.getEventSink(), config);
                }
            }
        } catch (_) { /* Looks like the storage has no valid data */ }
        if (hotkeySystem == null) {
            hotkeySystem = expect(
                HotkeySystem.new(eventSink.getEventSink()),
                "Couldn't initialize the hotkeys",
            );
        }

        if (window.location.hash.indexOf("#/splits-io/") === 0) {
            const loadingRun = Run.new();
            loadingRun.setGameName("Loading...");
            loadingRun.setCategoryName("Loading...");
            loadingRun.pushSegment(Segment.new("Time"));
            assertNull(
                eventSink.setRun(loadingRun),
                "The Default Loading Run should be a valid Run",
            );
            this.loadFromSplitsIO(window.location.hash.substring("#/splits-io/".length));
        } else if (props.splits !== undefined) {
            using result = Run.parseArray(props.splits, "");
            if (result.parsedSuccessfully()) {
                using r = result.unwrap();
                eventSink.setRun(r)?.[Symbol.dispose]();
            }
        }

        if (props.comparison !== undefined) {
            timer.setCurrentComparison(props.comparison);
        }
        timer.setCurrentTimingMethod(props.timingMethod);

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

        const renderer = new WebRenderer();
        renderer.element().setAttribute("style", "width: inherit; height: inherit;");

        this.state = {
            isDesktop: isDesktop && !isBrowserSource,
            isBrowserSource,
            layout,
            layoutState: LayoutState.new(),
            layoutUrlCache: new UrlCache(),
            runEditorUrlCache: new UrlCache(),
            layoutEditorUrlCache: new UrlCache(),
            layoutWidth: props.layoutWidth,
            layoutHeight: props.layoutHeight,
            menu: { kind: MenuKind.Timer },
            sidebarOpen: false,
            sidebarTransitionsEnabled: false,
            storedLayoutWidth: props.layoutWidth,
            storedLayoutHeight: props.layoutHeight,
            eventSink,
            hotkeySystem,
            openedSplitsKey: props.splitsKey,
            renderer,
            generalSettings: props.generalSettings,
            serverConnection: null,
            currentComparison: eventSink.currentComparison(),
            currentTimingMethod: eventSink.currentTimingMethod(),
            currentPhase: eventSink.currentPhase(),
            currentSplitIndex: eventSink.currentSplitIndex(),
            allComparisons: eventSink.getAllComparisons(),
            splitsModified: eventSink.hasBeenModified(),
            layoutModified: false,
        };

        this.mediaQueryChanged = this.mediaQueryChanged.bind(this);
    }

    private notifyAboutUpdate(this: void) {
        const { serviceWorker } = navigator;
        if (serviceWorker && serviceWorker.controller) {
            // Don't prompt for update when service worker gets removed
            toast.warn(
                'A new version of LiveSplit One is available! Click here to reload.',
                {
                    closeOnClick: true,
                    onClick: () => window.location.reload(),
                },
            );
        }
    }

    public componentDidMount() {
        this.scrollEvent = { handleEvent: (e: WheelEvent) => this.onScroll(e) };
        window.addEventListener("wheel", this.scrollEvent);
        this.rightClickEvent = { handleEvent: (e: any) => this.onRightClick(e) };
        window.addEventListener("contextmenu", this.rightClickEvent, false);
        this.resizeEvent = { handleEvent: () => this.handleAutomaticResize() };
        window.addEventListener("resize", this.resizeEvent, false);

        window.onbeforeunload = () => {
            if (this.state.splitsModified || this.state.layoutModified) {
                return "There are unsaved changes. Do you really want to close LiveSplit One?";
            } else {
                return;
            }
        };

        // This is bound in the constructor
        // eslint-disable-next-line @typescript-eslint/unbound-method
        this.isDesktopQuery.addEventListener("change", this.mediaQueryChanged);

        if (this.state.isBrowserSource) {
            document.body.className = "browser-source";
        }

        this.handleAutomaticResize();

        const { serviceWorker } = navigator;
        if (serviceWorker && serviceWorker.controller) {
            // Don't prompt for update when there was no service worker previously installed
            serviceWorker.addEventListener('controllerchange', this.notifyAboutUpdate);
        }
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
        this.state.eventSink[Symbol.dispose]();
        this.state.layout[Symbol.dispose]();
        this.state.layoutState[Symbol.dispose]();
        this.state.hotkeySystem?.[Symbol.dispose]();

        // This is bound in the constructor
        // eslint-disable-next-line @typescript-eslint/unbound-method
        this.isDesktopQuery.removeEventListener("change", this.mediaQueryChanged);

        const { serviceWorker } = navigator;
        if (serviceWorker) {
            serviceWorker.removeEventListener('controllerchange', this.notifyAboutUpdate);
        }
    }

    public render() {
        if (this.state.menu.kind === MenuKind.RunEditor) {
            return <RunEditorComponent
                editor={this.state.menu.editor}
                callbacks={this}
                runEditorUrlCache={this.state.runEditorUrlCache}
                allComparisons={this.state.allComparisons}
                generalSettings={this.state.generalSettings}
            />;
        } else if (this.state.menu.kind === MenuKind.LayoutEditor) {
            return <LayoutEditorComponent
                editor={this.state.menu.editor}
                layoutState={this.state.layoutState}
                layoutEditorUrlCache={this.state.layoutEditorUrlCache}
                layoutUrlCache={this.state.layoutUrlCache}
                layoutWidth={this.state.layoutWidth}
                layoutHeight={this.state.layoutHeight}
                generalSettings={this.state.generalSettings}
                allComparisons={this.state.allComparisons}
                isDesktop={this.state.isDesktop}
                eventSink={this.state.eventSink}
                renderer={this.state.renderer}
                callbacks={this}
            />;
        } else if (this.state.menu.kind === MenuKind.SettingsEditor) {
            return <SettingsEditorComponent
                generalSettings={this.state.generalSettings}
                hotkeyConfig={this.state.menu.config}
                urlCache={this.state.layoutUrlCache}
                callbacks={this}
                eventSink={this.state.eventSink}
                serverConnection={this.state.serverConnection}
                allComparisons={this.state.allComparisons}
            />;
        } else if (this.state.menu.kind === MenuKind.About) {
            return <About callbacks={this} />;
        } else if (this.state.menu.kind === MenuKind.Splits) {
            return <SplitsSelection
                generalSettings={this.state.generalSettings}
                eventSink={this.state.eventSink}
                openedSplitsKey={this.state.openedSplitsKey}
                callbacks={this}
                splitsModified={this.state.splitsModified}
            />;
        } else if (this.state.menu.kind === MenuKind.Timer) {
            return <TimerView
                layout={this.state.layout}
                layoutState={this.state.layoutState}
                layoutUrlCache={this.state.layoutUrlCache}
                layoutWidth={this.state.layoutWidth}
                layoutHeight={this.state.layoutHeight}
                generalSettings={this.state.generalSettings}
                isDesktop={this.state.isDesktop}
                renderWithSidebar={true}
                sidebarOpen={this.state.sidebarOpen}
                eventSink={this.state.eventSink}
                renderer={this.state.renderer}
                serverConnection={this.state.serverConnection}
                callbacks={this}
                currentComparison={this.state.currentComparison}
                currentTimingMethod={this.state.currentTimingMethod}
                currentPhase={this.state.currentPhase}
                currentSplitIndex={this.state.currentSplitIndex}
                allComparisons={this.state.allComparisons}
                splitsModified={this.state.splitsModified}
                layoutModified={this.state.layoutModified}
            />;
        } else if (this.state.menu.kind === MenuKind.Layout) {
            return <LayoutView
                layout={this.state.layout}
                layoutState={this.state.layoutState}
                layoutUrlCache={this.state.layoutUrlCache}
                layoutWidth={this.state.layoutWidth}
                layoutHeight={this.state.layoutHeight}
                generalSettings={this.state.generalSettings}
                isDesktop={this.state.isDesktop}
                renderWithSidebar={true}
                sidebarOpen={this.state.sidebarOpen}
                eventSink={this.state.eventSink}
                renderer={this.state.renderer}
                serverConnection={this.state.serverConnection}
                callbacks={this}
                currentComparison={this.state.currentComparison}
                currentTimingMethod={this.state.currentTimingMethod}
                currentPhase={this.state.currentPhase}
                currentSplitIndex={this.state.currentSplitIndex}
                allComparisons={this.state.allComparisons}
                splitsModified={this.state.splitsModified}
                layoutModified={this.state.layoutModified}
            />;
        }
        // Only get here if the type is invalid
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
                    <div className="view-container">
                        {renderedView}
                    </div>
                </Sidebar>
            </div>
        );
    }

    public openTimerView() {
        this.setState({
            menu: { kind: MenuKind.Timer },
            sidebarOpen: false,
        });
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
            await Storage.storeLayout(
                layout,
                this.state.storedLayoutWidth,
                this.state.storedLayoutHeight,
            );
            this.setState({ layoutModified: false }, () => this.updateBadge());
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
                    this.state.eventSink.setRun(run),
                    "The Run Editor should always return a valid Run.",
                );
            } else {
                Storage.storeRunAndDispose(run, splitsKey);
            }
        } else {
            run[Symbol.dispose]();
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
            this.setLayout(layout);
        } else {
            layout[Symbol.dispose]();
        }
        this.openTimerView();
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

    public async closeSettingsEditor(save: boolean, generalSettings: GeneralSettings) {
        const menu = this.state.menu;

        if (menu.kind !== MenuKind.SettingsEditor) {
            panic("No Settings Editor to close.");
        }

        if (save) {
            try {
                const hotkeys = menu.config.asJson();
                await Storage.storeHotkeys(hotkeys);
            } catch {
                toast.error("Failed to save the hotkey settings.");
            }

            try {
                await Storage.storeGeneralSettings(generalSettings);
            } catch {
                toast.error("Failed to save the general settings.");
            }

            this.state.hotkeySystem.setConfig(menu.config);
            this.setState({ generalSettings });
        } else {
            menu.config[Symbol.dispose]();
        }

        this.openTimerView();
    }

    public onResize(width: number, height: number) {
        this.setState(
            {
                layoutWidth: width,
                layoutHeight: height,
                storedLayoutWidth: width,
                storedLayoutHeight: height,
                layoutModified: true,
            },
            () => this.updateBadge(),
        );
    }

    private getDefaultRun() {
        const run = Run.new();
        run.pushSegment(Segment.new("Time"));
        return run;
    }

    private handleAutomaticResize() {
        if (!this.state.isDesktop) {
            const layoutDirection = (this.state.layoutState.asJson() as LayoutStateJson).direction;
            if (layoutDirection !== "Vertical") {
                return;
            }

            const fullWidth = window.innerWidth;
            if (fullWidth !== this.state.layoutWidth) {
                this.setState({
                    layoutWidth: fullWidth,
                });
            }

            const showControlButtons = this.state.generalSettings.showControlButtons;
            const showManualGameTime = this.state.generalSettings.showManualGameTime;
            let newHeight = window.innerHeight - largeMargin;
            if (showControlButtons && showManualGameTime) {
                newHeight -= 2 * buttonHeight + manualGameTimeHeight + 3 * largeMargin;
            } else if (showControlButtons) {
                newHeight -= 2 * buttonHeight + 2 * largeMargin;
            } else if (showManualGameTime) {
                newHeight -= manualGameTimeHeight + largeMargin;
            }

            if (newHeight !== this.state.layoutHeight) {
                this.setState({
                    layoutHeight: newHeight,
                });
            }
        }
    }

    private mediaQueryChanged() {
        const isDesktop = this.isDesktopQuery.matches && !this.state.isBrowserSource;
        this.setState({
            isDesktop,
            layoutWidth: isDesktop ? this.state.storedLayoutWidth : this.state.layoutWidth,
            layoutHeight: isDesktop ? this.state.storedLayoutHeight : this.state.layoutHeight,
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
        this.state.layout[Symbol.dispose]();
        this.setState(
            {
                layout,
                layoutModified: true,
            },
            () => this.updateBadge(),
        );
    }

    private setRun(run: Run, callback: () => void) {
        maybeDisposeAndThen(
            this.state.eventSink.setRun(run),
            callback,
        );
        this.setSplitsKey(undefined);
    }

    private importSplitsFromArrayBuffer(buffer: [ArrayBuffer, File]) {
        const [file] = buffer;
        using result = Run.parseArray(new Uint8Array(file), "");
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

    async saveSplits() {
        try {
            const openedSplitsKey = await Storage.storeSplits(
                (callback) => {
                    callback(this.state.eventSink.getRun(), this.state.eventSink.saveAsLssBytes());
                    this.state.eventSink.markAsUnmodified();
                },
                this.state.openedSplitsKey,
            );
            if (this.state.openedSplitsKey !== openedSplitsKey) {
                this.setSplitsKey(openedSplitsKey);
            }
        } catch (_) {
            toast.error("Failed to save the splits.");
        }
    }

    onServerConnectionOpened(serverConnection: LiveSplitServer): void {
        this.setState({ serverConnection });
    }

    onServerConnectionClosed(): void {
        this.setState({ serverConnection: null });
    }

    currentComparisonChanged(): void {
        if (this.state != null) {
            const currentComparison = this.state.eventSink.currentComparison();

            (async () => {
                try {
                    await Storage.storeComparison(currentComparison);
                } catch {
                    // It's fine if this fails.
                }
            })();

            this.setState({ currentComparison });
        }
    }

    currentTimingMethodChanged(): void {
        if (this.state != null) {
            const currentTimingMethod = this.state.eventSink.currentTimingMethod();

            (async () => {
                try {
                    await Storage.storeTimingMethod(currentTimingMethod);
                } catch {
                    // It's fine if this fails.
                }
            })();

            this.setState({ currentTimingMethod });
        }
    }

    currentPhaseChanged(): void {
        if (this.state != null) {
            this.setState({
                currentPhase: this.state.eventSink.currentPhase(),
            });
        }
    }

    currentSplitChanged(): void {
        if (this.state != null) {
            this.setState({
                currentSplitIndex: this.state.eventSink.currentSplitIndex(),
            });
        }
    }

    comparisonsListChanged(): void {
        if (this.state != null) {
            this.setState({
                allComparisons: this.state.eventSink.getAllComparisons(),
            });
        }
    }

    onReset(): void {
        if (this.state.generalSettings.saveOnReset) {
            this.saveSplits();
        }
    }

    splitsModifiedChanged(): void {
        if (this.state != null) {
            const splitsModified = this.state.eventSink.hasBeenModified();
            this.setState({ splitsModified }, () => this.updateBadge());
        }
    }

    private updateBadge(): void {
        if (this.state.splitsModified || this.state.layoutModified) {
            try {
                navigator?.setAppBadge();
            } catch {
                // It's fine if this fails.
            }

            // It's important that any change is at the end of the title,
            // because at least Chrome then recognizes that it's an extension of
            // the PWA name. Otherwise it would show:
            // LiveSplit One - Window Title
            // which would repeat LiveSplit One.
            document.title = "LiveSplit One ●";
        } else {
            try {
                navigator?.clearAppBadge();
            } catch {
                // It's fine if this fails.
            }
            document.title = "LiveSplit One";
        }
    }
}
