import * as React from "react";
import { TimingMethod, TimeSpan, LayoutStateRefMut, TimerPhase } from "../livesplit-core";
import * as LiveSplit from "../livesplit-core";
import { Option, expect } from "../util/OptionUtil";
import DragUpload from "./DragUpload";
import Layout from "../layout/Layout";
import { UrlCache } from "../util/UrlCache";
import { WebRenderer } from "../livesplit-core/livesplit_core";
import { GeneralSettings } from "./SettingsEditor";
import { LiveSplitServer } from "../api/LiveSplitServer";
import { LSOEventSink } from "./LSOEventSink";

import LiveSplitIcon from "../assets/icon.svg";

import "../css/TimerView.scss";

export interface Props {
    isDesktop: boolean,
    layout: LiveSplit.Layout,
    layoutState: LayoutStateRefMut,
    layoutUrlCache: UrlCache,
    layoutWidth: number,
    layoutHeight: number,
    generalSettings: GeneralSettings,
    renderWithSidebar: boolean,
    sidebarOpen: boolean,
    eventSink: LSOEventSink,
    renderer: WebRenderer,
    callbacks: Callbacks,
    serverConnection: Option<LiveSplitServer>,
    currentComparison: string,
    currentTimingMethod: TimingMethod,
    currentPhase: TimerPhase,
    currentSplitIndex: number,
}
export interface State {
    manualGameTime: string,
}

interface Callbacks {
    importLayoutFromFile(file: File): Promise<void>,
    importSplitsFromFile(file: File): Promise<void>,
    onResize(width: number, height: number): Promise<void>,
    openAboutView(): void,
    openLayoutView(): void,
    openSplitsView(): void,
    openSettingsEditor(): void,
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
    onServerConnectionClosed(): void,
    onServerConnectionOpened(serverConnection: LiveSplitServer): void,
}

