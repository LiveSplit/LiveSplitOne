import React, { useEffect, useState } from "react";
import * as LiveSplit from "../../livesplit-core";
import {
    FILE_EXT_IMAGES,
    FILE_EXT_SPLITS,
    openFileAsArrayBuffer,
} from "../../util/FileUtil";
import { TextBox } from "../components/TextBox";
import { toast } from "react-toastify";
import {
    downloadGameList,
    searchGames,
    getCategories,
    downloadCategories,
    downloadLeaderboard,
    getLeaderboard,
    downloadPlatformList,
    getPlatforms,
    downloadRegionList,
    getRegions,
    downloadGameInfo,
    getGameInfo,
    downloadGameInfoByGameId,
    downloadCategoriesByGameId,
    gameListLength,
    platformListLength,
    regionListLength,
} from "../../api/GameList";
import { Category, Run, getRun } from "../../api/SpeedrunCom";
import { Option, expect, map } from "../../util/OptionUtil";
import {
    SettingsComponent,
    JsonSettingValueFactory,
    ExtendedSettingsDescriptionFieldJson,
    ExtendedSettingsDescriptionValueJson,
} from "../components/Settings";
import { Markdown } from "../components/Markdown";
import { UrlCache } from "../../util/UrlCache";
import { GeneralSettings } from "./MainSettings";
import { showDialog } from "../components/Dialog";
import { corsBustingFetch } from "../../platform/CORS";
import { ContextMenu, MenuItem, Position } from "../components/ContextMenu";
import { Check, X } from "lucide-react";
import {
    Filters,
    isVariableValidForCategory,
    Leaderboard,
    LeaderboardButtons,
} from "../components/Leaderboard";

import * as classes from "../../css/RunEditor.module.scss";
import * as buttonGroupClasses from "../../css/ButtonGroup.module.scss";
import * as tableClasses from "../../css/Table.module.scss";
import * as markdownClasses from "../../css/Markdown.module.scss";
import * as tooltipClasses from "../../css/Tooltip.module.scss";

export interface Props {
    editor: LiveSplit.RunEditor;
    callbacks: Callbacks;
    runEditorUrlCache: UrlCache;
    allComparisons: string[];
    allVariables: Set<string>;
    generalSettings: GeneralSettings;
}

interface Callbacks {
    renderViewWithSidebar(
        renderedView: React.JSX.Element,
        sidebarContent: React.JSX.Element,
    ): React.JSX.Element;
    closeRunEditor(save: boolean): void;
}

interface RowState {
    splitTime: string;
    splitTimeChanged: boolean;
    segmentTime: string;
    segmentTimeChanged: boolean;
    bestSegmentTime: string;
    bestSegmentTimeChanged: boolean;
    comparisonTimes: string[];
    comparisonTimesChanged: boolean[];
    index: number;
}

enum Tab {
    RealTime,
    GameTime,
    Variables,
    Rules,
    Leaderboard,
}

export function RunEditor(props: Props) {
    const [abortController] = useState(() => new AbortController());
    useEffect(() => () => abortController.abort(), []);

    return props.callbacks.renderViewWithSidebar(
        <View {...props} abortController={abortController} />,
        <SideBar onClose={(save) => props.callbacks.closeRunEditor(save)} />,
    );
}

function View(props: Props & { abortController: AbortController }) {
    const [editorState, setEditorState] = useState(() => {
        const state = props.editor.stateAsJson(
            props.runEditorUrlCache.imageCache,
        );
        props.runEditorUrlCache.collect();
        return state as LiveSplit.RunEditorStateJson;
    });

    const [expandedLeaderboardRows, setExpandedLeaderboardRows] = useState(
        () => new Map<number, boolean>(),
    );

    const [filters, setFilters] = useState(() => ({
        variables: new Map<string, string>(),
        showObsolete: false,
    }));

    const [foundGames, setFoundGames] = useState(() =>
        searchGames(editorState.game),
    );

    const [offsetIsValid, setOffsetIsValid] = useState(true);
    const [attemptCountIsValid, setAttemptCountIsValid] = useState(true);

    const [tab, setTab] = useState(() =>
        editorState.timing_method === "RealTime" ? Tab.RealTime : Tab.GameTime,
    );

    useEffect(() => {
        if (props.generalSettings.speedrunComIntegration) {
            refreshGameList(maybeUpdate);
            refreshGameInfo(editorState.game, maybeUpdate);
            refreshCategoryList(editorState.game, maybeUpdate);
            refreshLeaderboard(
                editorState.game,
                editorState.category,
                maybeUpdate,
            );
            refreshPlatformList(maybeUpdate);
            refreshRegionList(maybeUpdate);
        }
    }, []);

    const update = (options: { switchTab?: Tab; search?: boolean } = {}) => {
        const intendedTab = options.switchTab ?? tab;
        const showTab = shouldShowTab(intendedTab, editorState);
        setTab(showTab ? intendedTab : Tab.RealTime);

        const state: LiveSplit.RunEditorStateJson = props.editor.stateAsJson(
            props.runEditorUrlCache.imageCache,
        );
        if (options.search) {
            setFoundGames(searchGames(state.game));
        }
        props.runEditorUrlCache.collect();
        setEditorState(state);
        return state;
    };

    const maybeUpdate = (
        options: { switchTab?: Tab; search?: boolean } = {},
    ) => {
        if (props.editor.ptr === 0) {
            return;
        }
        update(options);
    };

    const gameIcon = props.runEditorUrlCache.cache(editorState.icon);

    const { category, categoryNames } = getCurrentCategoriesInfo(editorState);

    return (
        <>
            <div className={classes.runEditorInfo}>
                <GameIcon
                    gameIcon={gameIcon}
                    speedrunComIntegration={
                        props.generalSettings.speedrunComIntegration
                    }
                    changeGameIcon={() =>
                        changeGameIcon(props.editor, maybeUpdate)
                    }
                    downloadBoxArt={() =>
                        downloadBoxArt(
                            props.abortController,
                            props.editor,
                            editorState,
                            maybeUpdate,
                        )
                    }
                    downloadIcon={() =>
                        downloadIcon(
                            props.abortController,
                            props.editor,
                            editorState,
                            maybeUpdate,
                        )
                    }
                    removeGameIcon={() => removeGameIcon(props.editor, update)}
                />
                <div className={classes.runEditorInfoTable}>
                    <div className={classes.infoTableRow}>
                        <div className={classes.infoTableCell}>
                            <TextBox
                                value={editorState.game}
                                onChange={(e) =>
                                    handleGameChange(
                                        e.target.value,
                                        props.editor,
                                        editorState,
                                        props.generalSettings,
                                        maybeUpdate,
                                        update,
                                        setExpandedLeaderboardRows,
                                        setFilters,
                                    )
                                }
                                label="Game"
                                list={["run-editor-game-list", foundGames]}
                            />
                        </div>
                        <div className={classes.infoTableCell}>
                            <TextBox
                                value={editorState.category}
                                onChange={(e) =>
                                    handleCategoryChange(
                                        e.target.value,
                                        editorState,
                                        props.editor,
                                        props.generalSettings,
                                        maybeUpdate,
                                        update,
                                        setExpandedLeaderboardRows,
                                        setFilters,
                                    )
                                }
                                label="Category"
                                list={[
                                    "run-editor-category-list",
                                    categoryNames,
                                ]}
                            />
                        </div>
                    </div>
                    <div className={classes.infoTableRow}>
                        <div className={classes.infoTableCell}>
                            <TextBox
                                value={editorState.offset}
                                onChange={(e) =>
                                    handleOffsetChange(
                                        e.target.value,
                                        props.editor,
                                        editorState,
                                        setEditorState,
                                        setOffsetIsValid,
                                    )
                                }
                                onBlur={(_) =>
                                    handleOffsetBlur(
                                        props.editor,
                                        props.runEditorUrlCache,
                                        setEditorState,
                                        setOffsetIsValid,
                                    )
                                }
                                invalid={!offsetIsValid}
                                label="Start Timer At"
                            />
                        </div>
                        <div className={classes.infoTableCell}>
                            <TextBox
                                value={editorState.attempts}
                                onChange={(e) =>
                                    handleAttemptsChange(
                                        e.target.value,
                                        props.editor,
                                        editorState,
                                        setEditorState,
                                        setAttemptCountIsValid,
                                    )
                                }
                                onBlur={(_) =>
                                    handleAttemptsBlur(
                                        props.editor,
                                        props.runEditorUrlCache,
                                        setEditorState,
                                        setAttemptCountIsValid,
                                    )
                                }
                                invalid={!attemptCountIsValid}
                                label="Attempts"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className={classes.bottomSection}>
                <div className={classes.sideButtonsOuter}>
                    <div className={classes.sideButtonsInner}>
                        <SideButtons
                            tab={tab}
                            category={category}
                            filters={filters}
                            editor={props.editor}
                            editorState={editorState}
                            generalSettings={props.generalSettings}
                            maybeUpdate={maybeUpdate}
                            update={update}
                            setExpandedLeaderboardRows={
                                setExpandedLeaderboardRows
                            }
                            setFilters={setFilters}
                        />
                    </div>
                </div>
                <div className={classes.editorGroup}>
                    <div className={classes.tabBar}>
                        <TabButtons
                            currentTab={tab}
                            editor={props.editor}
                            editorState={editorState}
                            update={update}
                            setExpandedLeaderboardRows={
                                setExpandedLeaderboardRows
                            }
                            setFilters={setFilters}
                        />
                    </div>
                    <TabContent
                        tab={tab}
                        category={category}
                        filters={filters}
                        expandedLeaderboardRows={expandedLeaderboardRows}
                        editor={props.editor}
                        editorState={editorState}
                        generalSettings={props.generalSettings}
                        runEditorUrlCache={props.runEditorUrlCache}
                        allComparisons={props.allComparisons}
                        allVariables={props.allVariables}
                        maybeUpdate={maybeUpdate}
                        update={update}
                    />
                </div>
            </div>
        </>
    );
}

