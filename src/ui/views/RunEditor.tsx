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
import { Label, orAutoLang, resolve } from "../../localization";

import * as classes from "../../css/RunEditor.module.css";
import * as buttonGroupClasses from "../../css/ButtonGroup.module.css";
import * as tableClasses from "../../css/Table.module.css";
import * as markdownClasses from "../../css/Markdown.module.css";
import * as tooltipClasses from "../../css/Tooltip.module.css";

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
        <SideBar
            onClose={(save) => props.callbacks.closeRunEditor(save)}
            lang={props.generalSettings.lang}
        />,
    );
}

function View(props: Props & { abortController: AbortController }) {
    const lang = props.generalSettings.lang;
    const [editorState, setEditorState] = useState(() => {
        const state = props.editor.stateAsJson(
            props.runEditorUrlCache.imageCache,
            orAutoLang(lang),
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
        const showTab = shouldShowTab(intendedTab, editorState, lang);
        setTab(showTab ? intendedTab : Tab.RealTime);

        const state: LiveSplit.RunEditorStateJson = props.editor.stateAsJson(
            props.runEditorUrlCache.imageCache,
            orAutoLang(lang),
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

    const { category, categoryNames } = getCurrentCategoriesInfo(
        editorState,
        lang,
    );

    return (
        <>
            <div className={classes.runEditorInfo}>
                <GameIcon
                    gameIcon={gameIcon}
                    speedrunComIntegration={
                        props.generalSettings.speedrunComIntegration
                    }
                    changeGameIcon={() =>
                        changeGameIcon(props.editor, maybeUpdate, lang)
                    }
                    downloadBoxArt={() =>
                        downloadBoxArt(
                            props.abortController,
                            props.editor,
                            editorState,
                            maybeUpdate,
                            lang,
                        )
                    }
                    downloadIcon={() =>
                        downloadIcon(
                            props.abortController,
                            props.editor,
                            editorState,
                            maybeUpdate,
                            lang,
                        )
                    }
                    removeGameIcon={() => removeGameIcon(props.editor, update)}
                    lang={lang}
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
                                label={resolve(Label.Game, lang)}
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
                                        lang,
                                    )
                                }
                                label={resolve(Label.Category, lang)}
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
                                        lang,
                                    )
                                }
                                onBlur={(_) =>
                                    handleOffsetBlur(
                                        props.editor,
                                        props.runEditorUrlCache,
                                        setEditorState,
                                        setOffsetIsValid,
                                        lang,
                                    )
                                }
                                invalid={!offsetIsValid}
                                label={resolve(Label.StartTimerAt, lang)}
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
                                        lang,
                                    )
                                }
                                invalid={!attemptCountIsValid}
                                label={resolve(Label.Attempts, lang)}
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
                            lang={lang}
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
                            lang={lang}
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
                        lang={lang}
                    />
                </div>
            </div>
        </>
    );
}

function SideBar({
    onClose,
    lang,
}: {
    onClose: (save: boolean) => void;
    lang: LiveSplit.Language | undefined;
}) {
    return (
        <>
            <h1>{resolve(Label.SplitsEditor, lang)}</h1>
            <hr />
            <div className={buttonGroupClasses.group}>
                <button onClick={(_) => onClose(true)}>
                    <Check strokeWidth={2.5} />
                    {resolve(Label.Ok, lang)}
                </button>
                <button onClick={(_) => onClose(false)}>
                    <X strokeWidth={2.5} />
                    {resolve(Label.Cancel, lang)}
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
    lang,
}: {
    currentTab: Tab;
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    update: () => void;
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void;
    setFilters: (filters: Filters) => void;
    lang: LiveSplit.Language | undefined;
}) {
    const tabNames = {
        [Tab.RealTime]: resolve(Label.RealTime, lang),
        [Tab.GameTime]: resolve(Label.GameTime, lang),
        [Tab.Variables]: resolve(Label.Variables, lang),
        [Tab.Rules]: resolve(Label.Rules, lang),
        [Tab.Leaderboard]: resolve(Label.Leaderboard, lang),
    };

    const visibleTabs = Object.values(Tab).filter((tab) =>
        shouldShowTab(tab as Tab, editorState, lang),
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
    lang,
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
    lang: LiveSplit.Language | undefined;
}) {
    switch (tab) {
        case Tab.RealTime:
        case Tab.GameTime:
            return (
                <SegmentListButtons
                    editor={editor}
                    editorState={editorState}
                    update={update}
                    lang={lang}
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
                    lang={lang}
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
                    lang={lang}
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
                    lang={lang}
                />
            );
    }
}

