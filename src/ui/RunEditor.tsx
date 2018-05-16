import * as React from "react";
import { ContextMenu, ContextMenuTrigger, MenuItem } from "react-contextmenu";
import * as LiveSplit from "../livesplit";
import { openFileAsArrayBuffer } from "../util/FileUtil";
import { TextBox } from "./TextBox";
import { toast } from "react-toastify";
import {
    downloadGameList, searchGames, getGameId, getCategories, downloadCategories,
} from "../api/GameList";
import { Category, getGame } from "../api/SpeedrunCom";
import { Option } from "../util/OptionUtil";
import { Parser as CommonMarkParser } from "commonmark";
import CommonMarkRenderer = require("commonmark-react-renderer");

export interface Props { editor: LiveSplit.RunEditor }
export interface State {
    editor: LiveSplit.RunEditorStateJson,
    offsetIsValid: boolean,
    attemptCountIsValid: boolean,
    rowState: RowState,
    isOnRulesTab: boolean,
}

interface RowState {
    splitTimeIsValid: boolean,
    segmentTimeIsValid: boolean,
    bestSegmentTimeIsValid: boolean,
    comparisonIsValid: boolean[],
    index: number,
}

enum Tab {
    RealTime,
    GameTime,
    Rules,
}

export class RunEditor extends React.Component<Props, State> {
    private gameIcon: string;
    private segmentIconUrls: string[];
    private dragIndex: number = 0;

    constructor(props: Props) {
        super(props);

        this.state = {
            attemptCountIsValid: true,
            editor: props.editor.stateAsJson(),
            offsetIsValid: true,
            rowState: {
                bestSegmentTimeIsValid: true,
                comparisonIsValid: [],
                index: 0,
                segmentTimeIsValid: true,
                splitTimeIsValid: true,
            },
            isOnRulesTab: false,
        };

        this.gameIcon = "";
        this.segmentIconUrls = [];

        // TODO Handle closing the Run Editor
        this.refreshGameList();
        this.refreshCategoryList();
    }

