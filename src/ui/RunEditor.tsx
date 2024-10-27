import * as React from "react";
import { ContextMenu, ContextMenuTrigger, MenuItem } from "react-contextmenu";
import * as LiveSplit from "../livesplit-core";
import { FILE_EXT_IMAGES, FILE_EXT_SPLITS, openFileAsArrayBuffer } from "../util/FileUtil";
import { TextBox } from "./TextBox";
import { toast } from "react-toastify";
import {
    downloadGameList, searchGames, getCategories, downloadCategories,
    downloadLeaderboard, getLeaderboard, downloadPlatformList, getPlatforms,
    downloadRegionList, getRegions, downloadGameInfo, getGameInfo, downloadGameInfoByGameId, downloadCategoriesByGameId,
    gameListLength,
    platformListLength,
    regionListLength,
} from "../api/GameList";
import { Category, Run, Variable, getRun } from "../api/SpeedrunCom";
import { Option, expect, map, assert } from "../util/OptionUtil";
import { downloadById } from "../util/SplitsIO";
import { formatLeaderboardTime } from "../util/TimeUtil";
import { resolveEmbed } from "./Embed";
import {
    SettingsComponent, JsonSettingValueFactory, ExtendedSettingsDescriptionFieldJson,
    ExtendedSettingsDescriptionValueJson,
} from "./Settings";
import { renderMarkdown, replaceFlag } from "../util/Markdown";
import { UrlCache } from "../util/UrlCache";
import { GeneralSettings } from "./MainSettings";
import { showDialog } from "./Dialog";
import { corsBustingFetch } from "../platform/CORS";

import "../css/RunEditor.scss";

export interface Props {
    editor: LiveSplit.RunEditor,
    callbacks: Callbacks,
    runEditorUrlCache: UrlCache,
    allComparisons: string[],
    allVariables: Set<string>,
    generalSettings: GeneralSettings,
}
export interface State {
    editor: LiveSplit.RunEditorStateJson,
    foundGames: string[],
    offsetIsValid: boolean,
    attemptCountIsValid: boolean,
    rowState: RowState,
    tab: Tab,
    abortController: AbortController,
}

interface Callbacks {
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
    closeRunEditor(save: boolean): void,
}

interface RowState {
    splitTime: string,
    splitTimeChanged: boolean,
    segmentTime: string,
    segmentTimeChanged: boolean,
    bestSegmentTime: string,
    bestSegmentTimeChanged: boolean,
    comparisonTimes: string[],
    comparisonTimesChanged: boolean[],
    index: number,
}

enum Tab {
    RealTime,
    GameTime,
    Variables,
    Rules,
    Leaderboard,
}

interface Filters {
    region?: string,
    platform?: string,
    isEmulated?: boolean,
    showObsolete: boolean,
    variables: Map<string, string>,
}

export class RunEditor extends React.Component<Props, State> {
    private dragIndex: number = 0;
    private expandedLeaderboardRows: Map<number, boolean> = new Map();
    private filters: Filters = { variables: new Map(), showObsolete: false };

    constructor(props: Props) {
        super(props);

        const state: LiveSplit.RunEditorStateJson = props.editor.stateAsJson(props.runEditorUrlCache.imageCache) as LiveSplit.RunEditorStateJson;
        const foundGames = searchGames(state.game);
        props.runEditorUrlCache.collect();

        this.state = {
            attemptCountIsValid: true,
            editor: state,
            foundGames,
            offsetIsValid: true,
            rowState: {
                bestSegmentTime: "",
                bestSegmentTimeChanged: false,
                comparisonTimes: [],
                comparisonTimesChanged: [],
                index: 0,
                segmentTime: "",
                segmentTimeChanged: false,
                splitTime: "",
                splitTimeChanged: false,
            },
            tab: state.timing_method === "RealTime" ? Tab.RealTime : Tab.GameTime,
            abortController: new AbortController(),
        };

        if (props.generalSettings.speedrunComIntegration) {
            this.refreshGameList();
            this.refreshGameInfo(state.game);
            this.refreshCategoryList(state.game);
            this.refreshLeaderboard(state.game, state.category);
            this.refreshPlatformList();
            this.refreshRegionList();
        }
    }

    public render() {
        const renderedView = this.renderView();
        const sidebarContent = this.renderSidebarContent();
        return this.props.callbacks.renderViewWithSidebar(renderedView, sidebarContent);
    }

    private renderView() {
        const gameIcon = this.getGameIcon();

        let gameIconContextTrigger: any = null;
        const gameIconToggleMenu = (e: any) => {
            if (gameIconContextTrigger) {
                gameIconContextTrigger.handleContextClick(e);
            }
        };

        const tab = this.getTab();

        const { category, categoryNames } = this.getCurrentCategoriesInfo();

        return (
            <div className="run-editor">
                <div className="run-editor-info">
                    <div
                        className="game-icon-container"
                        onClick={(e) => {
                            gameIconToggleMenu(e);
                        }}
                    >
                        <ContextMenuTrigger
                            id="game-icon-context-menu"
                            ref={(c) => gameIconContextTrigger = c}
                        >
                            {
                                gameIcon !== undefined &&
                                <img
                                    src={gameIcon}
                                    className="game-icon-image"
                                />
                            }
                        </ContextMenuTrigger>
                    </div>
                    <ContextMenu id="game-icon-context-menu">
                        <MenuItem className="tooltip" onClick={(_) => this.changeGameIcon()}>
                            Set Icon
                            <span className="tooltip-text">
                                Allows you to choose an image file to set as the game's icon. Certain file formats may not work everywhere.
                            </span>
                        </MenuItem>
                        {
                            this.props.generalSettings.speedrunComIntegration && <>
                                <MenuItem className="tooltip" onClick={(_) => this.downloadBoxArt()}>
                                    Download Box Art
                                    <span className="tooltip-text">
                                        Attempts to download the box art of the game from speedrun.com, to set as the game's icon.
                                    </span>
                                </MenuItem>
                                <MenuItem className="tooltip" onClick={(_) => this.downloadIcon()}>
                                    Download Icon
                                    <span className="tooltip-text">
                                        Attempts to download the icon of the game from speedrun.com.
                                    </span>
                                </MenuItem>
                            </>
                        }
                        {
                            gameIcon !== undefined &&
                            <MenuItem className="tooltip" onClick={(_) => this.removeGameIcon()}>
                                Remove Icon
                                <span className="tooltip-text">
                                    Removes the icon of the game.
                                </span>
                            </MenuItem>
                        }
                    </ContextMenu>
                    <div className="run-editor-info-table">
                        <div className="info-table-row">
                            <div className="info-table-cell">
                                <TextBox
                                    className="run-editor-game"
                                    value={this.state.editor.game}
                                    onChange={(e) => this.handleGameChange(e)}
                                    label="Game"
                                    list={[
                                        "run-editor-game-list",
                                        this.state.foundGames,
                                    ]}
                                />
                            </div>
                            <div className="info-table-cell">
                                <TextBox
                                    className="run-editor-category"
                                    value={this.state.editor.category}
                                    onChange={(e) => this.handleCategoryChange(e)}
                                    label="Category"
                                    list={[
                                        "run-editor-category-list",
                                        categoryNames,
                                    ]}
                                />
                            </div>
                        </div>
                        <div className="info-table-row">
                            <div className="info-table-cell">
                                <TextBox
                                    className="run-editor-offset"
                                    value={this.state.editor.offset}
                                    onChange={(e) => this.handleOffsetChange(e)}
                                    onBlur={(_) => this.handleOffsetBlur()}
                                    small
                                    invalid={!this.state.offsetIsValid}
                                    label="Start Timer At"
                                />
                            </div>
                            <div className="info-table-cell">
                                <TextBox
                                    className="run-editor-attempts"
                                    value={this.state.editor.attempts}
                                    onChange={(e) => this.handleAttemptsChange(e)}
                                    onBlur={(_) => this.handleAttemptsBlur()}
                                    small
                                    invalid={!this.state.attemptCountIsValid}
                                    label="Attempts"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bottom-section">
                    <div className="side-buttons">
                        {this.renderSideButtons(tab, category)}
                    </div>
                    <div className="editor-group">
                        <div className="tab-bar">
                            {this.renderTabButtons(tab)}
                        </div>
                        {this.renderTab(tab, category)}
                    </div>
                </div>
            </div >
        );
    }

