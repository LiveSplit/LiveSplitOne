import * as React from "react";
import { toast } from "react-toastify";
import {
    SharedTimer, TimerRef, TimerRefMut, Layout,
    TimingMethod, TimeSpan, LayoutStateRefMut,
} from "../livesplit-core";
import { Option } from "../util/OptionUtil";
import DragUpload from "./DragUpload";
import AutoRefresh from "../util/AutoRefresh";
import AutoRefreshLayout from "../layout/AutoRefreshLayout";

import LiveSplitIcon from "../assets/icon_small.png";

import "../css/TimerView.scss";
import { WebSocketManager } from "../util/WebSocketManager";

export interface Props {
    isDesktop: boolean,
    layout: Layout,
    layoutState: LayoutStateRefMut,
    layoutWidth: number,
    renderWithSidebar: boolean,
    sidebarOpen: boolean,
    timer: SharedTimer,
    callbacks: Callbacks,
}
export interface State {
    comparison: Option<string>,
    timingMethod: Option<TimingMethod>,
}

interface Callbacks {
    importLayoutFromFile(file: File): Promise<void>,
    importSplitsFromFile(file: File): Promise<void>,
    onResize(width: number): Promise<void>,
    openAboutView(): void,
    openLayoutView(): void,
    openSplitsView(): void,
    openSettingsEditor(): void,
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
}

export class TimerView extends React.Component<Props, State> {
    private connection: WebSocketManager;

    constructor(props: Props) {
        super(props);

        this.connection = new WebSocketManager({
            start: () => this.start(),
            split: () => this.split(),
            splitOrStart: () => this.splitOrStart(),
            reset: () => this.reset(),
            undoSplit: () => this.undoSplit(),
            skip: () => this.skipSplit(),
            initGameTime: () => this.initializeGameTime(),
            setGameTime: (time: string) => this.setGameTime(time),
            setLoadingTimes: (loadTime: string) => this.setLoadingTimes(loadTime),
            pauseGameTime: () => this.pauseGameTime(),
            resumeGameTime: () => this.resumeGameTime(),
            getCurrentTime: (cb: (totalSeconds: number) => void) => this.getTime(cb),
            getCurrentPhase: (cb: (currentPhase: number) => void) => this.getCurrentPhase(cb),
            togglePause: () => this.togglePauseOrStart(),
        },
        {
            info: toast.info,
            error: toast.error
        });
        this.state = {
            comparison: null,
            timingMethod: null,
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
                    onClick={(_) => this.splitOrStart()}
                    style={{
                        display: "inline-block",
                        cursor: "pointer",
                    }}
                >
                    <AutoRefreshLayout
                        getState={() => this.readWith(
                            (t) => this.props.layout.updateStateAsJson(this.props.layoutState, t),
                        )}
                        allowResize={this.props.isDesktop}
                        width={this.props.layoutWidth}
                        onResize={(width) => this.props.callbacks.onResize(width)}
                    />
                </div>
                <div className="buttons" style={{ width: this.props.layoutWidth }}>
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

    private renderSidebarContent() {
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
                                const connectionState = this.connection.connectionState();
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
                    <button onClick={() => this.props.callbacks.openSettingsEditor()}>
                        <i className="fa fa-cog" aria-hidden="true" /> Settings
                    </button>
                    <hr />
                    <button onClick={(_) => this.props.callbacks.openAboutView()}>
                        <i className="fa fa-info-circle" aria-hidden="true" /> About
                    </button>
                </div >
            </AutoRefresh>
        );
    }

    private updateSidebar() {
        if (this.props.sidebarOpen || this.props.isDesktop) {
            const [comparison, timingMethod] = this.props.timer.readWith((t): [string, number] => {
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

    private connectToServerOrDisconnect() {
        const connectionState = this.connection.connectionState();
        connectionState === WebSocket.OPEN ? this.connection.disconnect() : this.connection.connectToServer();
    }

    private getTime(cb: (totalSeconds: number) => void) {
        this.readWith((t) => {
            cb(t.currentTime().realTime()!.totalSeconds());
        });
    }

    private getCurrentPhase(cb: (phase: number) => void) {
        this.readWith((t) => cb(t.currentPhase()));
    }

    private writeWith<T>(action: (timer: TimerRefMut) => T): T {
        return this.props.timer.writeWith(action);
    }

    private readWith<T>(action: (timer: TimerRef) => T): T {
        return this.props.timer.readWith(action);
    }

    private switchToPreviousComparison() {
        this.writeWith((t) => t.switchToPreviousComparison());
    }

    private switchToNextComparison() {
        this.writeWith((t) => t.switchToNextComparison());
    }

    private setCurrentTimingMethod(timingMethod: TimingMethod) {
        this.writeWith((t) => t.setCurrentTimingMethod(timingMethod));
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