function SegmentListButtons({
    editor,
    editorState,
    update,
    lang,
}: {
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    update: () => void;
    lang: LiveSplit.Language | undefined;
}) {
    return (
        <>
            <button
                onClick={(_) => {
                    editor.insertSegmentAbove();
                    update();
                }}
            >
                {resolve(Label.InsertAbove, lang)}
            </button>
            <button
                onClick={(_) => {
                    editor.insertSegmentBelow();
                    update();
                }}
            >
                {resolve(Label.InsertBelow, lang)}
            </button>
            <button
                onClick={(_) => {
                    editor.removeSegments();
                    update();
                }}
                disabled={!editorState.buttons.can_remove}
            >
                {resolve(Label.RemoveSegment, lang)}
            </button>
            <button
                onClick={(_) => {
                    editor.moveSegmentsUp();
                    update();
                }}
                disabled={!editorState.buttons.can_move_up}
            >
                {resolve(Label.MoveUp, lang)}
            </button>
            <button
                onClick={(_) => {
                    editor.moveSegmentsDown();
                    update();
                }}
                disabled={!editorState.buttons.can_move_down}
            >
                {resolve(Label.MoveDown, lang)}
            </button>
            <ComparisonsButton
                addComparison={() => addComparison(editor, update, lang)}
                importComparison={() => importComparison(editor, update, lang)}
                generateGoalComparison={() =>
                    generateGoalComparison(editor, update, lang)
                }
                copyComparison={() =>
                    copyComparison(editor, update, lang, undefined)
                }
                lang={lang}
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
                cleanSumOfBest={() => cleanSumOfBest(editor, update, lang)}
                lang={lang}
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
    lang,
}: {
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    generalSettings: GeneralSettings;
    maybeUpdate: () => void;
    update: () => void;
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void;
    setFilters: (filters: Filters) => void;
    lang: LiveSplit.Language | undefined;
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
                lang={lang}
            />
            <button onClick={(_) => addCustomVariable(editor, update, lang)}>
                {resolve(Label.AddVariable, lang)}
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
    lang,
}: {
    generalSettings: GeneralSettings;
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    maybeUpdate: () => void;
    setExpandedLeaderboardRows: (map: Map<number, boolean>) => void;
    setFilters: (filters: Filters) => void;
    lang: LiveSplit.Language | undefined;
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
                        lang,
                    )
                }
            >
                {editorState.metadata.run_id !== ""
                    ? resolve(Label.OpenPbPage, lang)
                    : resolve(Label.AssociateRun, lang)}
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
    lang,
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
    lang: LiveSplit.Language | undefined;
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
                lang={lang}
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
                    lang,
                )
            }
            lang={lang}
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
    lang,
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
    lang: LiveSplit.Language | undefined;
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
                    lang={lang}
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
                    lang={lang}
                />
            );
        case Tab.Rules:
            return (
                <RulesTab
                    editorState={editorState}
                    category={category}
                    lang={lang}
                />
            );
        case Tab.Leaderboard:
            return (
                <LeaderboardTab
                    editorState={editorState}
                    category={category}
                    filters={filters}
                    expandedLeaderboardRows={expandedLeaderboardRows}
                    update={update}
                    lang={lang}
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
    lang,
}: {
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    runEditorUrlCache: UrlCache;
    maybeUpdate: () => void;
    update: () => LiveSplit.RunEditorStateJson;
    lang: LiveSplit.Language | undefined;
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
                    <th>{resolve(Label.Icon, lang)}</th>
                    <th>{resolve(Label.SegmentName, lang)}</th>
                    <th>{resolve(Label.SplitTime, lang)}</th>
                    <th>{resolve(Label.SegmentTime, lang)}</th>
                    <th>{resolve(Label.BestSegment, lang)}</th>
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
                                            lang,
                                        )
                                    }
                                    copyComparison={() =>
                                        copyComparison(
                                            editor,
                                            update,
                                            lang,
                                            comparison,
                                        )
                                    }
                                    removeComparison={() => {
                                        editor.removeComparison(comparison);
                                        update();
                                    }}
                                    lang={lang}
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
                                        lang,
                                    )
                                }
                                removeSegmentIcon={() =>
                                    removeSegmentIcon(
                                        segmentIndex,
                                        editor,
                                        update,
                                    )
                                }
                                lang={lang}
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
                                            lang,
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
                                            lang,
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
                                            lang,
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
                                                    lang,
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
    lang,
}: {
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    category: Option<Category>;
    generalSettings: GeneralSettings;
    runEditorUrlCache: UrlCache;
    allComparisons: string[];
    allVariables: Set<string>;
    update: () => void;
    lang: LiveSplit.Language | undefined;
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
            lang,
        );
        for (const variable of variables.data) {
            if (isVariableValidForCategory(variable, category)) {
                speedrunComVariables.push({
                    text: variable.name,
                    tooltip: resolve(Label.SpeedrunComVariableTooltip, lang),
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
                text: resolve(Label.Region, lang),
                tooltip: resolve(Label.RegionDescription, lang),
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
                text: resolve(Label.Platform, lang),
                tooltip: resolve(Label.PlatformDescription, lang),
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
                text: resolve(Label.UsesEmulator, lang),
                tooltip: resolve(Label.UsesEmulatorDescription, lang),
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
                tooltip: resolve(Label.CustomVariableTooltip, lang),
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

    const noVariablesMessage = generalSettings.speedrunComIntegration
        ? resolve(Label.NoVariablesWithSpeedrunCom, lang)
        : resolve(Label.NoVariables, lang);

    return (
        <div className={classes.runEditorTab}>
            {fields.length === 0 && (
                <table className={tableClasses.table}>
                    <tbody className={tableClasses.tableBody}>
                        <tr>
                            <td>
                                <p>{noVariablesMessage}</p>
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
                lang={lang}
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
    lang,
}: {
    editorState: LiveSplit.RunEditorStateJson;
    category: Option<Category>;
    lang: LiveSplit.Language | undefined;
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
                    ? resolve(Label.TimedWithoutLoads, lang)
                    : resolve(Label.TimedWithGameTime, lang),
            );
        }
        if (ruleset["require-video"]) {
            additionalRules.push(resolve(Label.RequireVideoProof, lang));
        }
        if (additionalRules.length !== 0) {
            const joiner = ` ${resolve(Label.And, lang)} `;
            gameRules = (
                <p style={{ fontStyle: "italic" }}>
                    {resolve(Label.RunsOfThisGamePrefix, lang)}
                    {additionalRules.join(joiner)}
                    {resolve(Label.RunsOfThisGameSuffix, lang)}
                </p>
            );
        }
        const variables = expect(
            gameInfo.variables,
            "We need the variables to be embedded",
            lang,
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
                            markdown={`## ${foundValue.label} ${resolve(
                                Label.Rules,
                                lang,
                            )}\n${foundValue.rules}`}
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
    lang,
}: {
    editorState: LiveSplit.RunEditorStateJson;
    category: Option<Category>;
    filters: Filters;
    expandedLeaderboardRows: Map<number, boolean>;
    update: () => void;
    lang: LiveSplit.Language | undefined;
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
            lang={lang}
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
    lang,
}: {
    gameIcon: string | undefined;
    speedrunComIntegration: boolean;
    changeGameIcon: () => void;
    downloadBoxArt: () => void;
    downloadIcon: () => void;
    removeGameIcon: () => void;
    lang: LiveSplit.Language | undefined;
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
                        lang={lang}
                    >
                        {resolve(Label.SetIcon, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.SetIconDescription, lang)}
                        </span>
                    </MenuItem>
                    {speedrunComIntegration && (
                        <>
                            <MenuItem
                                className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                                onClick={downloadBoxArt}
                                lang={lang}
                            >
                                {resolve(Label.DownloadBoxArt, lang)}
                                <span className={tooltipClasses.tooltipText}>
                                    {resolve(
                                        Label.DownloadBoxArtDescription,
                                        lang,
                                    )}
                                </span>
                            </MenuItem>
                            <MenuItem
                                className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                                onClick={downloadIcon}
                                lang={lang}
                            >
                                {resolve(Label.DownloadIcon, lang)}
                                <span className={tooltipClasses.tooltipText}>
                                    {resolve(
                                        Label.DownloadIconDescription,
                                        lang,
                                    )}
                                </span>
                            </MenuItem>
                        </>
                    )}
                    {gameIcon !== undefined && (
                        <MenuItem
                            className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                            onClick={removeGameIcon}
                            lang={lang}
                        >
                            {resolve(Label.RemoveIcon, lang)}
                            <span className={tooltipClasses.tooltipText}>
                                {resolve(Label.RemoveIconDescription, lang)}
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
    lang,
}: {
    clearHistory: () => void;
    clearTimes: () => void;
    cleanSumOfBest: () => void;
    lang: LiveSplit.Language | undefined;
}) {
    const [position, setPosition] = React.useState<Position | null>(null);

    return (
        <>
            <button
                onClick={(e) => setPosition({ x: e.clientX, y: e.clientY })}
            >
                {resolve(Label.CleaningMenu, lang)}
            </button>
            {position && (
                <ContextMenu
                    position={position}
                    onClose={() => setPosition(null)}
                >
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={clearHistory}
                        lang={lang}
                    >
                        {resolve(Label.ClearOnlyHistory, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.ClearOnlyHistoryDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={clearTimes}
                        lang={lang}
                    >
                        {resolve(Label.ClearAllTimes, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.ClearAllTimesDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={cleanSumOfBest}
                        lang={lang}
                    >
                        {resolve(Label.CleanSumOfBest, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.CleanSumOfBestDescription, lang)}
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
    lang,
}: {
    addComparison: () => void;
    importComparison: () => void;
    generateGoalComparison: () => void;
    copyComparison: () => void;
    lang: LiveSplit.Language | undefined;
}) {
    const [position, setPosition] = React.useState<Position | null>(null);

    return (
        <>
            <button
                onClick={(e) => setPosition({ x: e.clientX, y: e.clientY })}
            >
                {resolve(Label.ComparisonsMenu, lang)}
            </button>
            {position && (
                <ContextMenu
                    position={position}
                    onClose={() => setPosition(null)}
                >
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={addComparison}
                        lang={lang}
                    >
                        {resolve(Label.AddComparison, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.AddComparisonDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={importComparison}
                        lang={lang}
                    >
                        {resolve(Label.ImportComparison, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.ImportComparisonDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={generateGoalComparison}
                        lang={lang}
                    >
                        {resolve(Label.GenerateGoalComparison, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(
                                Label.GenerateGoalComparisonDescription,
                                lang,
                            )}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={copyComparison}
                        lang={lang}
                    >
                        {resolve(Label.CopyComparison, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.CopyComparisonDescription, lang)}
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
    lang,
}: {
    segmentIcon: string | undefined;
    changeSegmentIcon: () => void;
    removeSegmentIcon: () => void;
    lang: LiveSplit.Language | undefined;
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
                        lang={lang}
                    >
                        {resolve(Label.SetSegmentIcon, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.SetSegmentIconDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={removeSegmentIcon}
                        lang={lang}
                    >
                        {resolve(Label.RemoveSegmentIcon, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.RemoveSegmentIconDescription, lang)}
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
    lang,
}: {
    comparison: string;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    renameComparison: () => void;
    copyComparison: () => void;
    removeComparison: () => void;
    lang: LiveSplit.Language | undefined;
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
                        lang={lang}
                    >
                        {resolve(Label.Rename, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.RenameDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={copyComparison}
                        lang={lang}
                    >
                        {resolve(Label.CopyAction, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.CopyDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={removeComparison}
                        lang={lang}
                    >
                        {resolve(Label.Remove, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.RemoveDescription, lang)}
                        </span>
                    </MenuItem>
                </ContextMenu>
            )}
        </th>
    );
}

function getCurrentCategoriesInfo(
    editorState: LiveSplit.RunEditorStateJson,
    lang: LiveSplit.Language | undefined,
) {
    let categoryNames = [
        resolve(Label.AnyPercent, lang),
        resolve(Label.LowPercent, lang),
        resolve(Label.HundredPercent, lang),
    ];
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
    lang: LiveSplit.Language | undefined,
) {
    const maybeFile = await openFileAsArrayBuffer(FILE_EXT_IMAGES);
    if (maybeFile === undefined) {
        return;
    }
    if (maybeFile instanceof Error) {
        toast.error(
            `${resolve(Label.FailedToReadFile, lang)} ${maybeFile.message}`,
        );
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
    lang: LiveSplit.Language | undefined,
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
                toast.error(resolve(Label.NoBoxArt, lang));
            }
        } else {
            toast.error(resolve(Label.GameNotFound, lang));
        }
    } catch {
        if (signal.aborted) {
            return;
        }
        toast.error(resolve(Label.DownloadBoxArtError, lang));
    }
}

async function downloadIcon(
    abortController: AbortController,
    editor: LiveSplit.RunEditorRefMut,
    editorState: LiveSplit.RunEditorStateJson,
    maybeUpdate: () => void,
    lang: LiveSplit.Language | undefined,
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
                toast.error(resolve(Label.NoGameIcon, lang));
            }
        } else {
            toast.error(resolve(Label.GameNotFound, lang));
        }
    } catch {
        if (signal.aborted) {
            return;
        }
        toast.error(resolve(Label.DownloadIconError, lang));
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

function shouldShowTab(
    tab: Tab,
    editorState: LiveSplit.RunEditorStateJson,
    lang: LiveSplit.Language | undefined,
) {
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
        const { category } = getCurrentCategoriesInfo(editorState, lang);
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
    lang: LiveSplit.Language | undefined,
) {
    clearCategorySpecificVariables(editorState, editor, lang);
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
    lang: LiveSplit.Language | undefined,
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
                lang,
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
    lang: LiveSplit.Language | undefined,
) {
    const valid = editor.parseAndSetOffset(offset, orAutoLang(lang));
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
    lang: LiveSplit.Language | undefined,
) {
    setEditorState(
        editor.stateAsJson(runEditorUrlCache.imageCache, orAutoLang(lang)),
    );
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
    lang: LiveSplit.Language | undefined,
) {
    setEditorState(
        editor.stateAsJson(runEditorUrlCache.imageCache, orAutoLang(lang)),
    );
    runEditorUrlCache.collect();
    setAttemptCountIsValid(true);
}

async function addComparison(
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
    lang: LiveSplit.Language | undefined,
) {
    const [result, comparisonName] = await showDialog({
        title: resolve(Label.AddComparison, lang),
        description: resolve(Label.AddComparisonPrompt, lang),
        textInput: true,
        buttons: [resolve(Label.Add, lang), resolve(Label.Cancel, lang)],
    });

    if (result === 0) {
        const valid = editor.addComparison(comparisonName);
        if (valid) {
            update();
        } else {
            toast.error(resolve(Label.ComparisonAddError, lang));
        }
    }
}

async function importComparison(
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
    lang: LiveSplit.Language | undefined,
) {
    const maybeFile = await openFileAsArrayBuffer(FILE_EXT_SPLITS);
    if (maybeFile === undefined) {
        return;
    }
    if (maybeFile instanceof Error) {
        toast.error(
            `${resolve(Label.FailedToReadFile, lang)} ${maybeFile.message}`,
        );
        return;
    }
    const [data, file] = maybeFile;
    using result = LiveSplit.Run.parseArray(new Uint8Array(data), "");
    if (!result.parsedSuccessfully()) {
        toast.error(resolve(Label.CouldNotParseSplits, lang));
        return;
    }
    using run = result.unwrap();
    const [dialogResult, comparisonName] = await showDialog({
        title: resolve(Label.ImportComparison, lang),
        description: resolve(Label.ImportComparisonPrompt, lang),
        textInput: true,
        buttons: [resolve(Label.Import, lang), resolve(Label.Cancel, lang)],
        defaultText: file.name.replace(/\.[^/.]+$/, ""),
    });
    if (dialogResult !== 0) {
        return;
    }
    const valid = editor.importComparison(run, comparisonName);
    if (!valid) {
        toast.error(resolve(Label.ComparisonAddError, lang));
    } else {
        update();
    }
}

async function generateGoalComparison(
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
    lang: LiveSplit.Language | undefined,
) {
    const [result, goalTime] = await showDialog({
        title: resolve(Label.GenerateGoalComparison, lang),
        description: resolve(Label.GenerateGoalComparisonPrompt, lang),
        textInput: true,
        buttons: [resolve(Label.Generate, lang), resolve(Label.Cancel, lang)],
    });

    if (result === 0) {
        if (editor.parseAndGenerateGoalComparison(goalTime, orAutoLang(lang))) {
            update();
        } else {
            toast.error(resolve(Label.GenerateGoalComparisonError, lang));
        }
    }
}

async function copyComparison(
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
    lang: LiveSplit.Language | undefined,
    comparisonToCopy?: string,
) {
    let comparison = comparisonToCopy;
    if (comparison === undefined) {
        const [result, comparisonName] = await showDialog({
            title: resolve(Label.CopyComparison, lang),
            description: resolve(Label.CopyComparisonPrompt, lang),
            textInput: true,
            buttons: [
                resolve(Label.CopyAction, lang),
                resolve(Label.Cancel, lang),
            ],
        });
        if (result !== 0) {
            return;
        }
        comparison = comparisonName;
    }

    let newName: string | undefined;
    const copyLabel = resolve(Label.ACopy, lang);
    const localizedSuffix = ` ${copyLabel}`;
    const legacySuffix = " Copy";
    const suffixes =
        localizedSuffix === legacySuffix
            ? [localizedSuffix]
            : [localizedSuffix, legacySuffix];

    const suffixMatch = suffixes.find((suffix) => comparison.endsWith(suffix));
    if (suffixMatch !== undefined) {
        const before = comparison.substring(
            0,
            comparison.length - suffixMatch.length,
        );
        newName = `${before}${suffixMatch} 2`;
    } else {
        const numberMatch = suffixes
            .map((suffix) => new RegExp(`^(.*${escapeRegExp(suffix)} )(\\d+)$`))
            .map((regex) => regex.exec(comparison))
            .find((match) => match !== null);

        if (numberMatch !== undefined && numberMatch !== null) {
            const copyNumber = Number(numberMatch[2]);
            newName = `${numberMatch[1]}${copyNumber + 1}`;
        } else {
            newName = `${comparison}${localizedSuffix}`;
        }
    }

    if (editor.copyComparison(comparison, newName)) {
        update();
    } else {
        toast.error(resolve(Label.CopyComparisonError, lang));
    }
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function cleanSumOfBest(
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
    lang: LiveSplit.Language | undefined,
) {
    const ptr = editor.ptr;
    {
        using cleaner = editor.cleanSumOfBest(orAutoLang(lang));
        editor.ptr = 0;
        let first = true;
        while (true) {
            using potentialCleanUp = cleaner.nextPotentialCleanUp();
            if (!potentialCleanUp) {
                if (first) {
                    toast.info(resolve(Label.NothingToCleanUp, lang));
                }
                break;
            }
            first = false;
            const [result] = await showDialog({
                title: resolve(Label.CleanPrompt, lang),
                description: potentialCleanUp.message(),
                buttons: [
                    resolve(Label.Yes, lang),
                    resolve(Label.No, lang),
                    resolve(Label.Cancel, lang),
                ],
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
    lang: LiveSplit.Language | undefined,
) {
    const currentRunId = editorState.metadata.run_id;
    if (currentRunId !== "") {
        window.open(`https://www.speedrun.com/run/${currentRunId}`, "_blank");
        return;
    }

    const [result, idOrUrl] = await showDialog({
        title: resolve(Label.AssociateRun, lang),
        description: resolve(Label.AssociateRunPrompt, lang),
        textInput: true,
        buttons: [resolve(Label.Associate, lang), resolve(Label.Cancel, lang)],
    });

    if (result !== 0) {
        return;
    }

    const pattern =
        /^(?:(?:https?:\/\/)?(?:www\.)?speedrun\.com\/(?:\w+\/)?run[s]?\/)?(\w+)$/;
    const matches = pattern.exec(idOrUrl);
    if (matches === null) {
        toast.error(resolve(Label.InvalidSpeedrunUrl, lang));
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
            lang,
        );

        const gameName = gameInfo.names.international;
        const categoryName = category.name;

        associateRun(editor, gameName, categoryName, run);

        refreshLeaderboard(gameName, categoryName, maybeUpdate);
        resetTotalLeaderboardState(setExpandedLeaderboardRows, setFilters);
        maybeUpdate();
    } catch {
        toast.error(resolve(Label.AssociateRunError, lang));
    }
}

async function addCustomVariable(
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
    lang: LiveSplit.Language | undefined,
) {
    const [result, variableName] = await showDialog({
        title: resolve(Label.AddVariable, lang),
        description: resolve(Label.AddVariablePrompt, lang),
        textInput: true,
        buttons: [resolve(Label.Ok, lang), resolve(Label.Cancel, lang)],
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
    lang: LiveSplit.Language | undefined,
) {
    editor.selectOnly(index);
    const maybeFile = await openFileAsArrayBuffer(FILE_EXT_IMAGES);
    if (maybeFile === undefined) {
        return;
    }
    if (maybeFile instanceof Error) {
        toast.error(
            `${resolve(Label.FailedToReadFile, lang)} ${maybeFile.message}`,
        );
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
    lang: LiveSplit.Language | undefined,
) {
    if (rowState.splitTimeChanged) {
        editor.activeParseAndSetSplitTime(rowState.splitTime, orAutoLang(lang));
        update();
        setRowState({ ...rowState, splitTimeChanged: false });
    }
}

function handleSegmentTimeBlur(
    editor: LiveSplit.RunEditorRefMut,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => void,
    lang: LiveSplit.Language | undefined,
) {
    if (rowState.segmentTimeChanged) {
        editor.activeParseAndSetSegmentTime(
            rowState.segmentTime,
            orAutoLang(lang),
        );
        update();
        setRowState({ ...rowState, segmentTimeChanged: false });
    }
}

function handleBestSegmentTimeBlur(
    editor: LiveSplit.RunEditorRefMut,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => void,
    lang: LiveSplit.Language | undefined,
) {
    if (rowState.bestSegmentTimeChanged) {
        editor.activeParseAndSetBestSegmentTime(
            rowState.bestSegmentTime,
            orAutoLang(lang),
        );
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
    lang: LiveSplit.Language | undefined,
) {
    if (rowState.comparisonTimesChanged[comparisonIndex]) {
        const comparisonName = editorState.comparison_names[comparisonIndex];
        const comparisonTime = rowState.comparisonTimes[comparisonIndex];
        editor.activeParseAndSetComparisonTime(
            comparisonName,
            comparisonTime,
            orAutoLang(lang),
        );
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
    lang: LiveSplit.Language | undefined,
) {
    const [result, newName] = await showDialog({
        title: resolve(Label.RenameComparison, lang),
        description: resolve(Label.RenameComparisonPrompt, lang),
        textInput: true,
        buttons: [resolve(Label.Rename, lang), resolve(Label.Cancel, lang)],
        defaultText: comparison,
    });

    if (result === 0) {
        const valid = editor.renameComparison(comparison, newName);
        if (valid) {
            update();
        } else {
            toast.error(resolve(Label.ComparisonRenameError, lang));
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