    private close(save: boolean) {
        this.state.abortController.abort();
        this.props.callbacks.closeRunEditor(save);
    }

    private renderSidebarContent() {
        return (
            <div className="sidebar-buttons">
                <h1>Splits Editor</h1>
                <hr />
                <div className="small">
                    <button
                        className="toggle-left"
                        onClick={(_) => this.close(true)}
                    >
                        <i className="fa fa-check" aria-hidden="true" /> OK
                    </button>
                    <button
                        className="toggle-right"
                        onClick={(_) => this.close(false)}
                    >
                        <i className="fa fa-times" aria-hidden="true" /> Cancel
                    </button>
                </div>
            </div>
        );
    }

    private renderTabButtons(currentTab: Tab) {
        const tabNames = {
            [Tab.RealTime]: "Real Time",
            [Tab.GameTime]: "Game Time",
            [Tab.Variables]: "Variables",
            [Tab.Rules]: "Rules",
            [Tab.Leaderboard]: "Leaderboard",
        };

        const visibleTabs = Object.values(Tab).filter((tab) => this.shouldShowTab(tab as Tab));
        return visibleTabs.map((tab, index) => {
            let toggleClassName = "toggle-middle";
            if (index === 0) {
                toggleClassName = "toggle-left";
            } else if (index === visibleTabs.length - 1) {
                toggleClassName = "toggle-right";
            }

            const buttonClassName = currentTab === tab ? " button-pressed" : "";

            return (<button
                className={toggleClassName + buttonClassName}
                onClick={(_) => this.switchTab(tab as Tab)}
            >
                {tabNames[tab as Tab]}
            </button>);
        });
    }

    private renderSegmentListButtons(): JSX.Element {
        let otherButtonContextTrigger: any = null;
        const otherButtonToggleMenu = (e: any) => {
            if (otherButtonContextTrigger) {
                otherButtonContextTrigger.handleContextClick(e);
            }
        };

        let comparisonsButtonContextTrigger: any = null;
        const comparisonsButtonToggleMenu = (e: any) => {
            if (comparisonsButtonContextTrigger) {
                comparisonsButtonContextTrigger.handleContextClick(e);
            }
        };

        return (
            <div className="btn-group">
                <button onClick={(_) => this.insertSegmentAbove()}>
                    Insert Above
                </button>
                <button onClick={(_) => this.insertSegmentBelow()}>
                    Insert Below
                </button>
                <button
                    onClick={(_) => this.removeSegments()}
                    disabled={!this.state.editor.buttons.can_remove}
                >
                    Remove Segment
                </button>
                <button
                    onClick={(_) => this.moveSegmentsUp()}
                    disabled={!this.state.editor.buttons.can_move_up}
                >
                    Move Up
                </button>
                <button
                    onClick={(_) => this.moveSegmentsDown()}
                    disabled={!this.state.editor.buttons.can_move_down}
                >
                    Move Down
                </button>
                <button onClick={(e) => comparisonsButtonToggleMenu(e)}>
                    <ContextMenuTrigger
                        id="comparisons-button-context-menu"
                        ref={(c) => comparisonsButtonContextTrigger = c}
                    >
                        Comparisons…
                    </ContextMenuTrigger>
                </button>
                <button onClick={(e) => otherButtonToggleMenu(e)}>
                    <ContextMenuTrigger
                        id="other-button-context-menu"
                        ref={(c) => otherButtonContextTrigger = c}
                    >
                        Cleaning…
                    </ContextMenuTrigger>
                </button>
                <ContextMenu id="comparisons-button-context-menu">
                    <MenuItem className="tooltip" onClick={(_) => this.addComparison()}>
                        Add Comparison
                        <span className="tooltip-text">
                            Adds a new custom comparison where you can store any times that you would like.
                        </span>
                    </MenuItem>
                    <MenuItem className="tooltip" onClick={(_) => this.importComparison()}>
                        Import Comparison
                        <span className="tooltip-text">
                            Imports the Personal Best of a splits file you provide as a comparison.
                        </span>
                    </MenuItem>
                    <MenuItem className="tooltip" onClick={(_) => this.generateGoalComparison()}>
                        Generate Goal Comparison
                        <span className="tooltip-text">
                            Generates a custom goal comparison based on a goal time that you can specify. The comparison's times are automatically balanced based on the segment history such that it roughly represents what the split times for the goal time would look like. Since it is populated by the segment history, the goal times are capped to a range between the sum of the best segments and the sum of the worst segments. The comparison is only populated for the selected timing method. The other timing method's comparison times are not modified by this, so you can generate it again with the other timing method to generate the comparison times for both timing methods.
                        </span>
                    </MenuItem>
                    <MenuItem className="tooltip" onClick={(_) => this.copyComparison()}>
                        Copy Comparison
                        <span className="tooltip-text">
                            Copies any existing comparison, including the Personal Best or even any other automatically provided comparison as a new custom comparison. You could for example use this to keep the Latest Run around as a comparison that exists for as long as you want it to.
                        </span>
                    </MenuItem>
                </ContextMenu>
                <ContextMenu id="other-button-context-menu">
                    <MenuItem className="tooltip" onClick={(_) => this.clearHistory()}>
                        Clear Only History
                        <span className="tooltip-text">
                            Splits store the entire history of all runs, including every segment time. This information is used by various components. You can clear the history with this. The personal best, the best segment times, and the comparisons will not be affected.
                        </span>
                    </MenuItem>
                    <MenuItem className="tooltip" onClick={(_) => this.clearTimes()}>
                        Clear All Times
                        <span className="tooltip-text">
                            This removes all the times from the splits, including all the history, such that the splits are completely empty, as if they were just created.
                        </span>
                    </MenuItem>
                    <MenuItem className="tooltip" onClick={(_) => this.cleanSumOfBest()}>
                        Clean Sum of Best
                        <span className="tooltip-text">
                            Allows you to interactively remove potential issues in the segment history that lead to an inaccurate Sum of Best. If you skip a split, whenever you will do the next split, the combined segment time might be faster than the sum of the individual best segments. This will point out all such occurrences and allow you to delete them individually if any of them seem wrong.
                        </span>
                    </MenuItem>
                </ContextMenu>
            </div>
        );
    }

    private renderAssociateRunButton(): JSX.Element {
        if (this.props.generalSettings.speedrunComIntegration) {
            return (
                <button onClick={(_) => this.interactiveAssociateRunOrOpenPage()}>
                    {this.state.editor.metadata.run_id !== "" ? "Open PB Page" : "Associate Run"}
                </button>
            );
        } else {
            return <></>;
        }
    }

    private renderRulesButtons(): JSX.Element {
        return (
            <div className="btn-group">
                {this.renderAssociateRunButton()}
            </div>
        );
    }

    private renderVariablesButtons(): JSX.Element {
        return (
            <div className="btn-group">
                {this.renderAssociateRunButton()}
                <button onClick={(_) => this.addCustomVariable()}>
                    Add Variable
                </button>
            </div>
        );
    }

