import React, { useState } from "react";
import {
    TimingMethod,
    TimeSpan,
    LayoutStateRefMut,
    TimerPhase,
} from "../../livesplit-core";
import * as LiveSplit from "../../livesplit-core";
import { Option, expect } from "../../util/OptionUtil";
import { DragUpload } from "../components/DragUpload";
import { Layout } from "../components/Layout";
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
    PictureInPicture2,
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
    popOut(): void;
}

export function TimerView(props: Props) {
    const view = <View {...props} />;
    if (!props.renderWithSidebar) {
        return view;
    }
    return props.callbacks.renderViewWithSidebar(view, <SideBar {...props} />);
}

function View({
    isDesktop,
    layout,
    layoutState,
    layoutUrlCache,
    layoutWidth,
    layoutHeight,
    generalSettings,
    commandSink,
    renderer,
    callbacks,
    currentPhase,
    currentSplitIndex,
}: Props) {
    const [manualGameTime, setManualGameTime] = useState("");
    const showManualGameTime = generalSettings.showManualGameTime;

    return (
        <DragUpload
            importLayout={(file) => callbacks.importLayoutFromFile(file)}
            importSplits={(file) => callbacks.importSplitsFromFile(file)}
        >
            <div>
                <div
                    onClick={(_) => {
                        if (generalSettings.showControlButtons) {
                            commandSink.splitOrStart();
                        }
                    }}
                    style={{
                        width: "fit-content",
                        cursor: generalSettings.showControlButtons
                            ? "pointer"
                            : undefined,
                    }}
                >
                    <Layout
                        getState={() => {
                            // The drag upload above causes the layout to be
                            // dropped. We need to wait for it to be replaced
                            // with the new layout.
                            if (layout.ptr !== 0) {
                                commandSink.updateLayoutState(
                                    layout,
                                    layoutState,
                                    layoutUrlCache.imageCache,
                                );
                                layoutUrlCache.collect();
                            }
                            return layoutState;
                        }}
                        layoutUrlCache={layoutUrlCache}
                        allowResize={isDesktop}
                        width={layoutWidth}
                        height={layoutHeight}
                        generalSettings={generalSettings}
                        renderer={renderer}
                        onResize={(width, height) =>
                            callbacks.onResize(width, height)
                        }
                        window={window}
                    />
                </div>
            </div>
            {generalSettings.showControlButtons && (
                <div className={classes.buttons} style={{ width: layoutWidth }}>
                    <div className={classes.controlButtons}>
                        <button
                            aria-label={
                                currentPhase === TimerPhase.NotRunning
                                    ? "Start"
                                    : currentPhase === TimerPhase.Paused
                                      ? "Resume"
                                      : "Pause"
                            }
                            disabled={currentPhase === TimerPhase.Ended}
                            onClick={(_) => commandSink.togglePauseOrStart()}
                        >
                            {currentPhase === TimerPhase.NotRunning ||
                            currentPhase === TimerPhase.Paused ? (
                                <Play fill="currentColor" strokeWidth={0} />
                            ) : (
                                <Pause fill="currentColor" strokeWidth={0} />
                            )}
                        </button>
                        <button
                            aria-label="Undo Split"
                            disabled={currentSplitIndex <= 0}
                            onClick={(_) => commandSink.undoSplit()}
                        >
                            <ArrowUp strokeWidth={3.5} />
                        </button>
                        <button
                            aria-label="Reset"
                            disabled={currentPhase === TimerPhase.NotRunning}
                            onClick={(_) => commandSink.reset()}
                        >
                            <X strokeWidth={3.5} />
                        </button>
                        <button
                            aria-label="Skip Split"
                            disabled={
                                currentPhase === TimerPhase.NotRunning ||
                                currentSplitIndex + 1 >=
                                    commandSink.segmentsCount()
                            }
                            onClick={(_) => commandSink.skipSplit()}
                        >
                            <ArrowDown strokeWidth={3.5} />
                        </button>
                    </div>
                </div>
            )}
            {showManualGameTime && (
                <div className={classes.buttons} style={{ width: layoutWidth }}>
                    <input
                        type="text"
                        className={classes.manualGameTime}
                        value={manualGameTime}
                        placeholder="Manual Game Time"
                        onChange={(e) => setManualGameTime(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const timer = commandSink;
                                if (
                                    timer.currentPhase() ===
                                    LiveSplit.TimerPhase.NotRunning
                                ) {
                                    timer.start();
                                    timer.pauseGameTime();
                                    using gameTime =
                                        TimeSpan.parse(manualGameTime) ??
                                        expect(
                                            TimeSpan.parse("0"),
                                            "Failed to parse TimeSpan",
                                        );
                                    timer.setGameTimeInner(gameTime);
                                    setManualGameTime("");
                                } else {
                                    using gameTime =
                                        TimeSpan.parse(manualGameTime);
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
                                        setManualGameTime("");
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

export function SideBar({
    commandSink,
    callbacks,
    currentComparison,
    currentTimingMethod,
    allComparisons,
    splitsModified,
    layoutModified,
}: Props) {
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
            <button onClick={(_) => callbacks.openSplitsView()}>
                <List strokeWidth={2.5} />
                <span>
                    Splits
                    {splitsModified && (
                        <Circle
                            strokeWidth={0}
                            size={12}
                            fill="currentColor"
                            className={sidebarClasses.modifiedIcon}
                        />
                    )}
                </span>
            </button>
            <button onClick={(_) => callbacks.openLayoutView()}>
                <Layers strokeWidth={2.5} />
                <span>
                    Layout
                    {layoutModified && (
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
                value={currentComparison}
                onChange={(e) =>
                    commandSink.setCurrentComparison(e.target.value)
                }
                className={classes.chooseComparison}
            >
                {allComparisons.map((comparison) => (
                    <option>{comparison}</option>
                ))}
            </select>
            <div className={buttonGroupClasses.group}>
                <button
                    onClick={(_) => {
                        commandSink.setCurrentTimingMethod(
                            TimingMethod.RealTime,
                        );
                    }}
                    className={
                        currentTimingMethod === TimingMethod.RealTime
                            ? buttonGroupClasses.pressed
                            : ""
                    }
                >
                    Real Time
                </button>
                <button
                    onClick={(_) => {
                        commandSink.setCurrentTimingMethod(
                            TimingMethod.GameTime,
                        );
                    }}
                    className={
                        currentTimingMethod === TimingMethod.GameTime
                            ? buttonGroupClasses.pressed
                            : ""
                    }
                >
                    Game Time
                </button>
            </div>
            <hr />
            <button onClick={() => callbacks.popOut()}>
                <PictureInPicture2 strokeWidth={2.5} /> Pop Out
            </button>
            <button onClick={() => callbacks.openMainSettings()}>
                <Settings strokeWidth={2.5} /> Settings
            </button>
            <button onClick={() => callbacks.openAboutView()}>
                <Info strokeWidth={2.5} /> About
            </button>
        </>
    );
}