function SideBar({ onClose }: { onClose: (save: boolean) => void }) {
    return (
        <>
            <h1>Splits Editor</h1>
            <hr />
            <div className={buttonGroupClasses.group}>
                <button onClick={(_) => onClose(true)}>
                    <Check strokeWidth={2.5} /> OK
                </button>
                <button onClick={(_) => onClose(false)}>
                    <X strokeWidth={2.5} /> Cancel
                </button>
            </div>
        </>
    );
}

function TabButtons({
    currentTab,
    editor,
    editorState,
    update,
    setExpandedLeaderboardRows,
    setFilters,
}: {
    currentTab: Tab;
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    update: () => void;
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void;
    setFilters: (filters: Filters) => void;
}) {
    const tabNames = {
        [Tab.RealTime]: "Real Time",
        [Tab.GameTime]: "Game Time",
        [Tab.Variables]: "Variables",
        [Tab.Rules]: "Rules",
        [Tab.Leaderboard]: "Leaderboard",
    };

    const visibleTabs = Object.values(Tab).filter((tab) =>
        shouldShowTab(tab as Tab, editorState),
    );
    return visibleTabs.map((tab) => {
        const buttonClassName =
            currentTab === tab ? buttonGroupClasses.pressed : undefined;

        return (
            <button
                className={buttonClassName}
                onClick={(_) =>
                    switchTab(
                        tab as Tab,
                        editor,
                        update,
                        setExpandedLeaderboardRows,
                        setFilters,
                    )
                }
            >
                {tabNames[tab as Tab]}
            </button>
        );
    });
}

function SideButtons({
    tab,
    category,
    filters,
    editor,
    editorState,
    generalSettings,
    maybeUpdate,
    update,
    setExpandedLeaderboardRows,
    setFilters,
}: {
    tab: Tab;
    category: Option<Category>;
    filters: Filters;
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    generalSettings: GeneralSettings;
    maybeUpdate: () => void;
    update: () => void;
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void;
    setFilters: (filters: Filters) => void;
}) {
    switch (tab) {
        case Tab.RealTime:
        case Tab.GameTime:
            return (
                <SegmentListButtons
                    editor={editor}
                    editorState={editorState}
                    update={update}
                />
            );
        case Tab.Variables:
            return (
                <VariablesButtons
                    generalSettings={generalSettings}
                    editor={editor}
                    editorState={editorState}
                    maybeUpdate={maybeUpdate}
                    update={update}
                    setExpandedLeaderboardRows={setExpandedLeaderboardRows}
                    setFilters={setFilters}
                />
            );
        case Tab.Rules:
            return (
                <AssociateRunButton
                    generalSettings={generalSettings}
                    editor={editor}
                    editorState={editorState}
                    maybeUpdate={maybeUpdate}
                    setExpandedLeaderboardRows={setExpandedLeaderboardRows}
                    setFilters={setFilters}
                />
            );
        case Tab.Leaderboard:
            return (
                <RunEditorLeaderboardButtons
                    category={category}
                    filters={filters}
                    generalSettings={generalSettings}
                    editor={editor}
                    editorState={editorState}
                    maybeUpdate={maybeUpdate}
                    update={update}
                    setExpandedLeaderboardRows={setExpandedLeaderboardRows}
                    setFilters={setFilters}
                />
            );
    }
}

function SegmentListButtons({
    editor,
    editorState,
    update,
}: {
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    update: () => void;
}) {
    return (
        <>
            <button
                onClick={(_) => {
                    editor.insertSegmentAbove();
                    update();
                }}
            >
                Insert Above
            </button>
            <button
                onClick={(_) => {
                    editor.insertSegmentBelow();
                    update();
                }}
            >
                Insert Below
            </button>
            <button
                onClick={(_) => {
                    editor.removeSegments();
                    update();
                }}
                disabled={!editorState.buttons.can_remove}
            >
                Remove Segment
            </button>
            <button
                onClick={(_) => {
                    editor.moveSegmentsUp();
                    update();
                }}
                disabled={!editorState.buttons.can_move_up}
            >
                Move Up
            </button>
            <button
                onClick={(_) => {
                    editor.moveSegmentsDown();
                    update();
                }}
                disabled={!editorState.buttons.can_move_down}
            >
                Move Down
            </button>
            <ComparisonsButton
                addComparison={() => addComparison(editor, update)}
                importComparison={() => importComparison(editor, update)}
                generateGoalComparison={() =>
                    generateGoalComparison(editor, update)
                }
                copyComparison={() => copyComparison(editor, update)}
            />
            <CleaningButton
                clearHistory={() => {
                    editor.clearHistory();
                    update();
                }}
                clearTimes={() => {
                    editor.clearTimes();
                    update();
                }}
                cleanSumOfBest={() => cleanSumOfBest(editor, update)}
            />
        </>
    );
}

function VariablesButtons({
    editor,
    editorState,
    generalSettings,
    maybeUpdate,
    update,
    setExpandedLeaderboardRows,
    setFilters,
}: {
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    generalSettings: GeneralSettings;
    maybeUpdate: () => void;
    update: () => void;
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void;
    setFilters: (filters: Filters) => void;
}) {
    return (
        <>
            <AssociateRunButton
                generalSettings={generalSettings}
                editor={editor}
                editorState={editorState}
                maybeUpdate={maybeUpdate}
                setExpandedLeaderboardRows={setExpandedLeaderboardRows}
                setFilters={setFilters}
            />
            <button onClick={(_) => addCustomVariable(editor, update)}>
                Add Variable
            </button>
        </>
    );
}

function AssociateRunButton({
    generalSettings,
    editor,
    editorState,
    maybeUpdate,
    setExpandedLeaderboardRows,
    setFilters,
}: {
    generalSettings: GeneralSettings;
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    maybeUpdate: () => void;
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void;
    setFilters: (filters: Filters) => void;
}) {
    if (generalSettings.speedrunComIntegration) {
        return (
            <button
                onClick={(_) =>
                    interactiveAssociateRunOrOpenPage(
                        editor,
                        editorState,
                        maybeUpdate,
                        setExpandedLeaderboardRows,
                        setFilters,
                    )
                }
            >
                {editorState.metadata.run_id !== ""
                    ? "Open PB Page"
                    : "Associate Run"}
            </button>
        );
    } else {
        return <></>;
    }
}