    private async addCustomVariable() {
        const [result, variableName] = await showDialog({
            title: "Add Variable",
            description: "Specify the name of the custom variable you want to add:",
            textInput: true,
            buttons: ["OK", "Cancel"],
        });
        if (result === 0) {
            this.props.editor.addCustomVariable(variableName);
            this.update();
        }
    }

    private renderSideButtons(tab: Tab, category: Option<Category>): JSX.Element {
        switch (tab) {
            case Tab.RealTime:
            case Tab.GameTime:
                return this.renderSegmentListButtons();
            case Tab.Variables:
                return this.renderVariablesButtons();
            case Tab.Rules:
                return this.renderRulesButtons();
            case Tab.Leaderboard:
                return this.renderLeaderboardButtons(category);
        }
    }

    private renderTab(tab: Tab, category: Option<Category>): JSX.Element {
        switch (tab) {
            case Tab.RealTime:
            case Tab.GameTime:
                return this.renderSegmentsTable();
            case Tab.Variables:
                return this.renderVariablesTab(category);
            case Tab.Rules:
                return this.renderRulesTab(category);
            case Tab.Leaderboard:
                return this.renderLeaderboard(category);
        }
    }

    private renderLeaderboardButtons(category: Option<Category>): JSX.Element {
        const gameInfo = getGameInfo(this.state.editor.game);
        if (gameInfo === undefined) {
            return this.renderRulesButtons();
        }

        const regionList = [""];
        const platformList = [""];
        const allRegions = getRegions();
        const allPlatforms = getPlatforms();

        const filterList = [];
        const subcategoryBoxes = [];

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

        if (regionList.length > 2) {
            filterList.push(<tr><td>Region:</td></tr>);
            filterList.push(
                <tr>
                    <td>
                        <select
                            value={this.filters.region ?? ""}
                            style={{
                                width: "100%",
                            }}
                            onChange={(e) => {
                                this.filters.region = e.target.value;
                                this.updateFilters();
                            }}
                        >
                            {regionList.map((v) => <option value={v}>{v}</option>)}
                        </select>
                    </td>
                </tr>,
            );
        }

        if (platformList.length > 2) {
            filterList.push(<tr><td>Platform:</td></tr>);
            filterList.push(
                <tr>
                    <td>
                        <select
                            value={this.filters.platform ?? ""}
                            style={{
                                width: "100%",
                            }}
                            onChange={(e) => {
                                this.filters.platform = e.target.value;
                                this.updateFilters();
                            }}
                        >
                            {platformList.map((v) => <option value={v}>{v}</option>)}
                        </select>
                    </td>
                </tr>,
            );
        }

        if (gameInfo.ruleset["emulators-allowed"]) {
            filterList.push(<tr><td>Emulator:</td></tr>);
            filterList.push(
                <tr>
                    <td>
                        <select
                            value={
                                this.filters.isEmulated === true
                                    ? "Yes"
                                    : this.filters.isEmulated === false
                                        ? "No"
                                        : ""
                            }
                            style={{
                                width: "100%",
                            }}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === "Yes") {
                                    this.filters.isEmulated = true;
                                } else if (value === "No") {
                                    this.filters.isEmulated = false;
                                } else {
                                    this.filters.isEmulated = undefined;
                                }
                                this.updateFilters();
                            }}
                        >
                            {["", "Yes", "No"].map((v) => <option value={v}>{v}</option>)}
                        </select>
                    </td>
                </tr>,
            );
        }

        const variables = expect(gameInfo.variables, "We need the variables to be embedded");
        for (const variable of variables.data) {
            if (this.variableIsValidForCategory(variable, category)) {
                if (variable["is-subcategory"]) {
                    let currentFilterValue = this.filters.variables.get(variable.name);
                    if (currentFilterValue === undefined) {
                        const runValue = this.state.editor.metadata.speedrun_com_variables[variable.name];
                        if (runValue !== undefined) {
                            currentFilterValue = runValue;
                            this.filters.variables.set(variable.name, currentFilterValue);
                        } else {
                            const defaultValueId = variable.values.default;
                            if (defaultValueId != null) {
                                currentFilterValue = variable.values.values[defaultValueId].label;
                                this.filters.variables.set(variable.name, currentFilterValue);
                            }
                        }
                    }
                    subcategoryBoxes.push(
                        <table className="table filter-table subcategory-table">
                            <thead className="table-header">
                                <tr>
                                    <th>{variable.name}</th>
                                </tr>
                            </thead>
                            <tbody className="table-body">
                                {Object.values(variable.values.values).map(({ label }) => {
                                    const isSelected = currentFilterValue === label;
                                    return (
                                        <tr>
                                            <td
                                                className={isSelected ? "selected" : ""}
                                                onClick={(_) => {
                                                    this.filters.variables.set(variable.name, isSelected ? "" : label);
                                                    this.updateFilters();
                                                }}
                                            >
                                                {label}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>,
                    );
                } else {
                    filterList.push(<tr><td>{variable.name}:</td></tr>);
                    filterList.push(
                        <tr>
                            <td>
                                <select
                                    value={this.filters.variables.get(variable.name) ?? ""}
                                    style={{
                                        width: "100%",
                                    }}
                                    onChange={(e) => {
                                        this.filters.variables.set(variable.name, e.target.value);
                                        this.updateFilters();
                                    }}
                                >
                                    <option value="" />
                                    {Object.values(variable.values.values).map(
                                        ({ label }) => <option value={label}>{label}</option>,
                                    )}
                                </select>
                            </td>
                        </tr>,
                    );
                }
            }
        }

        filterList.push(<tr><td>Obsolete Runs:</td></tr>);
        filterList.push(
            <tr>
                <td>
                    <select
                        value={this.filters.showObsolete ? "Shown" : "Hidden"}
                        style={{
                            width: "100%",
                        }}
                        onChange={(e) => {
                            const value = e.target.value;
                            this.filters.showObsolete = value === "Shown";
                            this.updateFilters();
                        }}
                    >
                        {["Shown", "Hidden"].map((v) => <option value={v}>{v}</option>)}
                    </select>
                </td>
            </tr>,
        );

        return (
            <div className="btn-group">
                <button
                    onClick={(_) => {
                        if (category != null) {
                            window.open(`${gameInfo.weblink}?x=${category.id}`, "_blank");
                        }
                    }}
                    disabled={category == null}
                >
                    Open Leaderboard
                </button>
                <button onClick={(_) => this.interactiveAssociateRunOrOpenPage()}>
                    {this.state.editor.metadata.run_id !== "" ? "Open PB Page" : "Associate Run"}
                </button>
                {subcategoryBoxes}
                <table className="table filter-table">
                    <thead className="table-header">
                        <tr>
                            <th>Filters</th>
                        </tr>
                    </thead>
                    <tbody className="table-body">
                        {filterList}
                    </tbody>
                </table>
            </div>
        );
    }

    private variableIsValidForCategory(variable: Variable, category: Option<Category>) {
        return (variable.category == null || variable.category === category?.id) &&
            (variable.scope.type === "full-game" || variable.scope.type === "global");
    }

    private updateFilters() {
        this.resetIndividualLeaderboardState();
        this.update();
    }

    private renderVariablesTab(category: Option<Category>): JSX.Element {
        const metadata = this.state.editor.metadata;
        const gameInfo = getGameInfo(this.state.editor.game);
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
            const variables = expect(gameInfo.variables, "We need the variables to be embedded");
            for (const variable of variables.data) {
                if (this.variableIsValidForCategory(variable, category)) {
                    speedrunComVariables.push({
                        text: variable.name,
                        tooltip: "A variable on speedrun.com specific to the game.",
                        value: {
                            CustomCombobox: {
                                value: metadata.speedrun_com_variables[variable.name] || "",
                                list: ["", ...Object.values(variable.values.values).map((v) => v.label)],
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
            const customVariableValue = metadata.custom_variables[customVariableName];
            if (customVariableValue && customVariableValue.is_permanent) {
                customVariables.push({
                    text: customVariableName,
                    tooltip: "A custom variable specified by you. These can be displayed with the text component.",
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
            <div className="run-editor-tab">
                {
                    fields.length === 0 &&
                    <table className="table">
                        <tbody className="table-body">
                            <tr><td><p>
                                {"There are currently no"}
                                {this.props.generalSettings.speedrunComIntegration && " Speedrun.com variables or"}
                                {" custom variables for this game."}
                            </p></td></tr>
                        </tbody>
                    </table>
                }
                <SettingsComponent
                    context="run-editor-variables"
                    factory={new JsonSettingValueFactory()}
                    state={{ fields }}
                    editorUrlCache={this.props.runEditorUrlCache}
                    allComparisons={this.props.allComparisons}
                    allVariables={this.props.allVariables}
                    setValue={(index, value) => {
                        function unwrapString(value: ExtendedSettingsDescriptionValueJson): string {
                            if ("String" in value) {
                                return value.String;
                            } else {
                                throw new Error("Expected Setting value to be a string.");
                            }
                        }
                        function unwrapRemovableString(value: ExtendedSettingsDescriptionValueJson): string | null {
                            if ("RemovableString" in value) {
                                return value.RemovableString;
                            } else {
                                throw new Error("Expected Setting value to be a string.");
                            }
                        }
                        function unwrapBool(value: ExtendedSettingsDescriptionValueJson): boolean {
                            if ("Bool" in value) {
                                return value.Bool;
                            } else {
                                throw new Error("Expected Setting value to be a boolean.");
                            }
                        }
                        if (index === regionOffset) {
                            const region = unwrapString(value);
                            this.props.editor.setRegionName(region);
                        } else if (index === platformOffset) {
                            const platform = unwrapString(value);
                            this.props.editor.setPlatformName(platform);
                        } else if (index === emulatorOffset) {
                            const emulatorUsage = unwrapBool(value);
                            this.props.editor.setEmulatorUsage(emulatorUsage);
                        } else if (index < customVariablesOffset) {
                            const stringValue = unwrapString(value);
                            const key = speedrunComVariables[index - speedrunComVariablesOffset].text as string;
                            if (stringValue !== "") {
                                this.props.editor.setSpeedrunComVariable(key, stringValue);
                            } else {
                                this.props.editor.removeSpeedrunComVariable(key);
                            }
                        } else {
                            const key = customVariables[index - customVariablesOffset].text as string;
                            const stringValue = unwrapRemovableString(value);
                            if (stringValue !== null) {
                                this.props.editor.setCustomVariable(key, stringValue);
                            } else {
                                this.props.editor.removeCustomVariable(key);
                            }
                        }
                        this.update();
                    }}
                />
            </div>
        );
    }

    private renderLeaderboard(category: Option<Category>): JSX.Element {
        const leaderboard = this.getCurrentLeaderboard(category);
        if (leaderboard === undefined) {
            return <div />;
        }
        const gameInfo = getGameInfo(this.state.editor.game);
        const platformList = getPlatforms();
        const regionList = getRegions();

        let hideMilliseconds: boolean;
        if (gameInfo !== undefined) {
            hideMilliseconds = !gameInfo.ruleset["show-milliseconds"];
        } else {
            hideMilliseconds = leaderboard.every((r) => {
                return r.times.primary_t === Math.floor(r.times.primary_t);
            });
        }

        let rank = 0;
        let visibleRowCount = 0;
        let uniqueCount = 0;
        let lastTime = "";

        function isFiltered(value: string | undefined, filter: string | undefined): boolean {
            return filter !== undefined
                && filter !== ""
                && value !== filter;
        }

        const uniquenessSet = new Set();

        const allVariables = gameInfo?.variables;
        const variables = allVariables?.data.filter((variable) => this.variableIsValidForCategory(variable, category));
        const variableColumns = variables?.filter((variable) => !this.filters.variables.get(variable.name));

        return (
            <table className="table run-editor-tab leaderboard-table">
                <thead className="table-header">
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Time</th>
                        {variableColumns?.map((variable) => <th>{variable.name}</th>)}
                        {this.props.generalSettings.splitsIoIntegration && <th>Splits</th>}
                    </tr>
                </thead>
                <tbody className="table-body">
                    {leaderboard.map((run) => {
                        const platform = platformList.get(run.system.platform);
                        if (isFiltered(platform, this.filters.platform)) {
                            return null;
                        }

                        const region = map(run.system.region, (r) => regionList.get(r));
                        if (isFiltered(region, this.filters.region)) {
                            return null;
                        }

                        if (this.filters.isEmulated !== undefined && run.system.emulated !== this.filters.isEmulated) {
                            return null;
                        }

                        const renderedVariables = [];

                        if (variables !== undefined) {
                            for (const variable of variables) {
                                if (this.variableIsValidForCategory(variable, category)) {
                                    const variableValueId = run.values[variable.id];
                                    const variableValue = map(variableValueId, (i) => variable.values.values[i]);
                                    const filterValue = this.filters.variables.get(variable.name);
                                    if (isFiltered(variableValue?.label, filterValue)) {
                                        return null;
                                    }
                                }
                            }
                        }

                        if (variableColumns !== undefined) {
                            for (const variable of variableColumns) {
                                const valueId = run.values[variable.id];
                                let valueName;
                                if (valueId) {
                                    const value = Object.entries(variable.values.values).find(
                                        ([listValueId]) => listValueId === valueId,
                                    );
                                    valueName = map(value, (v) => v[1].label);
                                }
                                renderedVariables.push(
                                    <td className="variable-column">{valueName || ""}</td>,
                                );
                            }
                        }

                        const uniquenessKeys = run.players.data.map(
                            (p) => p.rel === "guest" ? `guest:${p.name}` : p.id,
                        );

                        const uniquenessKey = JSON.stringify(uniquenessKeys);
                        const isUnique = !uniquenessSet.has(uniquenessKey);
                        if (!isUnique && !this.filters.showObsolete) {
                            return null;
                        }
                        uniquenessSet.add(uniquenessKey);

                        const rowIndex = visibleRowCount;
                        const evenOdd = rowIndex % 2 === 0 ? "table-row-odd" : "table-row-even";
                        let expandedRow = null;

                        if (this.expandedLeaderboardRows.get(rowIndex) === true) {
                            let embed = null;
                            if (run.videos != null && run.videos.links != null && run.videos.links.length > 0) {
                                const videoUri = run.videos.links[run.videos.links.length - 1].uri;
                                embed = resolveEmbed(videoUri);
                            }
                            const comment = run.comment ?? "";
                            const renderedComment = renderMarkdown(comment);

                            expandedRow =
                                <tr key={`${run.id}_expanded`} className={`leaderboard-expanded-row ${evenOdd}`}>
                                    <td colSpan={4 + (variableColumns?.length ?? 0)}>
                                        {embed}
                                        <div className="markdown" style={{
                                            minHeight: 5,
                                        }}>{renderedComment}</div>
                                        <table className="run-meta-table">
                                            <tbody>
                                                <tr>
                                                    <td>Date:</td>
                                                    <td>{run.date?.split("-").join("/") ?? ""}</td>
                                                </tr>
                                                {map(
                                                    region,
                                                    (r) =>
                                                        <tr>
                                                            <td>Region:</td>
                                                            <td>{r}</td>
                                                        </tr>,
                                                )}
                                                {map(
                                                    platform,
                                                    (p) =>
                                                        <tr>
                                                            <td>Platform:</td>
                                                            <td>{p}{run.system.emulated && " Emulator"}</td>
                                                        </tr>,
                                                )}
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>;
                        }

                        visibleRowCount += 1;
                        if (isUnique) {
                            uniqueCount += 1;
                            if (run.times.primary !== lastTime) {
                                rank = uniqueCount;
                                lastTime = run.times.primary;
                            }
                        }

                        return [
                            <tr
                                key={run.id}
                                title={run.comment ?? ""}
                                className={`leaderboard-row ${evenOdd}`}
                                onClick={(_) => this.toggleExpandLeaderboardRow(rowIndex)}
                                style={{
                                    cursor: "pointer",
                                }}
                            >
                                <td className="leaderboard-rank-column number">{isUnique ? rank : "—"}</td>
                                <td>
                                    {
                                        run.players.data.map((p, i) => {
                                            if (p.rel === "user") {
                                                const style = p["name-style"];
                                                let color;
                                                if (style.style === "gradient") {
                                                    color = style["color-from"].dark;
                                                } else {
                                                    color = style.color.dark;
                                                }
                                                const flag = map(
                                                    p.location,
                                                    (l) => replaceFlag(l.country.code),
                                                );
                                                return [
                                                    i !== 0 ? ", " : null,
                                                    <a
                                                        target="_blank"
                                                        href={p.weblink}
                                                        style={{ color }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {flag}{p.names.international}
                                                    </a>,
                                                ];
                                            } else {
                                                const possibleMatch = /^\[([a-z]+)\](.+)$/.exec(p.name);
                                                let name = p.name;
                                                let flag;
                                                if (possibleMatch !== null) {
                                                    flag = replaceFlag(possibleMatch[1]);
                                                    name = possibleMatch[2];
                                                }
                                                return [
                                                    i !== 0 ? ", " : null,
                                                    <span className="unregistered-user">{flag}{name}</span>
                                                ];
                                            }
                                        })
                                    }
                                </td>
                                <td className="leaderboard-time-column number">
                                    <a
                                        href={run.weblink}
                                        target="_blank"
                                        style={{ color: "white" }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {formatLeaderboardTime(run.times.primary_t, hideMilliseconds)}
                                    </a>
                                </td>
                                {renderedVariables}
                                {
                                    this.props.generalSettings.splitsIoIntegration && <td className="splits-download-column">
                                        {
                                            map(run.splits, (s) => <i
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    this.downloadSplits(run, s.uri);
                                                }}
                                                className="fa fa-download"
                                                style={{ cursor: "pointer" }}
                                                aria-hidden="true"
                                            />)
                                        }
                                    </td>
                                }
                            </tr>,
                            expandedRow,
                        ];
                    })}
                </tbody>
            </table>
        );
    }

    private renderRulesTab(category: Option<Category>): JSX.Element {
        let rules = null;
        if (category != null && category.rules != null) {
            rules = renderMarkdown(category.rules);
        }
        const gameInfo = getGameInfo(this.state.editor.game);
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
                gameRules =
                    <p style={{ fontStyle: "italic" }}>
                        Runs of this game {additionalRules.join(" and ")}.
                    </p>;
            }
            const variables = expect(gameInfo.variables, "We need the variables to be embedded");
            for (const variable of variables.data) {
                if (this.variableIsValidForCategory(variable, category) && variable["is-subcategory"]) {
                    const currentValue = this.state.editor.metadata.speedrun_com_variables[variable.name];
                    const foundValue = Object.values(variable.values.values).find((v) => v.label === currentValue);
                    if (foundValue?.rules != null) {
                        subcategoryRules.push(renderMarkdown(`## ${foundValue.label} Rules\n${foundValue.rules}`));
                    }
                }
            }
        }

        return (
            <div className="run-editor-tab run-editor-additional-info">
                <div className="run-editor-rules markdown">{gameRules}{rules}{subcategoryRules}</div>
            </div>
        );
    }

    private renderSegmentsTable(): JSX.Element {
        return (
            <table className="table run-editor-tab run-editor-table">
                <thead className="table-header">
                    <tr>
                        <th>Icon</th>
                        <th>Segment Name</th>
                        <th>Split Time</th>
                        <th>Segment Time</th>
                        <th>Best Segment</th>
                        {
                            this.state.editor.comparison_names.map((comparison, comparisonIndex) => {
                                let contextTrigger: any = null;
                                const toggleMenu = (e: any) => {
                                    if (contextTrigger) {
                                        contextTrigger.handleContextClick(e);
                                    }
                                };
                                const id = `comparison-${comparisonIndex}-context-menu`;
                                return (
                                    <th
                                        style={{
                                            cursor: "pointer",
                                        }}
                                        onClick={(e) => toggleMenu(e)}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData("text/plain", "");
                                            this.dragIndex = comparisonIndex;
                                        }}
                                        onDragOver={(e) => {
                                            if (e.preventDefault) {
                                                e.preventDefault();
                                            }
                                            e.dataTransfer.dropEffect = "move";
                                        }}
                                        onDragEnd={(_) => this.update()}
                                        onDrop={(e) => {
                                            if (e.stopPropagation) {
                                                e.stopPropagation();
                                            }
                                            this.props.editor.moveComparison(this.dragIndex, comparisonIndex);
                                            return false;
                                        }}
                                    >
                                        <ContextMenuTrigger
                                            id={id}
                                            ref={(c) => contextTrigger = c}
                                        >
                                            {comparison}
                                        </ContextMenuTrigger>
                                        <ContextMenu id={id}>
                                            <MenuItem className="tooltip" onClick={(_) =>
                                                this.renameComparison(comparison)
                                            }>
                                                Rename
                                                <span className="tooltip-text">
                                                    Choose a new name for the custom comparison. There are reserved names that can't be used. You also can't have duplicate names.
                                                </span>
                                            </MenuItem>
                                            <MenuItem className="tooltip" onClick={(_) =>
                                                this.copyComparison(comparison)
                                            }>
                                                Copy
                                                <span className="tooltip-text">
                                                    Creates a copy of the custom comparison.
                                                </span>
                                            </MenuItem>
                                            <MenuItem className="tooltip" onClick={(_) =>
                                                this.removeComparison(comparison)
                                            }>
                                                Remove
                                                <span className="tooltip-text">
                                                    Removes the custom comparison.
                                                </span>
                                            </MenuItem>
                                        </ContextMenu>
                                    </th>
                                );
                            })
                        }
                    </tr>
                </thead>
                <tbody className="table-body">
                    {
                        this.state.editor.segments.map((s, segmentIndex) => {
                            const segmentIcon = this.getSegmentIconUrl(segmentIndex);
                            const segmentIconContextMenuId = `segment-icon-${segmentIndex}-context-menu`;
                            let segmentIconContextTrigger: any = null;
                            const segmentIconToggleMenu = (e: any) => {
                                if (segmentIconContextTrigger) {
                                    segmentIconContextTrigger.handleContextClick(e);
                                    this.props.editor.selectOnly(segmentIndex);
                                    this.update();
                                }
                            };
                            return (
                                <tr
                                    key={segmentIndex.toString()}
                                    className={
                                        (s.selected === "Selected" || s.selected === "Active") ?
                                            "selected" :
                                            ""
                                    }
                                    onClick={(e) => this.changeSegmentSelection(e, segmentIndex)}
                                >
                                    <td
                                        className="segment-icon-container"
                                        onClick={(e) => {
                                            if (segmentIcon !== undefined) {
                                                segmentIconToggleMenu(e);
                                            } else {
                                                this.changeSegmentIcon(segmentIndex);
                                            }
                                        }}
                                    >
                                        <ContextMenuTrigger
                                            id={segmentIconContextMenuId}
                                            ref={(c) => segmentIconContextTrigger = c}
                                        >
                                            {
                                                segmentIcon !== undefined &&
                                                <img
                                                    className="segment-icon"
                                                    src={segmentIcon}
                                                />
                                            }
                                        </ContextMenuTrigger>
                                        <ContextMenu id={segmentIconContextMenuId}>
                                            <MenuItem className="tooltip" onClick={(_) => this.changeSegmentIcon(segmentIndex)}>
                                                Set Icon
                                                <span className="tooltip-text">
                                                    Allows you to choose an image file to set as the segment's icon. Certain file formats may not work everywhere.
                                                </span>
                                            </MenuItem>
                                            <MenuItem className="tooltip" onClick={(_) => this.removeSegmentIcon(segmentIndex)}>
                                                Remove Icon
                                                <span className="tooltip-text">
                                                    Removes the segment's icon.
                                                </span>
                                            </MenuItem>
                                        </ContextMenu>
                                    </td>
                                    <td>
                                        <input
                                            className="name"
                                            type="text"
                                            value={s.name}
                                            onFocus={(_) => this.focusSegment(segmentIndex)}
                                            onChange={(e) => this.handleSegmentNameChange(e)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className="number"
                                            type="text"
                                            value={segmentIndex === this.state.rowState.index &&
                                                this.state.rowState.splitTimeChanged
                                                ? this.state.rowState.splitTime
                                                : s.split_time}
                                            onFocus={(_) => this.focusSegment(segmentIndex)}
                                            onChange={(e) => this.handleSplitTimeChange(e)}
                                            onBlur={(_) => this.handleSplitTimeBlur()}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className={
                                                ((segmentIndex !== this.state.rowState.index ||
                                                    !this.state.rowState.segmentTimeChanged) &&
                                                    s.segment_time === s.best_segment_time)
                                                    ? "number best-segment-time"
                                                    : "number"
                                            }
                                            type="text"
                                            value={segmentIndex === this.state.rowState.index &&
                                                this.state.rowState.segmentTimeChanged
                                                ? this.state.rowState.segmentTime
                                                : s.segment_time}
                                            onFocus={(_) => this.focusSegment(segmentIndex)}
                                            onChange={(e) => this.handleSegmentTimeChange(e)}
                                            onBlur={(_) => this.handleSegmentTimeBlur()}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className="number"
                                            type="text"
                                            value={segmentIndex === this.state.rowState.index &&
                                                this.state.rowState.bestSegmentTimeChanged
                                                ? this.state.rowState.bestSegmentTime
                                                : s.best_segment_time}
                                            onFocus={(_) => this.focusSegment(segmentIndex)}
                                            onChange={(e) => this.handleBestSegmentTimeChange(e)}
                                            onBlur={(_) => this.handleBestSegmentTimeBlur()}
                                        />
                                    </td>
                                    {
                                        this
                                            .state
                                            .editor
                                            .segments[segmentIndex]
                                            .comparison_times
                                            .map((comparisonTime, comparisonIndex) => (
                                                <td>
                                                    <input
                                                        className="number"
                                                        type="text"
                                                        value={segmentIndex === this.state.rowState.index &&
                                                            this.state.rowState.comparisonTimesChanged[comparisonIndex]
                                                            ? this.state.rowState.comparisonTimes[comparisonIndex]
                                                            : comparisonTime}
                                                        onFocus={(_) => this.focusSegment(segmentIndex)}
                                                        onChange={(e) =>
                                                            this.handleComparisonTimeChange(e, comparisonIndex)
                                                        }
                                                        onBlur={(_) =>
                                                            this.handleComparisonTimeBlur(comparisonIndex)
                                                        }
                                                    />
                                                </td>
                                            ))
                                    }
                                </tr>
                            );
                        })
                    }
                </tbody>
            </table>
        );
    }

    private getCurrentLeaderboard(category: Option<Category>) {
        const categoryName = category?.name;
        if (categoryName) {
            return getLeaderboard(this.state.editor.game, categoryName);
        }
        return undefined;
    }

    private getCurrentCategoriesInfo() {
        let categoryNames = ["Any%", "Low%", "100%"];
        let category = null;
        const categoryList = getCategories(this.state.editor.game);
        if (categoryList !== undefined) {
            categoryNames = categoryList.map((c) => c.name);
            const categoryIndex = categoryNames.indexOf(this.state.editor.category);
            if (categoryIndex >= 0) {
                category = categoryList[categoryIndex];
            }
        }
        return {
            category,
            categoryNames,
        };
    }

    private async generateGoalComparison() {
        const [result, goalTime] = await showDialog({
            title: "Generate Goal Comparison",
            description: "Specify the time you want to achieve:",
            textInput: true,
            buttons: ["Generate", "Cancel"],
        });

        if (result === 0) {
            if (this.props.editor.parseAndGenerateGoalComparison(goalTime)) {
                this.update();
            } else {
                toast.error("Failed generating the goal comparison. Make sure to specify a valid time.");
            }
        }
    }

    private async copyComparison(comparisonToCopy?: string) {
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
            const before = comparison.substring(0, comparison.length - " Copy".length);
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

        if (this.props.editor.copyComparison(comparison, newName)) {
            this.update();
        } else {
            toast.error("Failed copying the comparison. The comparison may not exist.");
        }
    }

    private async cleanSumOfBest() {
        const ptr = this.props.editor.ptr;
        {
            using cleaner = this.props.editor.cleanSumOfBest();
            this.props.editor.ptr = 0;
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
        this.props.editor.ptr = ptr;
        this.update();
    }

    private clearHistory() {
        this.props.editor.clearHistory();
        this.update();
    }

    private clearTimes() {
        this.props.editor.clearTimes();
        this.update();
    }

    private async importComparison() {
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
        const valid = this.props.editor.importComparison(run, comparisonName);
        if (!valid) {
            toast.error("The comparison could not be added. It may be a duplicate or a reserved name.");
        } else {
            this.update();
        }
    }

    private async addComparison() {
        const [result, comparisonName] = await showDialog({
            title: "Add Comparison",
            description: "Specify the name of the comparison you want to add:",
            textInput: true,
            buttons: ["Add", "Cancel"],
        });

        if (result === 0) {
            const valid = this.props.editor.addComparison(comparisonName);
            if (valid) {
                this.update();
            } else {
                toast.error("The comparison could not be added. It may be a duplicate or a reserved name.");
            }
        }
    }

    private async renameComparison(comparison: string) {
        const [result, newName] = await showDialog({
            title: "Rename Comparison",
            description: "Specify the new name of the comparison:",
            textInput: true,
            buttons: ["Rename", "Cancel"],
            defaultText: comparison,
        });

        if (result === 0) {
            const valid = this.props.editor.renameComparison(comparison, newName);
            if (valid) {
                this.update();
            } else {
                toast.error("The comparison could not be renamed. It may be a duplicate or a reserved name.");
            }
        }
    }

    private removeComparison(comparison: string) {
        this.props.editor.removeComparison(comparison);
        this.update();
    }

    private async changeSegmentIcon(index: number) {
        this.props.editor.selectOnly(index);
        const maybeFile = await openFileAsArrayBuffer(FILE_EXT_IMAGES);
        if (maybeFile === undefined) {
            return;
        }
        if (maybeFile instanceof Error) {
            toast.error(`Failed to read the file: ${maybeFile.message}`);
            return;
        }
        const [file] = maybeFile;
        this.props.editor.activeSetIconFromArray(new Uint8Array(file));
        this.update();
    }

    private removeSegmentIcon(index: number) {
        this.props.editor.selectOnly(index);
        this.props.editor.activeRemoveIcon();
    }

    private getSegmentIconUrl(index: number): string | undefined {
        return this.props.runEditorUrlCache.cache(this.state.editor.segments[index].icon);
    }

    private async changeGameIcon() {
        const maybeFile = await openFileAsArrayBuffer(FILE_EXT_IMAGES);
        if (maybeFile === undefined) {
            return;
        }
        if (maybeFile instanceof Error) {
            toast.error(`Failed to read the file: ${maybeFile.message}`);
            return;
        }
        const [file] = maybeFile;
        this.props.editor.setGameIconFromArray(new Uint8Array(file));
        this.maybeUpdate();
    }

    private removeGameIcon() {
        this.props.editor.removeGameIcon();
        this.update();
    }

    private getGameIcon(): string | undefined {
        return this.props.runEditorUrlCache.cache(this.state.editor.icon);
    }

    /**
     * This method is explicitly to be called from asynchronous functions. It
     * ensures that the editor only gets updated if it still exists. The problem
     * is that asynchronous functions may take a long time, such as refreshing
     * the leaderboards. We don't want to update the editor if it has been
     * disposed in the meantime.
     */
    private maybeUpdate(options: { switchTab?: Tab, search?: boolean } = {}) {
        if (this.props.editor.ptr === 0) {
            return;
        }
        this.update(options);
    }

    private update(options: { switchTab?: Tab, search?: boolean } = {}) {
        const intendedTab = options.switchTab ?? this.state.tab;
        const shouldShowTab = this.shouldShowTab(intendedTab);
        const newActiveTab = shouldShowTab ? intendedTab : Tab.RealTime;

        const state: LiveSplit.RunEditorStateJson = this.props.editor.stateAsJson(
            this.props.runEditorUrlCache.imageCache,
        );
        if (options.search) {
            this.setState({ foundGames: searchGames(state.game) });
        }
        this.props.runEditorUrlCache.collect();
        this.setState({
            editor: state,
            tab: newActiveTab,
        });
    }

    private handleGameChange(event: any) {
        this.props.editor.clearMetadata();
        this.props.editor.setGameName(event.target.value);
        if (this.props.generalSettings.speedrunComIntegration) {
            this.refreshGameInfo(event.target.value);
            this.refreshCategoryList(event.target.value);
            this.refreshLeaderboard(event.target.value, this.state.editor.category);
            this.resetTotalLeaderboardState();
        }
        this.update({ search: true });
    }

    private handleCategoryChange(event: any) {
        this.clearCategorySpecificVariables();
        this.props.editor.setCategoryName(event.target.value);
        if (this.props.generalSettings.speedrunComIntegration) {
            this.refreshLeaderboard(this.state.editor.game, event.target.value);
            this.resetTotalLeaderboardState();
        }
        this.update();
    }

    private handleOffsetChange(event: any) {
        const valid = this.props.editor.parseAndSetOffset(event.target.value);
        this.setState({
            editor: {
                ...this.state.editor,
                offset: event.target.value,
            },
            offsetIsValid: valid,
        });
    }

    private handleOffsetBlur() {
        this.setState({
            editor: this.props.editor.stateAsJson(this.props.runEditorUrlCache.imageCache),
            offsetIsValid: true,
        });
        this.props.runEditorUrlCache.collect();
    }

    private handleAttemptsChange(event: any) {
        const valid = this.props.editor.parseAndSetAttemptCount(event.target.value);
        this.setState({
            attemptCountIsValid: valid,
            editor: {
                ...this.state.editor,
                attempts: event.target.value,
            },
        });
    }

    private handleAttemptsBlur() {
        this.setState({
            attemptCountIsValid: true,
            editor: this.props.editor.stateAsJson(this.props.runEditorUrlCache.imageCache),
        });
        this.props.runEditorUrlCache.collect();
    }

    private focusSegment(i: number) {
        this.props.editor.selectOnly(i);

        const editor: LiveSplit.RunEditorStateJson = this.props.editor.stateAsJson(
            this.props.runEditorUrlCache.imageCache,
        );
        this.props.runEditorUrlCache.collect();

        const comparisonTimes = editor.segments[i].comparison_times;
        const rowState = {
            ...this.state.rowState,
            splitTimeChanged: false,
            segmentTimeChanged: false,
            bestSegmentTimeChanged: false,
            comparisonTimes,
            comparisonTimesChanged: comparisonTimes.map(() => false),
            index: i,
        };

        this.setState({
            editor,
            rowState,
        });
    }

    private handleSegmentNameChange(event: any) {
        this.props.editor.activeSetName(event.target.value);
        this.update();
    }

    private handleSplitTimeChange(event: any) {
        this.setState({
            rowState: {
                ...this.state.rowState,
                splitTime: event.target.value,
                splitTimeChanged: true,
            },
        });
    }

    private handleSegmentTimeChange(event: any) {
        this.setState({
            rowState: {
                ...this.state.rowState,
                segmentTime: event.target.value,
                segmentTimeChanged: true,
            },
        });
    }

    private handleBestSegmentTimeChange(event: any) {
        this.setState({
            rowState: {
                ...this.state.rowState,
                bestSegmentTime: event.target.value,
                bestSegmentTimeChanged: true,
            },
        });
    }

    private handleComparisonTimeChange(event: any, comparisonIndex: number) {
        const comparisonTimes = { ...this.state.rowState.comparisonTimes };
        comparisonTimes[comparisonIndex] = event.target.value;

        const comparisonTimesChanged = { ...this.state.rowState.comparisonTimesChanged };
        comparisonTimesChanged[comparisonIndex] = true;

        this.setState({
            rowState: {
                ...this.state.rowState,
                comparisonTimes,
                comparisonTimesChanged,
            },
        });
    }

    private handleSplitTimeBlur() {
        if (this.state.rowState.splitTimeChanged) {
            this.props.editor.activeParseAndSetSplitTime(this.state.rowState.splitTime);
        }

        this.setState({
            editor: this.props.editor.stateAsJson(this.props.runEditorUrlCache.imageCache),
            rowState: {
                ...this.state.rowState,
                splitTimeChanged: false,
            },
        });

        this.props.runEditorUrlCache.collect();
    }

    private handleSegmentTimeBlur() {
        if (this.state.rowState.segmentTimeChanged) {
            this.props.editor.activeParseAndSetSegmentTime(this.state.rowState.segmentTime);
        }

        this.setState({
            editor: this.props.editor.stateAsJson(this.props.runEditorUrlCache.imageCache),
            rowState: {
                ...this.state.rowState,
                segmentTimeChanged: false,
            },
        });

        this.props.runEditorUrlCache.collect();
    }

    private handleBestSegmentTimeBlur() {
        if (this.state.rowState.bestSegmentTimeChanged) {
            this.props.editor.activeParseAndSetBestSegmentTime(this.state.rowState.bestSegmentTime);
        }

        this.setState({
            editor: this.props.editor.stateAsJson(this.props.runEditorUrlCache.imageCache),
            rowState: {
                ...this.state.rowState,
                bestSegmentTimeChanged: false,
            },
        });

        this.props.runEditorUrlCache.collect();
    }

    private handleComparisonTimeBlur(comparisonIndex: number) {
        const comparisonTimesChanged = { ...this.state.rowState.comparisonTimesChanged };
        if (comparisonTimesChanged[comparisonIndex]) {
            const comparisonName = this.state.editor.comparison_names[comparisonIndex];
            const comparisonTime = this.state.rowState.comparisonTimes[comparisonIndex];
            this.props.editor.activeParseAndSetComparisonTime(comparisonName, comparisonTime);
        }
        comparisonTimesChanged[comparisonIndex] = false;

        this.setState({
            editor: this.props.editor.stateAsJson(this.props.runEditorUrlCache.imageCache),
            rowState: {
                ...this.state.rowState,
                comparisonTimesChanged,
            },
        });

        this.props.runEditorUrlCache.collect();
    }

    private insertSegmentAbove() {
        this.props.editor.insertSegmentAbove();
        this.update();
    }

    private insertSegmentBelow() {
        this.props.editor.insertSegmentBelow();
        this.update();
    }

    private removeSegments() {
        this.props.editor.removeSegments();
        this.update();
    }

    private moveSegmentsUp() {
        this.props.editor.moveSegmentsUp();
        this.update();
    }

    private moveSegmentsDown() {
        this.props.editor.moveSegmentsDown();
        this.update();
    }

    private changeSegmentSelection(event: any, i: number) {
        if (!event.currentTarget.classList.contains("selected")) {
            this.props.editor.selectAdditionally(i);
        } else {
            this.props.editor.unselect(i);
        }
        this.update();
    }

    private switchTab(tab: Tab) {
        switch (tab) {
            case Tab.RealTime: {
                this.props.editor.selectTimingMethod(LiveSplit.TimingMethod.RealTime);
                break;
            }
            case Tab.GameTime: {
                this.props.editor.selectTimingMethod(LiveSplit.TimingMethod.GameTime);
                break;
            }
        }
        this.resetTotalLeaderboardState();
        this.update({ switchTab: tab });
    }

    private shouldShowTab(tab: Tab) {
        if (tab === Tab.RealTime || tab === Tab.GameTime || tab === Tab.Variables) {
            return true;
        }

        const gameInfo = getGameInfo(this.state.editor.game);
        if (gameInfo === undefined) {
            return false;
        }
        if (tab === Tab.Rules) {
            return true;
        }

        if (tab === Tab.Leaderboard) {
            const { category } = this.getCurrentCategoriesInfo();
            const leaderboard = this.getCurrentLeaderboard(category);
            if (leaderboard !== undefined) {
                return true;
            }
        }

        return false;
    }

    private resetTotalLeaderboardState() {
        this.resetIndividualLeaderboardState();
        this.filters = { variables: new Map(), showObsolete: false };
    }

    private resetIndividualLeaderboardState() {
        this.expandedLeaderboardRows = new Map();
    }

    private async downloadBoxArt() {
        const signal = this.state.abortController.signal;
        try {
            const gameName = this.state.editor.game;
            await downloadGameInfo(gameName);
            const game = getGameInfo(gameName);
            if (game !== undefined) {
                const uri = game.assets["cover-medium"].uri;
                if (uri.startsWith("https://") && uri !== "https://www.speedrun.com/images/blankcover.png") {
                    const buffer = await corsBustingFetch(uri, signal);
                    if (this.props.editor.ptr === 0) {
                        return;
                    }
                    this.props.editor.setGameIconFromArray(new Uint8Array(buffer));
                    this.maybeUpdate();
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

    private async downloadIcon() {
        const signal = this.state.abortController.signal;
        try {
            const gameName = this.state.editor.game;
            await downloadGameInfo(gameName);
            const game = getGameInfo(gameName);
            if (game !== undefined) {
                const uri = game.assets.icon.uri;
                if (uri.startsWith("https://") && uri !== "https://www.speedrun.com/images/1st.png") {
                    const buffer = await corsBustingFetch(uri, signal);
                    if (this.props.editor.ptr === 0) {
                        return;
                    }
                    this.props.editor.setGameIconFromArray(new Uint8Array(buffer));
                    this.maybeUpdate();
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

    private async refreshGameList() {
        const before = gameListLength();
        await downloadGameList();
        const after = gameListLength();
        if (before !== after) {
            this.maybeUpdate({ search: true });
        }
    }

    private async refreshPlatformList() {
        const before = platformListLength();
        await downloadPlatformList();
        const after = platformListLength();
        if (before !== after) {
            this.maybeUpdate();
        }
    }

    private async refreshRegionList() {
        const before = regionListLength();
        await downloadRegionList();
        const after = regionListLength();
        if (before !== after) {
            this.maybeUpdate();
        }
    }

    private async refreshGameInfo(gameName: string) {
        await downloadGameInfo(gameName);
        this.maybeUpdate();
    }

    private async refreshCategoryList(gameName: string) {
        await downloadCategories(gameName);
        this.maybeUpdate();
    }

    private async refreshLeaderboard(gameName: string, categoryName: string) {
        await downloadLeaderboard(gameName, categoryName);
        this.maybeUpdate();
    }

    private getTab(): Tab {
        return this.state.tab;
    }

    private async downloadSplits<T>(apiRun: Run<T>, apiUri: string) {
        const baseUri = "https://splits.io/api/v3/runs/";
        assert(apiUri.startsWith(baseUri), "Unexpected Splits.io URL");
        const splitsId = apiUri.slice(baseUri.length);
        const signal = this.state.abortController.signal;
        try {
            const gameName = this.state.editor.game;
            const categoryName = this.state.editor.category;
            const runDownload = downloadById(splitsId, signal);
            const platformListDownload = downloadPlatformList();
            const regionListDownload = downloadRegionList();
            const gameInfoDownload = downloadGameInfo(gameName);
            await gameInfoDownload;
            await platformListDownload;
            await regionListDownload;
            using run = await runDownload;
            const newEditor = LiveSplit.RunEditor.new(run);
            if (newEditor !== null) {
                associateRun(
                    newEditor,
                    gameName,
                    categoryName,
                    apiRun,
                );

                // TODO Oh no, not internal pointer stuff
                this.props.editor[Symbol.dispose]();
                this.props.editor.ptr = newEditor.ptr;

                this.update();
            } else {
                toast.error("The downloaded splits are not suitable for being edited.");
            }
        } catch {
            if (signal.aborted) {
                return;
            }
            toast.error("Failed to download the splits.");
        }
    }

    private toggleExpandLeaderboardRow(rowIndex: number) {
        if (this.expandedLeaderboardRows.get(rowIndex) === true) {
            this.expandedLeaderboardRows.set(rowIndex, false);
        } else {
            this.expandedLeaderboardRows.set(rowIndex, true);
        }
        this.update();
    }

    private clearCategorySpecificVariables() {
        const categoryList = getCategories(this.state.editor.game);
        if (categoryList !== undefined) {
            for (const category of categoryList) {
                if (category.name !== this.state.editor.category) {
                    continue;
                }
                const gameInfo = getGameInfo(this.state.editor.game);
                if (gameInfo === undefined) {
                    continue;
                }
                const variables = expect(gameInfo.variables, "We need the variables to be embedded");
                for (const variable of variables.data) {
                    if (
                        variable.category === category?.id
                        && (variable.scope.type === "full-game" || variable.scope.type === "global")
                    ) {
                        this.props.editor.removeSpeedrunComVariable(variable.name);
                    }
                }
                break;
            }
        }
    }

    private async interactiveAssociateRunOrOpenPage() {
        const currentRunId = this.state.editor.metadata.run_id;
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
        const pattern = /^(?:(?:https?:\/\/)?(?:www\.)?speedrun\.com\/(?:\w+\/)?run\/)?(\w+)$/;
        const matches = pattern.exec(idOrUrl);
        if (matches === null) {
            toast.error("Invalid speedrun.com ID or URL.");
            return;
        }
        const runId = matches[1];
        const run = await getRun(runId);
        const gameInfo = await downloadGameInfoByGameId(run.game);
        const categories = await downloadCategoriesByGameId(run.game);
        const category = expect(
            categories.find((c) => c.id === run.category),
            "The category doesn't belong to the game.",
        );

        const gameName = gameInfo.names.international;
        const categoryName = category.name;

        associateRun(
            this.props.editor,
            gameName,
            categoryName,
            run,
        );

        this.refreshLeaderboard(gameName, categoryName);
        this.resetTotalLeaderboardState();
        this.maybeUpdate();
    }
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
