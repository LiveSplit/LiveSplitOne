import * as React from "react";
import {
    TimingMethod,
    TimeSpan,
    LayoutStateRefMut,
    TimerPhase,
} from "../../livesplit-core";
import * as LiveSplit from "../../livesplit-core";
import { Option, expect } from "../../util/OptionUtil";
import { DragUpload } from "../components/DragUpload";
import Layout from "../components/Layout";
import { UrlCache } from "../../util/UrlCache";
import { WebRenderer } from "../../livesplit-core/livesplit_core";
import {
    GeneralSettings,
    MANUAL_GAME_TIME_MODE_SEGMENT_TIMES,
} from "./MainSettings";
import { LiveSplitServer } from "../../api/LiveSplitServer";
import { LSOCommandSink } from "../../util/LSOCommandSink";
import {
    ArrowDown,
    ArrowUp,
    Circle,
    Info,
    Layers,
    List,
    Pause,
    Play,
    Settings,
    X,
} from "lucide-react";

import LiveSplitIcon from "../../assets/icon.svg";

import * as classes from "../../css/TimerView.module.scss";
import * as sidebarClasses from "../../css/Sidebar.module.scss";
import * as buttonGroupClasses from "../../css/ButtonGroup.module.scss";

export interface Props {
    isDesktop: boolean;
    layout: LiveSplit.Layout;
    layoutState: LayoutStateRefMut;
    layoutUrlCache: UrlCache;
    layoutWidth: number;
    layoutHeight: number;
    generalSettings: GeneralSettings;
    renderWithSidebar: boolean;
    sidebarOpen: boolean;
    commandSink: LSOCommandSink;
    renderer: WebRenderer;
    callbacks: Callbacks;
    serverConnection: Option<LiveSplitServer>;
    currentComparison: string;
    currentTimingMethod: TimingMethod;
    currentPhase: TimerPhase;
    currentSplitIndex: number;
    allComparisons: string[];
    splitsModified: boolean;
    layoutModified: boolean;
}
export interface State {
    manualGameTime: string;
}

