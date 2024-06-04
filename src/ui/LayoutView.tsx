import * as React from "react";
import { Layout, LayoutStateRefMut, TimerPhase, TimingMethod } from "../livesplit-core";
import { TimerView } from "./TimerView";
import { UrlCache } from "../util/UrlCache";
import { WebRenderer } from "../livesplit-core/livesplit_core";
import { GeneralSettings } from "./SettingsEditor";
import { LiveSplitServer } from "../api/LiveSplitServer";
import { Option } from "../util/OptionUtil";
import { LSOEventSink } from "./LSOEventSink";

export interface Props {
    isDesktop: boolean,
    layout: Layout,
    layoutState: LayoutStateRefMut,
    layoutUrlCache: UrlCache,
    layoutWidth: number,
    layoutHeight: number,
    generalSettings: GeneralSettings,
    renderWithSidebar: boolean,
    sidebarOpen: boolean,
    eventSink: LSOEventSink,
    renderer: WebRenderer,
    serverConnection: Option<LiveSplitServer>,
    callbacks: Callbacks,
    currentComparison: string,
    currentTimingMethod: TimingMethod,
    currentPhase: TimerPhase,
    currentSplitIndex: number,
    allComparisons: string[],
    splitsModified: boolean,
    layoutModified: boolean,
}

interface Callbacks {
    exportLayout(): void,
    importLayout(): void,
    importLayoutFromFile(file: File): Promise<void>,
    importSplitsFromFile(file: File): Promise<void>,
    loadDefaultLayout(): void,
    onResize(width: number, height: number): Promise<void>,
    openAboutView(): void,
    openLayoutEditor(): void,
    openLayoutView(): void,
    openSplitsView(): void,
    openSettingsEditor(): void,
    openTimerView(): void,
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
    saveLayout(): void,
    onServerConnectionOpened(serverConnection: LiveSplitServer): void,
    onServerConnectionClosed(): void,
}

export class LayoutView extends React.Component<Props> {
    public render() {
        const renderedView = <TimerView
            layout={this.props.layout}
            layoutState={this.props.layoutState}
            layoutUrlCache={this.props.layoutUrlCache}
            layoutWidth={this.props.layoutWidth}
            layoutHeight={this.props.layoutHeight}
            generalSettings={this.props.generalSettings}
            isDesktop={this.props.isDesktop}
            renderWithSidebar={false}
            sidebarOpen={this.props.sidebarOpen}
            eventSink={this.props.eventSink}
            renderer={this.props.renderer}
            serverConnection={this.props.serverConnection}
            callbacks={this.props.callbacks}
            currentComparison={this.props.currentComparison}
            currentTimingMethod={this.props.currentTimingMethod}
            currentPhase={this.props.currentPhase}
            currentSplitIndex={this.props.currentSplitIndex}
            allComparisons={this.props.allComparisons}
            splitsModified={this.props.splitsModified}
            layoutModified={this.props.layoutModified}
        />;
        const sidebarContent = this.renderSidebarContent();
        return this.props.callbacks.renderViewWithSidebar(renderedView, sidebarContent);
    }

    private renderSidebarContent() {
        return (
            <div className="sidebar-buttons">
                <h1>Layout</h1>
                <hr />
                <button onClick={(_) => this.props.callbacks.openLayoutEditor()}>
                    <i className="fa fa-edit" aria-hidden="true" /> Edit
                </button>
                <button onClick={(_) => this.props.callbacks.saveLayout()}>
                    <i className="fa fa-save" aria-hidden="true" /> Save
                    {
                        this.props.layoutModified &&
                        <i className="fa fa-circle modified-icon" aria-hidden="true" />
                    }
                </button>
                <button onClick={(_) => this.props.callbacks.importLayout()}>
                    <i className="fa fa-download" aria-hidden="true" /> Import
                </button>
                <button onClick={(_) => this.props.callbacks.exportLayout()}>
                    <i className="fa fa-upload" aria-hidden="true" /> Export
                </button>
                <button onClick={(_) => this.props.callbacks.loadDefaultLayout()}>
                    <i className="fa fa-sync" aria-hidden="true" /> Default
                </button>
                <hr />
                <button onClick={(_) => this.props.callbacks.openTimerView()}>
                    <i className="fa fa-caret-left" aria-hidden="true" /> Back
                </button>
            </div>
        );
    }
}