function RunEditorLeaderboardButtons({
    category,
    filters,
    generalSettings,
    editor,
    editorState,
    maybeUpdate,
    update,
    setExpandedLeaderboardRows,
    setFilters,
}: {
    category: Option<Category>;
    filters: Filters;
    generalSettings: GeneralSettings;
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    maybeUpdate: () => void;
    update: () => void;
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void;
    setFilters: (filters: Filters) => void;
}) {
    const gameInfo = getGameInfo(editorState.game);
    if (gameInfo === undefined) {
        return (
            <AssociateRunButton
                generalSettings={generalSettings}
                editor={editor}
                editorState={editorState}
                maybeUpdate={maybeUpdate}
                setExpandedLeaderboardRows={setExpandedLeaderboardRows}
                setFilters={setFilters}
            />
        );
    }

    return (
        <LeaderboardButtons
            gameInfo={gameInfo}
            category={category}
            filters={filters}
            speedrunComVariables={editorState.metadata.speedrun_com_variables}
            runId={editorState.metadata.run_id}
            updateFilters={() => {
                resetIndividualLeaderboardState(setExpandedLeaderboardRows);
                update();
            }}
            interactiveAssociateRunOrOpenPage={() =>
                interactiveAssociateRunOrOpenPage(
                    editor,
                    editorState,
                    maybeUpdate,
                    setExpandedLeaderboardRows,
                    setFilters,
                )
            }
        />
    );
}

function TabContent({
    tab,
    category,
    filters,
    expandedLeaderboardRows,
    editor,
    editorState,
    generalSettings,
    runEditorUrlCache,
    allComparisons,
    allVariables,
    maybeUpdate,
    update,
}: {
    tab: Tab;
    category: Option<Category>;
    filters: Filters;
    expandedLeaderboardRows: Map<number, boolean>;
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    generalSettings: GeneralSettings;
    runEditorUrlCache: UrlCache;
    allComparisons: string[];
    allVariables: Set<string>;
    maybeUpdate: () => void;
    update: () => LiveSplit.RunEditorStateJson;
}) {
    switch (tab) {
        case Tab.RealTime:
        case Tab.GameTime:
            return (
                <SegmentsTable
                    editor={editor}
                    editorState={editorState}
                    runEditorUrlCache={runEditorUrlCache}
                    maybeUpdate={maybeUpdate}
                    update={update}
                />
            );
        case Tab.Variables:
            return (
                <VariablesTab
                    editor={editor}
                    editorState={editorState}
                    category={category}
                    generalSettings={generalSettings}
                    runEditorUrlCache={runEditorUrlCache}
                    allComparisons={allComparisons}
                    allVariables={allVariables}
                    update={update}
                />
            );
        case Tab.Rules:
            return <RulesTab editorState={editorState} category={category} />;
        case Tab.Leaderboard:
            return (
                <LeaderboardTab
                    editorState={editorState}
                    category={category}
                    filters={filters}
                    expandedLeaderboardRows={expandedLeaderboardRows}
                    update={update}
                />
            );
    }
}