export class TimerView extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            manualGameTime: "",
        };
    }

    public render() {
        const renderedView = this.renderView();
        if (this.props.renderWithSidebar) {
            const sidebarContent = this.renderSidebarContent();
            return this.props.callbacks.renderViewWithSidebar(renderedView, sidebarContent);
        } else {
            return renderedView;
        }
    }

    private renderView() {
        return <DragUpload
            importLayout={(file) => this.props.callbacks.importLayoutFromFile(file)}
            importSplits={(file) => this.props.callbacks.importSplitsFromFile(file)}
        >
            <div>
                <div
                    onClick={(_) => {
                        if (this.props.generalSettings.showControlButtons) {
                            this.props.eventSink.splitOrStart();
                        }
                    }}
                    style={{
                        display: "inline-block",
                        cursor: this.props.generalSettings.showControlButtons ? "pointer" : undefined,
                    }}
                >
                    <Layout
                        getState={() => {
                            this.props.eventSink.updateLayoutState(
                                this.props.layout,
                                this.props.layoutState,
                                this.props.layoutUrlCache.imageCache,
                            );
                            this.props.layoutUrlCache.collect();
                            return this.props.layoutState;
                        }}
                        layoutUrlCache={this.props.layoutUrlCache}
                        allowResize={this.props.isDesktop}
                        width={this.props.layoutWidth}
                        height={this.props.layoutHeight}
                        generalSettings={this.props.generalSettings}
                        renderer={this.props.renderer}
                        onResize={(width, height) => this.props.callbacks.onResize(width, height)}
                    />
                </div>
            </div>
            {
                this.props.generalSettings.showControlButtons && <div className="buttons" style={{ width: this.props.layoutWidth }}>
                    <div className="small">
                        <button
                            aria-label={this.props.currentPhase === TimerPhase.NotRunning
                                ? "Start"
                                : this.props.currentPhase === TimerPhase.Paused
                                    ? "Resume"
                                    : "Pause"
                            }
                            disabled={this.props.currentPhase === TimerPhase.Ended}
                            onClick={(_) => this.props.eventSink.togglePauseOrStart()}
                        >
                            <i
                                className={
                                    this.props.currentPhase === TimerPhase.NotRunning ||
                                        this.props.currentPhase === TimerPhase.Paused
                                        ? "fa fa-play"
                                        : "fa fa-pause"
                                }
                                aria-hidden="true"
                            />
                        </button>
                        <button
                            aria-label="Undo Split"
                            disabled={this.props.currentSplitIndex <= 0}
                            onClick={(_) => this.props.eventSink.undoSplit()}
                        >
                            <i className="fa fa-arrow-up" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="small">
                        <button
                            aria-label="Reset"
                            disabled={this.props.currentPhase === TimerPhase.NotRunning}
                            onClick={(_) => this.props.eventSink.reset()}
                        >
                            <i className="fa fa-times" aria-hidden="true" />
                        </button>
                        <button
                            aria-label="Skip Split"
                            disabled={
                                this.props.currentPhase === TimerPhase.NotRunning ||
                                this.props.currentSplitIndex + 1 >= this.props.eventSink.segmentsCount()
                            }
                            onClick={(_) => this.props.eventSink.skipSplit()}
                        >
                            <i className="fa fa-arrow-down" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            }
            {
                this.props.generalSettings.showManualGameTime && <div className="buttons" style={{ width: this.props.layoutWidth }}>
                    <input
                        type="text"
                        className="manual-game-time"
                        value={this.state.manualGameTime}
                        placeholder="Manual Game Time"
                        onChange={(e) => {
                            this.setState({
                                manualGameTime: e.target.value,
                            });
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const timer = this.props.eventSink;
                                if (timer.currentPhase() === LiveSplit.TimerPhase.NotRunning) {
                                    timer.start();
                                    timer.pauseGameTime();
                                    using gameTime = TimeSpan.parse(this.state.manualGameTime)
                                        ?? expect(TimeSpan.parse("0"), "Failed to parse TimeSpan");
                                    timer.setGameTimeInner(gameTime);
                                    this.setState({ manualGameTime: "" });
                                } else {
                                    using gameTime = TimeSpan.parse(this.state.manualGameTime);
                                    if (gameTime !== null) {
                                        timer.setGameTimeInner(gameTime);
                                        timer.split();
                                        this.setState({ manualGameTime: "" });
                                    }
                                }
                            }
                        }}
                    />
                </div>
            }
        </DragUpload>;
    }

    private renderSidebarContent() {
        return (
            <div className="sidebar-buttons">
                <div className="livesplit-title">
                    <span className="livesplit-icon">
                        <img src={LiveSplitIcon} alt="LiveSplit Logo" />
                    </span>
                    <h1> LiveSplit One</h1>
                </div>
                <hr className="livesplit-title-separator" />
                <button onClick={(_) => this.props.callbacks.openSplitsView()}>
                    <i className="fa fa-list" aria-hidden="true" /> Splits
                </button>
                <button onClick={(_) => this.props.callbacks.openLayoutView()}>
                    <i className="fa fa-layer-group" aria-hidden="true" /> Layout
                </button>
                <hr />
                <h2>Compare Against</h2>
                <div className="choose-comparison">
                    <button
                        aria-label="Switch to Previous Comparison"
                        onClick={(_) => this.props.eventSink.switchToPreviousComparison()}
                    >
                        <i className="fa fa-caret-left" aria-hidden="true" />
                    </button>
                    <span>{this.props.currentComparison}</span>
                    <button
                        aria-label="Switch to Next Comparison"
                        onClick={(_) => this.props.eventSink.switchToNextComparison()}
                    >
                        <i className="fa fa-caret-right" aria-hidden="true" />
                    </button>
                </div>
                <div className="small">
                    <button
                        onClick={(_) => {
                            this.props.eventSink.setCurrentTimingMethod(TimingMethod.RealTime);
                        }}
                        className={
                            (this.props.currentTimingMethod === TimingMethod.RealTime ? "button-pressed" : "") +
                            " toggle-left"
                        }
                    >
                        Real Time
                    </button>
                    <button
                        onClick={(_) => {
                            this.props.eventSink.setCurrentTimingMethod(TimingMethod.GameTime);
                        }}
                        className={
                            (this.props.currentTimingMethod === TimingMethod.GameTime ? "button-pressed" : "") +
                            " toggle-right"
                        }
                    >
                        Game Time
                    </button>
                </div>
                <hr />
                <button onClick={() => this.props.callbacks.openSettingsEditor()}>
                    <i className="fa fa-cog" aria-hidden="true" /> Settings
                </button>
                <button onClick={(_) => this.props.callbacks.openAboutView()}>
                    <i className="fa fa-info-circle" aria-hidden="true" /> About
                </button>
            </div>
        );
    }
}