    public render() {
        const gameIcon = this.getGameIcon();
        const gameIconSize = 138;

        let gameIconContextTrigger: any = null;
        const gameIconToggleMenu = (e: any) => {
            if (gameIconContextTrigger) {
                gameIconContextTrigger.handleContextClick(e);
            }
        };

        let otherButtonContextTrigger: any = null;
        const otherButtonToggleMenu = (e: any) => {
            if (otherButtonContextTrigger) {
                otherButtonContextTrigger.handleContextClick(e);
            }
        };

        const tab = this.getTab();

        let categoryNames = ["Any%", "Low%", "100%"];
        let category = null;
        const categoryList = getCategories(this.state.editor.game);
        if (categoryList != null) {
            categoryNames = categoryList.map((c) => c.name);
            const categoryIndex = categoryNames.indexOf(this.state.editor.category);
            if (categoryIndex >= 0) {
                category = categoryList[categoryIndex];
            }
        }

        return (
            <div className="run-editor">
                <div className="run-editor-info">
                    <div
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid hsl(0, 0%, 25%)",
                            cursor: "pointer",
                            height: gameIconSize,
                            marginTop: 5,
                            padding: 10,
                            width: gameIconSize,
                        }}
                        onClick={(e) => {
                            gameIconToggleMenu(e);
                        }}
                    >
                        <ContextMenuTrigger
                            id="game-icon-context-menu"
                            ref={(c) => gameIconContextTrigger = c}
                        >
                            {
                                gameIcon !== "" &&
                                <img
                                    src={gameIcon}
                                    style={{
                                        height: gameIconSize,
                                        objectFit: "contain",
                                        width: gameIconSize,
                                    }}
                                />
                            }
                        </ContextMenuTrigger>
                    </div>
                    <ContextMenu id="game-icon-context-menu">
                        <MenuItem onClick={(_) => this.changeGameIcon()}>
                            Set Icon
                        </MenuItem>
                        <MenuItem onClick={(_) => this.downloadBoxArt()}>
                            Download Box Art
                        </MenuItem>
                        <MenuItem onClick={(_) => this.downloadIcon()}>
                            Download Icon
                        </MenuItem>
                        {
                            gameIcon !== "" &&
                            <MenuItem onClick={(_) => this.removeGameIcon()}>
                                Remove Icon
                            </MenuItem>
                        }
                    </ContextMenu>
                    <table className="run-editor-info-table">
                        <tbody>
                            <tr>
                                <td>
                                    <TextBox
                                        className="run-editor-game"
                                        value={this.state.editor.game}
                                        onChange={(e) => this.handleGameChange(e)}
                                        label="Game"
                                        list={[
                                            "run-editor-game-list",
                                            searchGames(this.state.editor.game),
                                        ]}
                                    />
                                </td>
                                <td>
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
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <TextBox
                                        className="run-editor-offset"
                                        value={this.state.editor.offset}
                                        onChange={(e) => this.handleOffsetChange(e)}
                                        onBlur={(_) => this.handleOffsetBlur()}
                                        small
                                        invalid={!this.state.offsetIsValid}
                                        label="Offset"
                                    />
                                </td>
                                <td>
                                    <TextBox
                                        className="run-editor-attempts"
                                        value={this.state.editor.attempts}
                                        onChange={(e) => this.handleAttemptsChange(e)}
                                        onBlur={(_) => this.handleAttemptsBlur()}
                                        small
                                        invalid={!this.state.attemptCountIsValid}
                                        label="Attempts"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="timing-selection tab-bar">
                    <button
                        className={"toggle-left" + (
                            tab === Tab.RealTime
                                ? " button-pressed"
                                : ""
                        )}
                        onClick={(_) => this.switchTab(Tab.RealTime)}
                    >
                        Real Time
                    </button>
                    <button
                        className={"toggle-middle" + (
                            tab === Tab.GameTime
                                ? " button-pressed"
                                : ""
                        )}
                        onClick={(_) => this.switchTab(Tab.GameTime)}
                    >
                        Game Time
                    </button>
                    <button
                        className={"toggle-right" + (
                            tab === Tab.Rules
                                ? " button-pressed"
                                : ""
                        )}
                        onClick={(_) => this.switchTab(Tab.Rules)}
                    >
                        Rules
                    </button>
                </div>
                <div className="editor-group">
                    <div className="btn-group">
                        <button onClick={(_) => this.insertSegmentAbove()}>
                            Insert Above
                        </button>
                        <button onClick={(_) => this.insertSegmentBelow()}>
                            Insert Below
                        </button>
                        <button
                            onClick={(_) => this.removeSegments()}
                            className={this.state.editor.buttons.can_remove ? "" : "disabled"}
                        >
                            Remove Segment
                        </button>
                        <button
                            onClick={(_) => this.moveSegmentsUp()}
                            className={this.state.editor.buttons.can_move_up ? "" : "disabled"}
                        >
                            Move Up
                        </button>
                        <button
                            onClick={(_) => this.moveSegmentsDown()}
                            className={this.state.editor.buttons.can_move_down ? "" : "disabled"}
                        >
                            Move Down
                        </button>
                        <button onClick={(_) => this.addComparison()}>
                            Add Comparison
                        </button>
                        <button onClick={(_) => this.importComparison()}>
                            Import Comparison
                        </button>
                        <button onClick={(e) => otherButtonToggleMenu(e)}>
                            <ContextMenuTrigger
                                id="other-button-context-menu"
                                ref={(c) => otherButtonContextTrigger = c}
                            >
                                Other…
                            </ContextMenuTrigger>
                        </button>
                        <ContextMenu id="other-button-context-menu">
                            <MenuItem onClick={(_) => this.clearHistory()}>
                                Clear History
                            </MenuItem>
                            <MenuItem onClick={(_) => this.clearTimes()}>
                                Clear Times
                            </MenuItem>
                            <MenuItem onClick={(_) => this.cleanSumOfBest()}>
                                Clean Sum of Best
                            </MenuItem>
                        </ContextMenu>
                    </div>
                    {
                        tab === Tab.Rules
                            ? this.renderRulesTab(category)
                            : this.renderSegmentsTable()
                    }
                </div>
            </div >
        );
    }

    private renderRulesTab(category: Option<Category>) {
        let rules = null;
        if (category != null && category.rules != null) {
            const parsed = new CommonMarkParser().parse(category.rules);
            rules = new CommonMarkRenderer({
                escapeHtml: true,
                linkTarget: "_blank",
            }).render(parsed);
        }
        return (
            <div className="run-editor-additional-info">
                <div className="run-editor-rules">{rules}</div>
            </div>
        );
    }

    private renderSegmentsTable(): JSX.Element {
        const segmentIconSize = 19;

        return (
            <table className="table run-editor-table">
                <thead className="table-header">
                    <tr>
                        <th style={{
                            paddingLeft: 4,
                            paddingRight: 0,
                            width: "inherit",
                        }}>Icon</th>
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
                                            <MenuItem onClick={(_) =>
                                                this.renameComparison(comparison)
                                            }>
                                                Rename
                                            </MenuItem>
                                            <MenuItem onClick={(_) =>
                                                this.removeComparison(comparison)
                                            }>
                                                Remove
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
                                        style={{
                                            cursor: "pointer",
                                            height: segmentIconSize,
                                            paddingBottom: 0,
                                            paddingLeft: 16,
                                            paddingRight: 0,
                                            paddingTop: 2,
                                            width: segmentIconSize,
                                        }}
                                        onClick={(e) => {
                                            if (segmentIcon !== "") {
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
                                                segmentIcon !== "" &&
                                                <img
                                                    src={segmentIcon}
                                                    style={{
                                                        height: segmentIconSize,
                                                        objectFit: "contain",
                                                        width: segmentIconSize,
                                                    }}
                                                />
                                            }
                                        </ContextMenuTrigger>
                                        <ContextMenu id={segmentIconContextMenuId}>
                                            <MenuItem onClick={(_) => this.changeSegmentIcon(segmentIndex)}>
                                                Set Icon
                                            </MenuItem>
                                            <MenuItem onClick={(_) => this.removeSegmentIcon(segmentIndex)}>
                                                Remove Icon
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
                                            className={
                                                this.state.rowState.index !== segmentIndex ||
                                                    this.state.rowState.splitTimeIsValid ?
                                                    "number" :
                                                    "number invalid"
                                            }
                                            type="text"
                                            value={s.split_time}
                                            onFocus={(_) => this.focusSegment(segmentIndex)}
                                            onChange={(e) => this.handleSplitTimeChange(e)}
                                            onBlur={(_) => this.handleSplitTimeBlur()}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className={
                                                this.state.rowState.index !== segmentIndex ||
                                                    this.state.rowState.segmentTimeIsValid ?
                                                    "number" :
                                                    "number invalid"
                                            }
                                            type="text"
                                            value={s.segment_time}
                                            onFocus={(_) => this.focusSegment(segmentIndex)}
                                            onChange={(e) => this.handleSegmentTimeChange(e)}
                                            onBlur={(_) => this.handleSegmentTimeBlur()}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className={
                                                this.state.rowState.index !== segmentIndex ||
                                                    this.state.rowState.bestSegmentTimeIsValid ?
                                                    "number" :
                                                    "number invalid"
                                            }
                                            type="text"
                                            value={s.best_segment_time}
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
                                                        className={
                                                            this.state.rowState.index !== segmentIndex ||
                                                                this.isComparisonValid(comparisonIndex) ?
                                                                "number" :
                                                                "number invalid"
                                                        }
                                                        type="text"
                                                        value={comparisonTime}
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

    private cleanSumOfBest() {
        this.props.editor.cleanSumOfBest().with((cleaner) => {
            while (true) {
                const potentialCleanUp = cleaner.nextPotentialCleanUp();
                if (!potentialCleanUp) {
                    break;
                }
                potentialCleanUp.with((potentialCleanUp) => {
                    const message = potentialCleanUp.message();
                    if (confirm(message)) {
                        cleaner.apply(potentialCleanUp);
                    }
                });
            }
        });
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

    private importComparison() {
        openFileAsArrayBuffer((data, file) => {
            const result = LiveSplit.Run.parseArray(new Int8Array(data), "", false);
            if (!result.parsedSuccessfully()) {
                toast.error("Couldn't parse the splits.");
                return;
            }
            result.unwrap().with((run) => {
                const comparisonName = prompt("Comparison Name:", file.name.replace(/\.[^/.]+$/, ""));
                if (!comparisonName) {
                    return;
                }
                const valid = this.props.editor.importComparison(run, comparisonName);
                if (!valid) {
                    toast.error("The comparison could not be added. It may be a duplicate or a reserved name.");
                } else {
                    this.update();
                }
            });
        });
    }

    private addComparison() {
        const comparisonName = prompt("Comparison Name:");
        if (comparisonName) {
            const valid = this.props.editor.addComparison(comparisonName);
            if (valid) {
                this.update();
            } else {
                toast.error("The comparison could not be added. It may be a duplicate or a reserved name.");
            }
        }
    }

    private renameComparison(comparison: string) {
        const newName = prompt("Comparison Name:", comparison);
        if (newName) {
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

    private isComparisonValid(index: number): boolean {
        while (index >= this.state.rowState.comparisonIsValid.length) {
            this.state.rowState.comparisonIsValid.push(true);
        }
        return this.state.rowState.comparisonIsValid[index];
    }

    private changeSegmentIcon(index: number) {
        this.props.editor.selectOnly(index);
        openFileAsArrayBuffer((file) => {
            this.props.editor.activeSetIconFromArray(new Int8Array(file));
            this.update();
        });
    }

    private removeSegmentIcon(index: number) {
        this.props.editor.selectOnly(index);
        this.props.editor.activeRemoveIcon();
    }

    private getSegmentIconUrl(index: number): string {
        while (index >= this.segmentIconUrls.length) {
            this.segmentIconUrls.push("");
        }
        const iconChange = this.state.editor.segments[index].icon_change;
        if (iconChange != null) {
            this.segmentIconUrls[index] = iconChange;
        }
        return this.segmentIconUrls[index];
    }

    private changeGameIcon() {
        openFileAsArrayBuffer((file) => {
            this.props.editor.setGameIconFromArray(new Int8Array(file));
            this.update();
        });
    }

    private removeGameIcon() {
        this.props.editor.removeGameIcon();
        this.update();
    }

    private getGameIcon(): string {
        if (this.state.editor.icon_change != null) {
            this.gameIcon = this.state.editor.icon_change;
        }
        return this.gameIcon;
    }

    private update(isOnRulesTab?: boolean) {
        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(),
            isOnRulesTab: isOnRulesTab === undefined
                ? this.state.isOnRulesTab
                : isOnRulesTab,
        });
    }

    private handleGameChange(event: any) {
        this.props.editor.setGameName(event.target.value);
        this.refreshCategoryList();
        this.update();
    }

    private handleCategoryChange(event: any) {
        this.props.editor.setCategoryName(event.target.value);
        this.update();
    }

    private handleOffsetChange(event: any) {
        const valid = this.props.editor.parseAndSetOffset(event.target.value);
        this.setState({
            ...this.state,
            editor: {
                ...this.state.editor,
                offset: event.target.value,
            },
            offsetIsValid: valid,
        });
    }

    private handleOffsetBlur() {
        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(),
            offsetIsValid: true,
        });
    }

    private handleAttemptsChange(event: any) {
        const valid = this.props.editor.parseAndSetAttemptCount(event.target.value);
        this.setState({
            ...this.state,
            attemptCountIsValid: valid,
            editor: {
                ...this.state.editor,
                attempts: event.target.value,
            },
        });
    }

    private handleAttemptsBlur() {
        this.setState({
            ...this.state,
            attemptCountIsValid: true,
            editor: this.props.editor.stateAsJson(),
        });
    }

    private focusSegment(i: number) {
        this.props.editor.selectOnly(i);
        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(),
            rowState: {
                ...this.state.rowState,
                index: i,
            },
        });
    }

    private handleSegmentNameChange(event: any) {
        this.props.editor.activeSetName(event.target.value);
        this.update();
    }

    private handleSplitTimeChange(event: any) {
        const valid = this.props.editor.activeParseAndSetSplitTime(event.target.value);
        const editor = {
            ...this.state.editor,
        };
        editor.segments[this.state.rowState.index].split_time = event.target.value;
        this.setState({
            ...this.state,
            editor,
            rowState: {
                ...this.state.rowState,
                splitTimeIsValid: valid,
            },
        });
    }

    private handleSegmentTimeChange(event: any) {
        const valid = this.props.editor.activeParseAndSetSegmentTime(event.target.value);
        const editor = {
            ...this.state.editor,
        };
        editor.segments[this.state.rowState.index].segment_time = event.target.value;
        this.setState({
            ...this.state,
            editor,
            rowState: {
                ...this.state.rowState,
                segmentTimeIsValid: valid,
            },
        });
    }

    private handleBestSegmentTimeChange(event: any) {
        const valid = this.props.editor.activeParseAndSetBestSegmentTime(event.target.value);
        const editor = {
            ...this.state.editor,
        };
        editor.segments[this.state.rowState.index].best_segment_time = event.target.value;
        this.setState({
            ...this.state,
            editor,
            rowState: {
                ...this.state.rowState,
                bestSegmentTimeIsValid: valid,
            },
        });
    }

    private handleComparisonTimeChange(event: any, comparisonIndex: number) {
        const comparisonName = this.state.editor.comparison_names[comparisonIndex];
        const valid = this.props.editor.activeParseAndSetComparisonTime(comparisonName, event.target.value);
        const editor = {
            ...this.state.editor,
        };
        editor.segments[this.state.rowState.index].comparison_times[comparisonIndex] = event.target.value;
        const comparisonIsValid = { ...this.state.rowState.comparisonIsValid };
        comparisonIsValid[comparisonIndex] = valid;
        this.setState({
            ...this.state,
            editor,
            rowState: {
                ...this.state.rowState,
                comparisonIsValid,
            },
        });
    }

    private handleSplitTimeBlur() {
        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(),
            rowState: {
                ...this.state.rowState,
                splitTimeIsValid: true,
            },
        });
    }

    private handleSegmentTimeBlur() {
        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(),
            rowState: {
                ...this.state.rowState,
                segmentTimeIsValid: true,
            },
        });
    }

    private handleBestSegmentTimeBlur() {
        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(),
            rowState: {
                ...this.state.rowState,
                bestSegmentTimeIsValid: true,
            },
        });
    }

    private handleComparisonTimeBlur(comparisonIndex: number) {
        const comparisonIsValid = { ...this.state.rowState.comparisonIsValid };
        comparisonIsValid[comparisonIndex] = true;

        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(),
            rowState: {
                ...this.state.rowState,
                comparisonIsValid,
            },
        });
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
            case Tab.Rules: {
                break;
            }
        }
        this.update(tab === Tab.Rules);
    }

    private async downloadBoxArt() {
        await downloadGameList();
        const gameId = getGameId(this.state.editor.game);
        if (gameId != null) {
            const game = await getGame(gameId);
            const uri = game.assets["cover-medium"].uri;
            if (uri.startsWith("https://")) {
                // Workaround until CORS is fixed
                const proxyUri = `https://cors-buster-jfpactjnem.now.sh/${uri.slice("https://".length)}`;
                const response = await fetch(proxyUri);
                const buffer = await response.arrayBuffer();
                // TODO Racy situation with Run Editor closing
                this.props.editor.setGameIconFromArray(new Int8Array(buffer));
                this.update();
            }
        }
    }

    private async downloadIcon() {
        await downloadGameList();
        const gameId = getGameId(this.state.editor.game);
        if (gameId != null) {
            const game = await getGame(gameId);
            const uri = game.assets.icon.uri;
            if (uri.startsWith("https://")) {
                // Workaround until CORS is fixed
                const proxyUri = `https://cors-buster-jfpactjnem.now.sh/${uri.slice("https://".length)}`;
                const response = await fetch(proxyUri);
                const buffer = await response.arrayBuffer();
                // TODO Racy situation with Run Editor closing
                this.props.editor.setGameIconFromArray(new Int8Array(buffer));
                this.update();
            }
        }
    }

    private async refreshGameList() {
        await downloadGameList();
        this.update();
    }

    private async refreshCategoryList() {
        await downloadGameList();
        const gameId = getGameId(this.state.editor.game);
        if (gameId != null) {
            await downloadCategories(gameId);
            this.update();
        }
    }

    private getTab(): Tab {
        if (this.state.isOnRulesTab) {
            return Tab.Rules;
        } else if (this.state.editor.timing_method === "RealTime") {
            return Tab.RealTime;
        } else {
            return Tab.GameTime;
        }
    }
}