function SegmentsTable({
    editor,
    editorState,
    runEditorUrlCache,
    maybeUpdate,
    update,
}: {
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    runEditorUrlCache: UrlCache;
    maybeUpdate: () => void;
    update: () => LiveSplit.RunEditorStateJson;
}) {
    const [dragIndex, setDragIndex] = useState(0);
    const [rowState, setRowState] = useState<RowState>(() => ({
        bestSegmentTime: "",
        bestSegmentTimeChanged: false,
        comparisonTimes: [],
        comparisonTimesChanged: [],
        index: 0,
        segmentTime: "",
        segmentTimeChanged: false,
        splitTime: "",
        splitTimeChanged: false,
    }));

    return (
        <table className={`${classes.runEditorTab} ${classes.runEditorTable}`}>
            <thead className={classes.tableHeader}>
                <tr>
                    <th>Icon</th>
                    <th>Segment Name</th>
                    <th>Split Time</th>
                    <th>Segment Time</th>
                    <th>Best Segment</th>
                    {editorState.comparison_names.map(
                        (comparison, comparisonIndex) => {
                            return (
                                <CustomComparison
                                    comparison={comparison}
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData(
                                            "text/plain",
                                            "",
                                        );
                                        setDragIndex(comparisonIndex);
                                    }}
                                    onDragEnd={(_) => update()}
                                    onDrop={(e) => {
                                        if (e.stopPropagation) {
                                            e.stopPropagation();
                                        }
                                        editor.moveComparison(
                                            dragIndex,
                                            comparisonIndex,
                                        );
                                        // No update necessary, as we do it in onDragEnd.
                                        return false;
                                    }}
                                    renameComparison={() =>
                                        renameComparison(
                                            comparison,
                                            editor,
                                            update,
                                        )
                                    }
                                    copyComparison={() =>
                                        copyComparison(
                                            editor,
                                            update,
                                            comparison,
                                        )
                                    }
                                    removeComparison={() => {
                                        editor.removeComparison(comparison);
                                        update();
                                    }}
                                />
                            );
                        },
                    )}
                </tr>
            </thead>
            <tbody className={tableClasses.tableBody}>
                {editorState.segments.map((s, segmentIndex) => {
                    const segmentIcon = getSegmentIconUrl(
                        segmentIndex,
                        runEditorUrlCache,
                        editorState,
                    );

                    return (
                        <tr
                            key={segmentIndex}
                            className={
                                s.selected === "Selected" ||
                                s.selected === "Active"
                                    ? tableClasses.selected
                                    : ""
                            }
                            onClick={(e) =>
                                changeSegmentSelection(
                                    e,
                                    segmentIndex,
                                    editor,
                                    update,
                                )
                            }
                        >
                            <SegmentIcon
                                segmentIcon={segmentIcon}
                                changeSegmentIcon={() =>
                                    changeSegmentIcon(
                                        segmentIndex,
                                        editor,
                                        maybeUpdate,
                                    )
                                }
                                removeSegmentIcon={() =>
                                    removeSegmentIcon(
                                        segmentIndex,
                                        editor,
                                        update,
                                    )
                                }
                            />
                            <td>
                                <input
                                    className={tableClasses.textBox}
                                    type="text"
                                    value={s.name}
                                    onFocus={(_) =>
                                        focusSegment(
                                            segmentIndex,
                                            editor,
                                            rowState,
                                            setRowState,
                                            update,
                                        )
                                    }
                                    onChange={(e) => {
                                        editor.activeSetName(e.target.value);
                                        update();
                                    }}
                                />
                            </td>
                            <td>
                                <input
                                    className={`${tableClasses.number} ${tableClasses.textBox}`}
                                    type="text"
                                    value={
                                        segmentIndex === rowState.index &&
                                        rowState.splitTimeChanged
                                            ? rowState.splitTime
                                            : s.split_time
                                    }
                                    onFocus={(_) =>
                                        focusSegment(
                                            segmentIndex,
                                            editor,
                                            rowState,
                                            setRowState,
                                            update,
                                        )
                                    }
                                    onChange={(e) =>
                                        setRowState({
                                            ...rowState,
                                            splitTime: e.target.value,
                                            splitTimeChanged: true,
                                        })
                                    }
                                    onBlur={(_) =>
                                        handleSplitTimeBlur(
                                            editor,
                                            rowState,
                                            setRowState,
                                            update,
                                        )
                                    }
                                />
                            </td>
                            <td>
                                <input
                                    className={
                                        (segmentIndex !== rowState.index ||
                                            !rowState.segmentTimeChanged) &&
                                        s.segment_time === s.best_segment_time
                                            ? `${tableClasses.number} ${tableClasses.textBox} ${classes.bestSegmentTime}`
                                            : `${tableClasses.number} ${tableClasses.textBox}`
                                    }
                                    type="text"
                                    value={
                                        segmentIndex === rowState.index &&
                                        rowState.segmentTimeChanged
                                            ? rowState.segmentTime
                                            : s.segment_time
                                    }
                                    onFocus={(_) =>
                                        focusSegment(
                                            segmentIndex,
                                            editor,
                                            rowState,
                                            setRowState,
                                            update,
                                        )
                                    }
                                    onChange={(e) =>
                                        setRowState({
                                            ...rowState,
                                            segmentTime: e.target.value,
                                            segmentTimeChanged: true,
                                        })
                                    }
                                    onBlur={(_) =>
                                        handleSegmentTimeBlur(
                                            editor,
                                            rowState,
                                            setRowState,
                                            update,
                                        )
                                    }
                                />
                            </td>
                            <td>
                                <input
                                    className={`${tableClasses.number} ${tableClasses.textBox}`}
                                    type="text"
                                    value={
                                        segmentIndex === rowState.index &&
                                        rowState.bestSegmentTimeChanged
                                            ? rowState.bestSegmentTime
                                            : s.best_segment_time
                                    }
                                    onFocus={(_) =>
                                        focusSegment(
                                            segmentIndex,
                                            editor,
                                            rowState,
                                            setRowState,
                                            update,
                                        )
                                    }
                                    onChange={(e) =>
                                        setRowState({
                                            ...rowState,
                                            bestSegmentTime: e.target.value,
                                            bestSegmentTimeChanged: true,
                                        })
                                    }
                                    onBlur={(_) =>
                                        handleBestSegmentTimeBlur(
                                            editor,
                                            rowState,
                                            setRowState,
                                            update,
                                        )
                                    }
                                />
                            </td>
                            {editorState.segments[
                                segmentIndex
                            ].comparison_times.map(
                                (comparisonTime, comparisonIndex) => (
                                    <td>
                                        <input
                                            className={`${tableClasses.number} ${tableClasses.textBox}`}
                                            type="text"
                                            value={
                                                segmentIndex ===
                                                    rowState.index &&
                                                rowState.comparisonTimesChanged[
                                                    comparisonIndex
                                                ]
                                                    ? rowState.comparisonTimes[
                                                          comparisonIndex
                                                      ]
                                                    : comparisonTime
                                            }
                                            onFocus={(_) =>
                                                focusSegment(
                                                    segmentIndex,
                                                    editor,
                                                    rowState,
                                                    setRowState,
                                                    update,
                                                )
                                            }
                                            onChange={(e) => {
                                                const comparisonTimes = [
                                                    ...rowState.comparisonTimes,
                                                ];
                                                comparisonTimes[
                                                    comparisonIndex
                                                ] = e.target.value;
                                                const comparisonTimesChanged = [
                                                    ...rowState.comparisonTimesChanged,
                                                ];
                                                comparisonTimesChanged[
                                                    comparisonIndex
                                                ] = true;

                                                setRowState({
                                                    ...rowState,
                                                    comparisonTimes,
                                                    comparisonTimesChanged,
                                                });
                                            }}
                                            onBlur={(_) =>
                                                handleComparisonTimeBlur(
                                                    comparisonIndex,
                                                    editor,
                                                    editorState,
                                                    rowState,
                                                    setRowState,
                                                    update,
                                                )
                                            }
                                        />
                                    </td>
                                ),
                            )}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

function VariablesTab({
    editor,
    editorState,
    category,
    generalSettings,
    runEditorUrlCache,
    allComparisons,
    allVariables,
    update,
}: {
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    category: Option<Category>;
    generalSettings: GeneralSettings;
    runEditorUrlCache: UrlCache;
    allComparisons: string[];
    allVariables: Set<string>;
    update: () => void;
}) {
    const metadata = editorState.metadata;
    const gameInfo = getGameInfo(editorState.game);
    const fields: ExtendedSettingsDescriptionFieldJson[] = [];
    const speedrunComVariables: ExtendedSettingsDescriptionFieldJson[] = [];
    const customVariables: ExtendedSettingsDescriptionFieldJson[] = [];
    let regionOffset = -1;
    let platformOffset = -1;
    let emulatorOffset = -1;
    if (gameInfo !== undefined) {
        const regionList = [""];
        const platformList = [""];
        const allRegions = getRegions();
        const allPlatforms = getPlatforms();
        if (allRegions.size !== 0) {
            for (const regionId of gameInfo.regions) {
                const regionName = allRegions.get(regionId);
                if (regionName !== undefined) {
                    regionList.push(regionName);
                }
            }
        }
        if (allPlatforms.size !== 0) {
            for (const platformId of gameInfo.platforms) {
                const platformName = allPlatforms.get(platformId);
                if (platformName !== undefined) {
                    platformList.push(platformName);
                }
            }
        }
        const variables = expect(
            gameInfo.variables,
            "We need the variables to be embedded",
        );
        for (const variable of variables.data) {
            if (isVariableValidForCategory(variable, category)) {
                speedrunComVariables.push({
                    text: variable.name,
                    tooltip: "A variable on speedrun.com specific to the game.",
                    value: {
                        CustomCombobox: {
                            value:
                                metadata.speedrun_com_variables[
                                    variable.name
                                ] || "",
                            list: [
                                "",
                                ...Object.values(variable.values.values).map(
                                    (v) => v.label,
                                ),
                            ],
                            mandatory: variable.mandatory,
                        },
                    },
                });
            }
        }

        if (regionList.length > 1) {
            regionOffset = fields.length;
            fields.push({
                text: "Region",
                tooltip: "The region of the game that is being played.",
                value: {
                    CustomCombobox: {
                        value: metadata.region_name,
                        list: regionList,
                        mandatory: false,
                    },
                },
            });
        }
        if (platformList.length > 1) {
            platformOffset = fields.length;
            fields.push({
                text: "Platform",
                tooltip: "The platform that the game is being played on.",
                value: {
                    CustomCombobox: {
                        value: metadata.platform_name,
                        list: platformList,
                        mandatory: true,
                    },
                },
            });
        }
        if (gameInfo.ruleset["emulators-allowed"]) {
            emulatorOffset = fields.length;
            fields.push({
                text: "Uses Emulator",
                tooltip: "Whether an emulator is being used to play the game.",
                value: {
                    Bool: metadata.uses_emulator,
                },
            });
        }
    }

    for (const customVariableName of Object.keys(metadata.custom_variables)) {
        const customVariableValue =
            metadata.custom_variables[customVariableName];
        if (customVariableValue && customVariableValue.is_permanent) {
            customVariables.push({
                text: customVariableName,
                tooltip:
                    "A custom variable specified by you. These can be displayed with the text component.",
                value: {
                    RemovableString: customVariableValue.value,
                },
            });
        }
    }

    const speedrunComVariablesOffset = fields.length;
    fields.push(...speedrunComVariables);

    const customVariablesOffset = fields.length;
    fields.push(...customVariables);

    return (
        <div className={classes.runEditorTab}>
            {fields.length === 0 && (
                <table className={tableClasses.table}>
                    <tbody className={tableClasses.tableBody}>
                        <tr>
                            <td>
                                <p>
                                    {"There are currently no"}
                                    {generalSettings.speedrunComIntegration &&
                                        " Speedrun.com variables or"}
                                    {" custom variables for this game."}
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            )}
            <SettingsComponent
                context="run-editor-variables"
                factory={new JsonSettingValueFactory()}
                state={{ fields }}
                editorUrlCache={runEditorUrlCache}
                allComparisons={allComparisons}
                allVariables={allVariables}
                setValue={(index, value) => {
                    function unwrapString(
                        value: ExtendedSettingsDescriptionValueJson,
                    ): string {
                        if ("String" in value) {
                            return value.String;
                        } else {
                            throw new Error(
                                "Expected Setting value to be a string.",
                            );
                        }
                    }
                    function unwrapRemovableString(
                        value: ExtendedSettingsDescriptionValueJson,
                    ): string | null {
                        if ("RemovableString" in value) {
                            return value.RemovableString;
                        } else {
                            throw new Error(
                                "Expected Setting value to be a string.",
                            );
                        }
                    }
                    function unwrapBool(
                        value: ExtendedSettingsDescriptionValueJson,
                    ): boolean {
                        if ("Bool" in value) {
                            return value.Bool;
                        } else {
                            throw new Error(
                                "Expected Setting value to be a boolean.",
                            );
                        }
                    }
                    if (index === regionOffset) {
                        const region = unwrapString(value);
                        editor.setRegionName(region);
                    } else if (index === platformOffset) {
                        const platform = unwrapString(value);
                        editor.setPlatformName(platform);
                    } else if (index === emulatorOffset) {
                        const emulatorUsage = unwrapBool(value);
                        editor.setEmulatorUsage(emulatorUsage);
                    } else if (index < customVariablesOffset) {
                        const stringValue = unwrapString(value);
                        const key = speedrunComVariables[
                            index - speedrunComVariablesOffset
                        ].text as string;
                        if (stringValue !== "") {
                            editor.setSpeedrunComVariable(key, stringValue);
                        } else {
                            editor.removeSpeedrunComVariable(key);
                        }
                    } else {
                        const key = customVariables[
                            index - customVariablesOffset
                        ].text as string;
                        const stringValue = unwrapRemovableString(value);
                        if (stringValue !== null) {
                            editor.setCustomVariable(key, stringValue);
                        } else {
                            editor.removeCustomVariable(key);
                        }
                    }
                    update();
                }}
            />
        </div>
    );
}

function RulesTab({
    editorState,
    category,
}: {
    editorState: LiveSplit.RunEditorStateJson;
    category: Option<Category>;
}) {
    let rules = null;
    if (category != null && category.rules != null) {
        rules = <Markdown markdown={category.rules} speedrunCom />;
    }
    const gameInfo = getGameInfo(editorState.game);
    let gameRules = null;
    const subcategoryRules = [];
    if (gameInfo !== undefined) {
        const additionalRules = [];
        const ruleset = gameInfo.ruleset;
        if (ruleset["default-time"] !== "realtime") {
            additionalRules.push(
                ruleset["default-time"] === "realtime_noloads"
                    ? "are timed without the loading times"
                    : "are timed with Game Time",
            );
        }
        if (ruleset["require-video"]) {
            additionalRules.push("require video proof");
        }
        if (additionalRules.length !== 0) {
            gameRules = (
                <p style={{ fontStyle: "italic" }}>
                    Runs of this game {additionalRules.join(" and ")}.
                </p>
            );
        }
        const variables = expect(
            gameInfo.variables,
            "We need the variables to be embedded",
        );
        for (const variable of variables.data) {
            if (
                isVariableValidForCategory(variable, category) &&
                variable["is-subcategory"]
            ) {
                const currentValue =
                    editorState.metadata.speedrun_com_variables[variable.name];
                const foundValue = Object.values(variable.values.values).find(
                    (v) => v.label === currentValue,
                );
                if (foundValue?.rules != null) {
                    subcategoryRules.push(
                        <Markdown
                            markdown={`## ${foundValue.label} Rules\n${foundValue.rules}`}
                            speedrunCom
                        />,
                    );
                }
            }
        }
    }

    return (
        <div className={`${classes.runEditorTab} ${classes.rulesOuter}`}>
            <div
                // FIXME: Two divs?
                className={`${classes.rulesInner} ${markdownClasses.markdown}`}
            >
                {gameRules}
                {rules}
                {subcategoryRules}
            </div>
        </div>
    );
}

function LeaderboardTab({
    editorState,
    category,
    filters,
    expandedLeaderboardRows,
    update,
}: {
    editorState: LiveSplit.RunEditorStateJson;
    category: Option<Category>;
    filters: Filters;
    expandedLeaderboardRows: Map<number, boolean>;
    update: () => void;
}) {
    const leaderboard = getCurrentLeaderboard(category, editorState);
    if (leaderboard === undefined) {
        return <div />;
    }

    return (
        <Leaderboard
            game={editorState.game}
            category={category}
            filters={filters}
            leaderboard={leaderboard}
            expandedLeaderboardRows={expandedLeaderboardRows}
            toggleExpandLeaderboardRow={(i) =>
                toggleExpandLeaderboardRow(i, expandedLeaderboardRows, update)
            }
        />
    );
}

function associateRun<T>(
    editor: LiveSplit.RunEditorRefMut,
    gameName: string,
    categoryName: string,
    apiRun: Run<T>,
) {
    editor.setGameName(gameName);
    editor.setCategoryName(categoryName);
    const platform = getPlatforms().get(apiRun.system.platform);
    if (platform !== undefined) {
        editor.setPlatformName(platform);
    }
    const region = map(apiRun.system.region, (r) => getRegions().get(r));
    if (region !== undefined) {
        editor.setRegionName(region);
    }
    editor.setEmulatorUsage(apiRun.system.emulated);
    if (apiRun.comment != null) {
        editor.addCustomVariable("Comment");
        editor.setCustomVariable("Comment", apiRun.comment);
    }
    const videoUrl = apiRun?.videos?.links?.[0]?.uri;
    if (videoUrl !== undefined) {
        editor.addCustomVariable("Video URL");
        editor.setCustomVariable("Video URL", videoUrl);
    }
    const variables = getGameInfo(gameName)?.variables;
    if (variables !== undefined) {
        for (const [keyId, valueId] of Object.entries(apiRun.values)) {
            const variable = variables.data.find((v) => v.id === keyId);
            if (variable !== undefined) {
                const value = Object.entries(variable.values.values).find(
                    ([listValueId]) => listValueId === valueId,
                );
                if (value !== undefined) {
                    const valueName = value[1].label;
                    editor.setSpeedrunComVariable(variable.name, valueName);
                }
            }
        }
    }
    // Needs to be set last in order for it not to dissociate again
    editor.setRunId(apiRun.id);
}

function GameIcon({
    gameIcon,
    speedrunComIntegration,
    changeGameIcon,
    downloadBoxArt,
    downloadIcon,
    removeGameIcon,
}: {
    gameIcon: string | undefined;
    speedrunComIntegration: boolean;
    changeGameIcon: () => void;
    downloadBoxArt: () => void;
    downloadIcon: () => void;
    removeGameIcon: () => void;
}) {
    const [position, setPosition] = React.useState<Position | null>(null);

    return (
        <>
            <div
                className={classes.gameIconContainer}
                onClick={(e) => setPosition({ x: e.clientX, y: e.clientY })}
            >
                {gameIcon !== undefined && (
                    <img src={gameIcon} className={classes.gameIconImage} />
                )}
            </div>
            {position && (
                <ContextMenu
                    position={position}
                    onClose={() => setPosition(null)}
                >
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={changeGameIcon}
                    >
                        Set Icon
                        <span className={tooltipClasses.tooltipText}>
                            Allows you to choose an image file to set as the
                            game's icon. Certain file formats may not work
                            everywhere.
                        </span>
                    </MenuItem>
                    {speedrunComIntegration && (
                        <>
                            <MenuItem
                                className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                                onClick={downloadBoxArt}
                            >
                                Download Box Art
                                <span className={tooltipClasses.tooltipText}>
                                    Attempts to download the box art of the game
                                    from speedrun.com, to set as the game's
                                    icon.
                                </span>
                            </MenuItem>
                            <MenuItem
                                className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                                onClick={downloadIcon}
                            >
                                Download Icon
                                <span className={tooltipClasses.tooltipText}>
                                    Attempts to download the icon of the game
                                    from speedrun.com.
                                </span>
                            </MenuItem>
                        </>
                    )}
                    {gameIcon !== undefined && (
                        <MenuItem
                            className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                            onClick={removeGameIcon}
                        >
                            Remove Icon
                            <span className={tooltipClasses.tooltipText}>
                                Removes the icon of the game.
                            </span>
                        </MenuItem>
                    )}
                </ContextMenu>
            )}
        </>
    );
}

function CleaningButton({
    clearHistory,
    clearTimes,
    cleanSumOfBest,
}: {
    clearHistory: () => void;
    clearTimes: () => void;
    cleanSumOfBest: () => void;
}) {
    const [position, setPosition] = React.useState<Position | null>(null);

    return (
        <>
            <button
                onClick={(e) => setPosition({ x: e.clientX, y: e.clientY })}
            >
                Cleaning…
            </button>
            {position && (
                <ContextMenu
                    position={position}
                    onClose={() => setPosition(null)}
                >
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={clearHistory}
                    >
                        Clear Only History
                        <span className={tooltipClasses.tooltipText}>
                            Splits store the entire history of all runs,
                            including every segment time. This information is
                            used by various components. You can clear the
                            history with this. The personal best, the best
                            segment times, and the comparisons will not be
                            affected.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={clearTimes}
                    >
                        Clear All Times
                        <span className={tooltipClasses.tooltipText}>
                            This removes all the times from the splits,
                            including all the history, such that the splits are
                            completely empty, as if they were just created.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={cleanSumOfBest}
                    >
                        Clean Sum of Best
                        <span className={tooltipClasses.tooltipText}>
                            Allows you to interactively remove potential issues
                            in the segment history that lead to an inaccurate
                            Sum of Best. If you skip a split, whenever you will
                            do the next split, the combined segment time might
                            be faster than the sum of the individual best
                            segments. This will point out all such occurrences
                            and allow you to delete them individually if any of
                            them seem wrong.
                        </span>
                    </MenuItem>
                </ContextMenu>
            )}
        </>
    );
}

function ComparisonsButton({
    addComparison,
    importComparison,
    generateGoalComparison,
    copyComparison,
}: {
    addComparison: () => void;
    importComparison: () => void;
    generateGoalComparison: () => void;
    copyComparison: () => void;
}) {
    const [position, setPosition] = React.useState<Position | null>(null);

    return (
        <>
            <button
                onClick={(e) => setPosition({ x: e.clientX, y: e.clientY })}
            >
                Comparisons…
            </button>
            {position && (
                <ContextMenu
                    position={position}
                    onClose={() => setPosition(null)}
                >
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={addComparison}
                    >
                        Add Comparison
                        <span className={tooltipClasses.tooltipText}>
                            Adds a new custom comparison where you can store any
                            times that you would like.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={importComparison}
                    >
                        Import Comparison
                        <span className={tooltipClasses.tooltipText}>
                            Imports the Personal Best of a splits file you
                            provide as a comparison.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={generateGoalComparison}
                    >
                        Generate Goal Comparison
                        <span className={tooltipClasses.tooltipText}>
                            Generates a custom goal comparison based on a goal
                            time that you can specify. The comparison's times
                            are automatically balanced based on the segment
                            history such that it roughly represents what the
                            split times for the goal time would look like. Since
                            it is populated by the segment history, the goal
                            times are capped to a range between the sum of the
                            best segments and the sum of the worst segments. The
                            comparison is only populated for the selected timing
                            method. The other timing method's comparison times
                            are not modified by this, so you can generate it
                            again with the other timing method to generate the
                            comparison times for both timing methods.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={copyComparison}
                    >
                        Copy Comparison
                        <span className={tooltipClasses.tooltipText}>
                            Copies any existing comparison, including the
                            Personal Best or even any other automatically
                            provided comparison as a new custom comparison. You
                            could for example use this to keep the Latest Run
                            around as a comparison that exists for as long as
                            you want it to.
                        </span>
                    </MenuItem>
                </ContextMenu>
            )}
        </>
    );
}

function SegmentIcon({
    segmentIcon,
    changeSegmentIcon,
    removeSegmentIcon,
}: {
    segmentIcon: string | undefined;
    changeSegmentIcon: () => void;
    removeSegmentIcon: () => void;
}) {
    const [position, setPosition] = React.useState<Position | null>(null);

    return (
        <td
            className={classes.segmentIconContainer}
            onClick={(e) => {
                if (position !== null) {
                    return;
                }
                if (segmentIcon !== undefined) {
                    setPosition({ x: e.clientX, y: e.clientY });
                } else {
                    changeSegmentIcon();
                }
            }}
        >
            {segmentIcon !== undefined && <img src={segmentIcon} />}
            {position && (
                <ContextMenu
                    position={position}
                    onClose={() => setPosition(null)}
                >
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={changeSegmentIcon}
                    >
                        Set Icon
                        <span className={tooltipClasses.tooltipText}>
                            Allows you to choose an image file to set as the
                            segment's icon. Certain file formats may not work
                            everywhere.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={removeSegmentIcon}
                    >
                        Remove Icon
                        <span className={tooltipClasses.tooltipText}>
                            Removes the segment's icon.
                        </span>
                    </MenuItem>
                </ContextMenu>
            )}
        </td>
    );
}

function CustomComparison({
    comparison,
    onDragStart,
    onDragEnd,
    onDrop,
    renameComparison,
    copyComparison,
    removeComparison,
}: {
    comparison: string;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    renameComparison: () => void;
    copyComparison: () => void;
    removeComparison: () => void;
}) {
    const [position, setPosition] = React.useState<Position | null>(null);

    return (
        <th
            style={{
                cursor: "pointer",
            }}
            onClick={(e) => {
                if (position === null) {
                    setPosition({ x: e.clientX, y: e.clientY });
                }
            }}
            draggable
            onDragStart={onDragStart}
            onDragOver={(e) => {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                e.dataTransfer.dropEffect = "move";
            }}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
        >
            {comparison}
            {position && (
                <ContextMenu
                    position={position}
                    onClose={() => setPosition(null)}
                >
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={renameComparison}
                    >
                        Rename
                        <span className={tooltipClasses.tooltipText}>
                            Choose a new name for the custom comparison. There
                            are reserved names that can't be used. You also
                            can't have duplicate names.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={copyComparison}
                    >
                        Copy
                        <span className={tooltipClasses.tooltipText}>
                            Creates a copy of the custom comparison.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={removeComparison}
                    >
                        Remove
                        <span className={tooltipClasses.tooltipText}>
                            Removes the custom comparison.
                        </span>
                    </MenuItem>
                </ContextMenu>
            )}
        </th>
    );
}

function getCurrentCategoriesInfo(editorState: LiveSplit.RunEditorStateJson) {
    let categoryNames = ["Any%", "Low%", "100%"];
    let category = null;
    const categoryList = getCategories(editorState.game);
    if (categoryList !== undefined) {
        categoryNames = categoryList.map((c) => c.name);
        const categoryIndex = categoryNames.indexOf(editorState.category);
        if (categoryIndex >= 0) {
            category = categoryList[categoryIndex];
        }
    }
    return {
        category,
        categoryNames,
    };
}

async function changeGameIcon(
    editor: LiveSplit.RunEditorRefMut,
    maybeUpdate: () => void,
) {
    const maybeFile = await openFileAsArrayBuffer(FILE_EXT_IMAGES);
    if (maybeFile === undefined) {
        return;
    }
    if (maybeFile instanceof Error) {
        toast.error(`Failed to read the file: ${maybeFile.message}`);
        return;
    }
    const [file] = maybeFile;
    editor.setGameIconFromArray(new Uint8Array(file));
    maybeUpdate();
}

async function downloadBoxArt(
    abortController: AbortController,
    editor: LiveSplit.RunEditorRefMut,
    editorState: LiveSplit.RunEditorStateJson,
    maybeUpdate: () => void,
) {
    const signal = abortController.signal;
    try {
        const gameName = editorState.game;
        await downloadGameInfo(gameName);
        const game = getGameInfo(gameName);
        if (game !== undefined) {
            const uri = game.assets["cover-medium"].uri;
            if (
                uri.startsWith("https://") &&
                uri !== "https://www.speedrun.com/images/blankcover.png"
            ) {
                const buffer = await corsBustingFetch(uri, signal);
                if (editor.ptr === 0) {
                    return;
                }
                editor.setGameIconFromArray(new Uint8Array(buffer));
                maybeUpdate();
            } else {
                toast.error("The game doesn't have a box art.");
            }
        } else {
            toast.error("Couldn't find the game.");
        }
    } catch {
        if (signal.aborted) {
            return;
        }
        toast.error("Couldn't download the box art.");
    }
}

async function downloadIcon(
    abortController: AbortController,
    editor: LiveSplit.RunEditorRefMut,
    editorState: LiveSplit.RunEditorStateJson,
    maybeUpdate: () => void,
) {
    const signal = abortController.signal;
    try {
        const gameName = editorState.game;
        await downloadGameInfo(gameName);
        const game = getGameInfo(gameName);
        if (game !== undefined) {
            const uri = game.assets.icon.uri;
            if (
                uri.startsWith("https://") &&
                uri !== "https://www.speedrun.com/images/1st.png"
            ) {
                const buffer = await corsBustingFetch(uri, signal);
                if (editor.ptr === 0) {
                    return;
                }
                editor.setGameIconFromArray(new Uint8Array(buffer));
                maybeUpdate();
            } else {
                toast.error("The game doesn't have an icon.");
            }
        } else {
            toast.error("Couldn't find the game.");
        }
    } catch {
        if (signal.aborted) {
            return;
        }
        toast.error("Couldn't download the icon.");
    }
}

function removeGameIcon(editor: LiveSplit.RunEditorRefMut, update: () => void) {
    editor.setGameIconFromArray(new Uint8Array());
    update();
}

function handleGameChange(
    gameName: string,
    editor: LiveSplit.RunEditorRefMut,
    editorState: LiveSplit.RunEditorStateJson,
    generalSettings: GeneralSettings,
    maybeUpdate: () => void,
    update: (options?: { switchTab?: Tab; search?: boolean }) => void,
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void,
    setFilters: (filters: Filters) => void,
) {
    editor.clearMetadata();
    editor.setGameName(gameName);
    if (generalSettings.speedrunComIntegration) {
        refreshGameInfo(gameName, maybeUpdate);
        refreshCategoryList(gameName, maybeUpdate);
        refreshLeaderboard(gameName, editorState.category, maybeUpdate);
        resetTotalLeaderboardState(setExpandedLeaderboardRows, setFilters);
    }
    update({ search: true });
}

async function refreshGameInfo(gameName: string, maybeUpdate: () => void) {
    try {
        await downloadGameInfo(gameName);
        maybeUpdate();
    } catch {}
}

async function refreshCategoryList(gameName: string, maybeUpdate: () => void) {
    await downloadCategories(gameName);
    maybeUpdate();
}

async function refreshLeaderboard(
    gameName: string,
    categoryName: string,
    maybeUpdate: () => void,
) {
    await downloadLeaderboard(gameName, categoryName);
    maybeUpdate();
}

function resetIndividualLeaderboardState(
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void,
) {
    setExpandedLeaderboardRows(new Map());
}

function resetTotalLeaderboardState(
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void,
    setFilters: (filters: Filters) => void,
) {
    resetIndividualLeaderboardState(setExpandedLeaderboardRows);
    setFilters({ variables: new Map(), showObsolete: false });
}

function shouldShowTab(tab: Tab, editorState: LiveSplit.RunEditorStateJson) {
    if (tab === Tab.RealTime || tab === Tab.GameTime || tab === Tab.Variables) {
        return true;
    }

    const gameInfo = getGameInfo(editorState.game);
    if (gameInfo === undefined) {
        return false;
    }
    if (tab === Tab.Rules) {
        return true;
    }

    if (tab === Tab.Leaderboard) {
        const { category } = getCurrentCategoriesInfo(editorState);
        const leaderboard = getCurrentLeaderboard(category, editorState);
        if (leaderboard !== undefined) {
            return true;
        }
    }

    return false;
}

function getCurrentLeaderboard(
    category: Option<Category>,
    editorState: LiveSplit.RunEditorStateJson,
) {
    const categoryName = category?.name;
    if (categoryName) {
        return getLeaderboard(editorState.game, categoryName);
    }
    return undefined;
}

function handleCategoryChange(
    categoryName: string,
    editorState: LiveSplit.RunEditorStateJson,
    editor: LiveSplit.RunEditorRefMut,
    generalSettings: GeneralSettings,
    maybeUpdate: () => void,
    update: () => void,
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void,
    setFilters: (filters: Filters) => void,
) {
    clearCategorySpecificVariables(editorState, editor);
    editor.setCategoryName(categoryName);
    if (generalSettings.speedrunComIntegration) {
        refreshLeaderboard(editorState.game, categoryName, maybeUpdate);
        resetTotalLeaderboardState(setExpandedLeaderboardRows, setFilters);
    }
    update();
}

function clearCategorySpecificVariables(
    editorState: LiveSplit.RunEditorStateJson,
    editor: LiveSplit.RunEditorRefMut,
) {
    const categoryList = getCategories(editorState.game);
    if (categoryList !== undefined) {
        for (const category of categoryList) {
            if (category.name !== editorState.category) {
                continue;
            }
            const gameInfo = getGameInfo(editorState.game);
            if (gameInfo === undefined) {
                continue;
            }
            const variables = expect(
                gameInfo.variables,
                "We need the variables to be embedded",
            );
            for (const variable of variables.data) {
                if (
                    variable.category === category?.id &&
                    (variable.scope.type === "full-game" ||
                        variable.scope.type === "global")
                ) {
                    editor.removeSpeedrunComVariable(variable.name);
                }
            }
            break;
        }
    }
}

function handleOffsetChange(
    offset: string,
    editor: LiveSplit.RunEditorRefMut,
    editorState: LiveSplit.RunEditorStateJson,
    setEditorState: (state: LiveSplit.RunEditorStateJson) => void,
    setOffsetIsValid: (valid: boolean) => void,
) {
    const valid = editor.parseAndSetOffset(offset);
    setOffsetIsValid(valid);
    setEditorState({
        ...editorState,
        offset,
    });
}

function handleOffsetBlur(
    editor: LiveSplit.RunEditorRefMut,
    runEditorUrlCache: UrlCache,
    setEditorState: (state: LiveSplit.RunEditorStateJson) => void,
    setOffsetIsValid: (valid: boolean) => void,
) {
    setEditorState(editor.stateAsJson(runEditorUrlCache.imageCache));
    runEditorUrlCache.collect();
    setOffsetIsValid(true);
}

function handleAttemptsChange(
    attempts: string,
    editor: LiveSplit.RunEditorRefMut,
    editorState: LiveSplit.RunEditorStateJson,
    setEditorState: (state: LiveSplit.RunEditorStateJson) => void,
    setAttemptCountIsValid: (valid: boolean) => void,
) {
    const valid = editor.parseAndSetAttemptCount(attempts);
    setAttemptCountIsValid(valid);
    setEditorState({
        ...editorState,
        attempts: attempts as any, // FIXME: Fix type
    });
}

function handleAttemptsBlur(
    editor: LiveSplit.RunEditorRefMut,
    runEditorUrlCache: UrlCache,
    setEditorState: (state: LiveSplit.RunEditorStateJson) => void,
    setAttemptCountIsValid: (valid: boolean) => void,
) {
    setEditorState(editor.stateAsJson(runEditorUrlCache.imageCache));
    runEditorUrlCache.collect();
    setAttemptCountIsValid(true);
}

async function addComparison(
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
) {
    const [result, comparisonName] = await showDialog({
        title: "Add Comparison",
        description: "Specify the name of the comparison you want to add:",
        textInput: true,
        buttons: ["Add", "Cancel"],
    });

    if (result === 0) {
        const valid = editor.addComparison(comparisonName);
        if (valid) {
            update();
        } else {
            toast.error(
                "The comparison could not be added. It may be a duplicate or a reserved name.",
            );
        }
    }
}

async function importComparison(
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
) {
    const maybeFile = await openFileAsArrayBuffer(FILE_EXT_SPLITS);
    if (maybeFile === undefined) {
        return;
    }
    if (maybeFile instanceof Error) {
        toast.error(`Failed to read the file: ${maybeFile.message}`);
        return;
    }
    const [data, file] = maybeFile;
    using result = LiveSplit.Run.parseArray(new Uint8Array(data), "");
    if (!result.parsedSuccessfully()) {
        toast.error("Couldn't parse the splits.");
        return;
    }
    using run = result.unwrap();
    const [dialogResult, comparisonName] = await showDialog({
        title: "Import Comparison",
        description: "Specify the name of the comparison you want to import:",
        textInput: true,
        buttons: ["Import", "Cancel"],
        defaultText: file.name.replace(/\.[^/.]+$/, ""),
    });
    if (dialogResult !== 0) {
        return;
    }
    const valid = editor.importComparison(run, comparisonName);
    if (!valid) {
        toast.error(
            "The comparison could not be added. It may be a duplicate or a reserved name.",
        );
    } else {
        update();
    }
}

async function generateGoalComparison(
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
) {
    const [result, goalTime] = await showDialog({
        title: "Generate Goal Comparison",
        description: "Specify the time you want to achieve:",
        textInput: true,
        buttons: ["Generate", "Cancel"],
    });

    if (result === 0) {
        if (editor.parseAndGenerateGoalComparison(goalTime)) {
            update();
        } else {
            toast.error(
                "Failed generating the goal comparison. Make sure to specify a valid time.",
            );
        }
    }
}

async function copyComparison(
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
    comparisonToCopy?: string,
) {
    let comparison = comparisonToCopy;
    if (comparison === undefined) {
        const [result, comparisonName] = await showDialog({
            title: "Copy Comparison",
            description: "Specify the name of the comparison you want to copy:",
            textInput: true,
            buttons: ["Copy", "Cancel"],
        });
        if (result !== 0) {
            return;
        }
        comparison = comparisonName;
    }

    let newName: string | undefined;
    if (comparison.endsWith(" Copy")) {
        const before = comparison.substring(
            0,
            comparison.length - " Copy".length,
        );
        newName = `${before} Copy 2`;
    } else {
        const regexMatch = /^(.* Copy )(\d+)$/.exec(comparison);
        if (regexMatch !== null) {
            const copyNumber = Number(regexMatch[2]);
            newName = `${regexMatch[1]}${copyNumber + 1}`;
        } else {
            newName = `${comparison} Copy`;
        }
    }

    if (editor.copyComparison(comparison, newName)) {
        update();
    } else {
        toast.error(
            "Failed copying the comparison. The comparison may not exist.",
        );
    }
}

async function cleanSumOfBest(
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
) {
    const ptr = editor.ptr;
    {
        using cleaner = editor.cleanSumOfBest();
        editor.ptr = 0;
        let first = true;
        while (true) {
            using potentialCleanUp = cleaner.nextPotentialCleanUp();
            if (!potentialCleanUp) {
                if (first) {
                    toast.info("There is nothing to clean up.");
                }
                break;
            }
            first = false;
            const [result] = await showDialog({
                title: "Clean?",
                description: potentialCleanUp.message(),
                buttons: ["Yes", "No", "Cancel"],
            });
            if (result === 0) {
                cleaner.apply(potentialCleanUp);
            } else if (result === 2) {
                break;
            }
        }
    }
    editor.ptr = ptr;
    update();
}

function switchTab(
    tab: Tab,
    editor: LiveSplit.RunEditorRefMut,
    update: (options: { switchTab: Tab }) => void,
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void,
    setFilters: (filters: Filters) => void,
) {
    switch (tab) {
        case Tab.RealTime: {
            editor.selectTimingMethod(LiveSplit.TimingMethod.RealTime);
            break;
        }
        case Tab.GameTime: {
            editor.selectTimingMethod(LiveSplit.TimingMethod.GameTime);
            break;
        }
    }
    resetTotalLeaderboardState(setExpandedLeaderboardRows, setFilters);
    update({ switchTab: tab });
}

async function interactiveAssociateRunOrOpenPage(
    editor: LiveSplit.RunEditorRefMut,
    editorState: LiveSplit.RunEditorStateJson,
    maybeUpdate: () => void,
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void,
    setFilters: (filters: Filters) => void,
) {
    const currentRunId = editorState.metadata.run_id;
    if (currentRunId !== "") {
        window.open(`https://www.speedrun.com/run/${currentRunId}`, "_blank");
        return;
    }

    const [result, idOrUrl] = await showDialog({
        title: "Associate Run",
        description: "Specify the speedrun.com ID or URL of the run:",
        textInput: true,
        buttons: ["Associate", "Cancel"],
    });

    if (result !== 0) {
        return;
    }

    const pattern =
        /^(?:(?:https?:\/\/)?(?:www\.)?speedrun\.com\/(?:\w+\/)?run[s]?\/)?(\w+)$/;
    const matches = pattern.exec(idOrUrl);
    if (matches === null) {
        toast.error("Invalid speedrun.com ID or URL.");
        return;
    }
    const runId = matches[1];
    try {
        const run = await getRun(runId);
        const gameInfo = await downloadGameInfoByGameId(run.game);
        const categories = await downloadCategoriesByGameId(run.game);
        const category = expect(
            categories.find((c) => c.id === run.category),
            "The category doesn't belong to the game.",
        );

        const gameName = gameInfo.names.international;
        const categoryName = category.name;

        associateRun(editor, gameName, categoryName, run);

        refreshLeaderboard(gameName, categoryName, maybeUpdate);
        resetTotalLeaderboardState(setExpandedLeaderboardRows, setFilters);
        maybeUpdate();
    } catch {
        toast.error("Couldn't associate the run. The ID may be invalid.");
    }
}

async function addCustomVariable(
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
) {
    const [result, variableName] = await showDialog({
        title: "Add Variable",
        description: "Specify the name of the custom variable you want to add:",
        textInput: true,
        buttons: ["OK", "Cancel"],
    });
    if (result === 0) {
        editor.addCustomVariable(variableName);
        update();
    }
}

function getSegmentIconUrl(
    index: number,
    runEditorUrlCache: UrlCache,
    editorState: LiveSplit.RunEditorStateJson,
): string | undefined {
    return runEditorUrlCache.cache(editorState.segments[index].icon);
}

function changeSegmentSelection(
    event: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
    i: number,
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
) {
    if (!event.currentTarget.classList.contains(tableClasses.selected)) {
        editor.selectAdditionally(i);
    } else {
        editor.unselect(i);
    }
    update();
}

async function changeSegmentIcon(
    index: number,
    editor: LiveSplit.RunEditorRefMut,
    maybeUpdate: () => void,
) {
    editor.selectOnly(index);
    const maybeFile = await openFileAsArrayBuffer(FILE_EXT_IMAGES);
    if (maybeFile === undefined) {
        return;
    }
    if (maybeFile instanceof Error) {
        toast.error(`Failed to read the file: ${maybeFile.message}`);
        return;
    }
    const [file] = maybeFile;
    // FIXME: Editor may not exist anymore if we close the view. Happens in
    // other places too.
    editor.activeSetIconFromArray(new Uint8Array(file));
    maybeUpdate();
}

function removeSegmentIcon(
    index: number,
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
) {
    editor.selectOnly(index);
    editor.activeRemoveIcon();
    update();
}

function focusSegment(
    i: number,
    editor: LiveSplit.RunEditorRefMut,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => LiveSplit.RunEditorStateJson,
) {
    editor.selectOnly(i);
    const editorState = update();

    const comparisonTimes = editorState.segments[i].comparison_times;
    setRowState({
        ...rowState,
        splitTimeChanged: false,
        segmentTimeChanged: false,
        bestSegmentTimeChanged: false,
        comparisonTimes,
        comparisonTimesChanged: comparisonTimes.map(() => false),
        index: i,
    });
}

function handleSplitTimeBlur(
    editor: LiveSplit.RunEditorRefMut,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => void,
) {
    if (rowState.splitTimeChanged) {
        editor.activeParseAndSetSplitTime(rowState.splitTime);
        update();
        setRowState({ ...rowState, splitTimeChanged: false });
    }
}

function handleSegmentTimeBlur(
    editor: LiveSplit.RunEditorRefMut,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => void,
) {
    if (rowState.segmentTimeChanged) {
        editor.activeParseAndSetSegmentTime(rowState.segmentTime);
        update();
        setRowState({ ...rowState, segmentTimeChanged: false });
    }
}

function handleBestSegmentTimeBlur(
    editor: LiveSplit.RunEditorRefMut,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => void,
) {
    if (rowState.bestSegmentTimeChanged) {
        editor.activeParseAndSetBestSegmentTime(rowState.bestSegmentTime);
        update();
        setRowState({ ...rowState, bestSegmentTimeChanged: false });
    }
}

function handleComparisonTimeBlur(
    comparisonIndex: number,
    editor: LiveSplit.RunEditorRefMut,
    editorState: LiveSplit.RunEditorStateJson,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => void,
) {
    if (rowState.comparisonTimesChanged[comparisonIndex]) {
        const comparisonName = editorState.comparison_names[comparisonIndex];
        const comparisonTime = rowState.comparisonTimes[comparisonIndex];
        editor.activeParseAndSetComparisonTime(comparisonName, comparisonTime);
        update();

        const comparisonTimesChanged = [...rowState.comparisonTimesChanged];
        comparisonTimesChanged[comparisonIndex] = false;
        setRowState({ ...rowState, comparisonTimesChanged });
    }
}

async function renameComparison(
    comparison: string,
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
) {
    const [result, newName] = await showDialog({
        title: "Rename Comparison",
        description: "Specify the new name of the comparison:",
        textInput: true,
        buttons: ["Rename", "Cancel"],
        defaultText: comparison,
    });

    if (result === 0) {
        const valid = editor.renameComparison(comparison, newName);
        if (valid) {
            update();
        } else {
            toast.error(
                "The comparison could not be renamed. It may be a duplicate or a reserved name.",
            );
        }
    }
}

function toggleExpandLeaderboardRow(
    rowIndex: number,
    expandedLeaderboardRows: Map<number, boolean>,
    update: () => void,
) {
    if (expandedLeaderboardRows.get(rowIndex) === true) {
        expandedLeaderboardRows.set(rowIndex, false);
    } else {
        expandedLeaderboardRows.set(rowIndex, true);
    }
    update();
}

async function refreshGameList(
    maybeUpdate: (options: { search: boolean }) => void,
) {
    const before = gameListLength();
    await downloadGameList();
    const after = gameListLength();
    if (before !== after) {
        maybeUpdate({ search: true });
    }
}

async function refreshPlatformList(maybeUpdate: () => void) {
    const before = platformListLength();
    await downloadPlatformList();
    const after = platformListLength();
    if (before !== after) {
        maybeUpdate();
    }
}

async function refreshRegionList(maybeUpdate: () => void) {
    const before = regionListLength();
    await downloadRegionList();
    const after = regionListLength();
    if (before !== after) {
        maybeUpdate();
    }
}