interface Callbacks {
    importLayoutFromFile(file: File): Promise<void>;
    importSplitsFromFile(file: File): Promise<void>;
    onResize(width: number, height: number): void;
    openAboutView(): void;
    openLayoutView(): void;
    openSplitsView(): void;
    openMainSettings(): void;
    renderViewWithSidebar(
        renderedView: React.JSX.Element,
        sidebarContent: React.JSX.Element,
    ): React.JSX.Element;
    onServerConnectionClosed(): void;
    onServerConnectionOpened(serverConnection: LiveSplitServer): void;
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
            return this.props.callbacks.renderViewWithSidebar(
                renderedView,
                sidebarContent,
            );
        } else {
            return renderedView;
        }
    }

    private renderView() {
        const showManualGameTime =
            this.props.generalSettings.showManualGameTime;

        return (
            <DragUpload
                importLayout={(file) =>
                    this.props.callbacks.importLayoutFromFile(file)
                }
                importSplits={(file) =>
                    this.props.callbacks.importSplitsFromFile(file)
                }
            >
                <div>
                    <div
                        onClick={(_) => {
                            if (this.props.generalSettings.showControlButtons) {
                                this.props.commandSink.splitOrStart();
                            }
                        }}
                        style={{
                            width: "fit-content",
                            cursor: this.props.generalSettings
                                .showControlButtons
                                ? "pointer"
                                : undefined,
                        }}
                    >
                        <Layout
                            getState={() => {
                                // The drag upload above causes the layout to be
                                // dropped. We need to wait for it to be replaced
                                // with the new layout.
                                if (this.props.layout.ptr !== 0) {
                                    this.props.commandSink.updateLayoutState(
                                        this.props.layout,
                                        this.props.layoutState,
                                        this.props.layoutUrlCache.imageCache,
                                    );
                                    this.props.layoutUrlCache.collect();
                                }
                                return this.props.layoutState;
                            }}
                            layoutUrlCache={this.props.layoutUrlCache}
                            allowResize={this.props.isDesktop}
                            width={this.props.layoutWidth}
                            height={this.props.layoutHeight}
                            generalSettings={this.props.generalSettings}
                            renderer={this.props.renderer}
                            onResize={(width, height) =>
                                this.props.callbacks.onResize(width, height)
                            }
                        />
                    </div>
                </div>
                {this.props.generalSettings.showControlButtons && (
                    <div
                        className={classes.buttons}
                        style={{ width: this.props.layoutWidth }}
                    >
                        <div className={classes.controlButtons}>
                            <button
                                aria-label={
                                    this.props.currentPhase ===
                                    TimerPhase.NotRunning
                                        ? "Start"
                                        : this.props.currentPhase ===
                                            TimerPhase.Paused
                                          ? "Resume"
                                          : "Pause"
                                }
                                disabled={
                                    this.props.currentPhase === TimerPhase.Ended
                                }
                                onClick={(_) =>
                                    this.props.commandSink.togglePauseOrStart()
                                }
                            >
                                {this.props.currentPhase ===
                                    TimerPhase.NotRunning ||
                                this.props.currentPhase ===
                                    TimerPhase.Paused ? (
                                    <Play fill="currentColor" strokeWidth={0} />
                                ) : (
                                    <Pause
                                        fill="currentColor"
                                        strokeWidth={0}
                                    />
                                )}
                            </button>
                            <button
                                aria-label="Undo Split"
                                disabled={this.props.currentSplitIndex <= 0}
                                onClick={(_) =>
                                    this.props.commandSink.undoSplit()
                                }
                            >
                                <ArrowUp strokeWidth={3.5} />
                            </button>
                            <button
                                aria-label="Reset"
                                disabled={
                                    this.props.currentPhase ===
                                    TimerPhase.NotRunning
                                }
                                onClick={(_) => this.props.commandSink.reset()}
                            >
                                <X strokeWidth={3.5} />
                            </button>
                            <button
                                aria-label="Skip Split"
                                disabled={
                                    this.props.currentPhase ===
                                        TimerPhase.NotRunning ||
                                    this.props.currentSplitIndex + 1 >=
                                        this.props.commandSink.segmentsCount()
                                }
                                onClick={(_) =>
                                    this.props.commandSink.skipSplit()
                                }
                            >
                                <ArrowDown strokeWidth={3.5} />
                            </button>
                        </div>
                    </div>
                )}
                {showManualGameTime && (
                    <div
                        className={classes.buttons}
                        style={{ width: this.props.layoutWidth }}
                    >
                        <input
                            type="text"
                            className={classes.manualGameTime}
                            value={this.state.manualGameTime}
                            placeholder="Manual Game Time"
                            onChange={(e) => {
                                this.setState({
                                    manualGameTime: e.target.value,
                                });
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    const timer = this.props.commandSink;
                                    if (
                                        timer.currentPhase() ===
                                        LiveSplit.TimerPhase.NotRunning
                                    ) {
                                        timer.start();
                                        timer.pauseGameTime();
                                        using gameTime =
                                            TimeSpan.parse(
                                                this.state.manualGameTime,
                                            ) ??
                                            expect(
                                                TimeSpan.parse("0"),
                                                "Failed to parse TimeSpan",
                                            );
                                        timer.setGameTimeInner(gameTime);
                                        this.setState({ manualGameTime: "" });
                                    } else {
                                        using gameTime = TimeSpan.parse(
                                            this.state.manualGameTime,
                                        );
                                        if (gameTime !== null) {
                                            if (
                                                showManualGameTime.mode ===
                                                MANUAL_GAME_TIME_MODE_SEGMENT_TIMES
                                            ) {
                                                const currentGameTime = timer
                                                    .currentTime()
                                                    .gameTime();
                                                if (currentGameTime !== null) {
                                                    gameTime.addAssign(
                                                        currentGameTime,
                                                    );
                                                }
                                            }
                                            timer.setGameTimeInner(gameTime);
                                            timer.split();
                                            this.setState({
                                                manualGameTime: "",
                                            });
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                )}
            </DragUpload>
        );
    }

    private renderSidebarContent() {
        return (
            <>
                <div className={classes.liveSplitTitle}>
                    <img
                        className={classes.liveSplitIcon}
                        src={LiveSplitIcon}
                        alt="LiveSplit Logo"
                    />
                    <h1>LiveSplit One</h1>
                </div>
                <hr />
                <button onClick={(_) => this.props.callbacks.openSplitsView()}>
                    <List strokeWidth={2.5} />
                    <span>
                        Splits
                        {this.props.splitsModified && (
                            <Circle
                                strokeWidth={0}
                                size={12}
                                fill="currentColor"
                                className={sidebarClasses.modifiedIcon}
                            />
                        )}
                    </span>
                </button>
                <button onClick={(_) => this.props.callbacks.openLayoutView()}>
                    <Layers strokeWidth={2.5} />
                    <span>
                        Layout
                        {this.props.layoutModified && (
                            <Circle
                                strokeWidth={0}
                                size={12}
                                fill="currentColor"
                                className={sidebarClasses.modifiedIcon}
                            />
                        )}
                    </span>
                </button>
                <hr />
                <h2>Compare Against</h2>
                <select
                    value={this.props.currentComparison}
                    onChange={(e) =>
                        this.props.commandSink.setCurrentComparison(
                            e.target.value,
                        )
                    }
                    className={classes.chooseComparison}
                >
                    {this.props.allComparisons.map((comparison) => (
                        <option>{comparison}</option>
                    ))}
                </select>
                <div className={buttonGroupClasses.group}>
                    <button
                        onClick={(_) => {
                            this.props.commandSink.setCurrentTimingMethod(
                                TimingMethod.RealTime,
                            );
                        }}
                        className={
                            this.props.currentTimingMethod ===
                            TimingMethod.RealTime
                                ? buttonGroupClasses.pressed
                                : ""
                        }
                    >
                        Real Time
                    </button>
                    <button
                        onClick={(_) => {
                            this.props.commandSink.setCurrentTimingMethod(
                                TimingMethod.GameTime,
                            );
                        }}
                        className={
                            this.props.currentTimingMethod ===
                            TimingMethod.GameTime
                                ? buttonGroupClasses.pressed
                                : ""
                        }
                    >
                        Game Time
                    </button>
                </div>
                <hr />
                <button onClick={() => this.props.callbacks.openMainSettings()}>
                    <Settings strokeWidth={2.5} /> Settings
                </button>
                <button onClick={(_) => this.props.callbacks.openAboutView()}>
                    <Info strokeWidth={2.5} /> About
                </button>
            </>
        );
    }
}
