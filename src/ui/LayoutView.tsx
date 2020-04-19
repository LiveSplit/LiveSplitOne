import * as React from "react";
import { SharedTimer, Layout } from "../livesplit-core";
import { TimerView } from "./TimerView";

export interface Props {
    isDesktop: boolean,
    layout: Layout,
    layoutWidth: number,
    renderWithSidebar: boolean,
    sidebarOpen: boolean,
    timer: SharedTimer,
    callbacks: Callbacks,
}

interface Callbacks {
    exportLayout(): void,
    importLayout(): void,
    importLayoutFromFile(file: File): Promise<void>,
    importSplitsFromFile(file: File): Promise<void>,
    loadDefaultLayout(): void,
    onResize(width: number): Promise<void>,
    openAboutView(): void,
    openLayoutEditor(): void,
    openLayoutView(): void,
    openSplitsView(): void,
    openSettingsEditor(): void,
    openTimerView(): void,
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
    saveLayout(): void,
}

export class LayoutView extends React.Component<Props> {
    public render() {
        const renderedView = <TimerView
            layout={this.props.layout}
            layoutWidth={this.props.layoutWidth}
            isDesktop={this.props.isDesktop}
            renderWithSidebar={false}
            sidebarOpen={this.props.sidebarOpen}
            timer={this.props.timer}
            callbacks={this.props.callbacks}
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
