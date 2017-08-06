import * as React from "react";
import * as LiveSplit from "../livesplit";
import { openFileAsArrayBuffer } from "../util/FileUtil";
import { TextBox } from "./TextBox";

export interface Props { editor: LiveSplit.RunEditor };
export interface State {
    editor: LiveSplit.RunEditorStateJson,
    offsetIsValid: boolean,
    attemptCountIsValid: boolean,
    rowState: RowState,
}

interface RowState {
    splitTimeIsValid: boolean,
    segmentTimeIsValid: boolean,
    bestSegmentTimeIsValid: boolean,
    index: number,
}

export class RunEditor extends React.Component<Props, State> {
    private gameIcon: string;
    private segmentIconUrls: string[];

    constructor(props: Props) {
        super(props);

        this.state = {
            attemptCountIsValid: true,
            editor: props.editor.stateAsJson(),
            offsetIsValid: true,
            rowState: {
                bestSegmentTimeIsValid: true,
                index: 0,
                segmentTimeIsValid: true,
                splitTimeIsValid: true,
            },
        };

        this.gameIcon = "";
        this.segmentIconUrls = [];
    }

    public render() {
        const gameIcon = this.getGameIcon();
        const gameIconSize = 118;
        const segmentIconSize = 19;

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
                        onClick={(_) => this.changeGameIcon()}
                    >
                        {
                            gameIcon !== "" &&
                            <img
                                src={gameIcon}
                                style={{
                                    "height": gameIconSize,
                                    "object-fit": "contain",
                                    "width": gameIconSize,
                                }}
                            />
                        }
                    </div>
                    <table className="run-editor-info-table">
                        <tbody>
                            <tr>
                                <td>
                                    <TextBox
                                        className="run-editor-game"
                                        value={this.state.editor.game}
                                        onChange={(e) => this.handleGameChange(e)}
                                        label="Game"
                                    />
                                </td>
                                <td>
                                    <TextBox
                                        className="run-editor-category"
                                        value={this.state.editor.category}
                                        onChange={(e) => this.handleCategoryChange(e)}
                                        label="Category"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <TextBox
                                        className="run-editor-offset"
                                        value={this.state.editor.offset}
                                        onChange={(e) => this.handleOffsetChange(e)}
                                        onBlur={(e) => this.handleOffsetBlur(e)}
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
                                        onBlur={(e) => this.handleAttemptsBlur(e)}
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
                            this.state.editor.timing_method === "RealTime"
                                ? " button-pressed"
                                : ""
                        )}
                        onClick={(_) => this.switchTimingMethod(LiveSplit.TimingMethod.RealTime)}
                    >
                        Real Time
                    </button>
                    <button
                        className={"toggle-right" + (
                            this.state.editor.timing_method === "GameTime"
                                ? " button-pressed"
                                : ""
                        )}
                        onClick={(_) => this.switchTimingMethod(LiveSplit.TimingMethod.GameTime)}
                    >
                        Game Time
                    </button>
                </div>
                <div className="editer-group">
                    <div className="btn-group">
                        <button
                            onClick={(_) => this.insertSegmentAbove()}
                        >
                            Insert Above
                        </button>
                        <button
                            onClick={(_) => this.insertSegmentBelow()}
                        >
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
                    </div>
                    <table className="table run-editor-table">
                        <thead className="table-header">
                            <td style={{
                                paddingLeft: 4,
                                paddingRight: 0,
                                width: "inherit",
                            }}>Icon</td>
                            <td>Segment Name</td>
                            <td>Split Time</td>
                            <td>Segment Time</td>
                            <td>Best Segment</td>
                        </thead>
                        <tbody className="table-body">
                            {
                                this.state.editor.segments.map((s, segmentIndex) => {
                                    const segmentIcon = this.getSegmentIconUrl(segmentIndex);
                                    return (
                                        <tr
                                            key={segmentIndex.toString()}
                                            className={
                                                (s.selected === "Selected" || s.selected === "CurrentRow") ?
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
                                                onClick={(_) => this.changeSegmentIcon(segmentIndex)}
                                            >
                                                {
                                                    segmentIcon !== "" &&
                                                    <img
                                                        src={segmentIcon}
                                                        style={{
                                                            "height": segmentIconSize,
                                                            "object-fit": "contain",
                                                            "width": segmentIconSize,
                                                        }}
                                                    />
                                                }
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
                                                    onBlur={(e) => this.handleSplitTimeBlur(e)}
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
                                                    onBlur={(e) => this.handleSegmentTimeBlur(e)}
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
                                                    onBlur={(e) => this.handleBestSegmentTimeBlur(e)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </div >
        )
    }

    private changeSegmentIcon(index: number) {
        this.props.editor.selectOnly(index);
        openFileAsArrayBuffer((file) => {
            this.props.editor.selectedSetIconFromArray(new Int8Array(file));
            this.update();
        });
        this.update();
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

    private getGameIcon(): string {
        if (this.state.editor.icon_change !== null) {
            this.gameIcon = this.state.editor.icon_change;
        }
        return this.gameIcon;
    }

    private update() {
        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(),
        });
    }

    private handleGameChange(event: any) {
        this.props.editor.setGameName(event.target.value);
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

    private handleOffsetBlur(_: any) {
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

    private handleAttemptsBlur(_: any) {
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
        this.props.editor.selectedSetName(event.target.value);
        this.update();
    }

    private handleSplitTimeChange(event: any) {
        const valid = this.props.editor.selectedParseAndSetSplitTime(event.target.value);
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
        const valid = this.props.editor.selectedParseAndSetSegmentTime(event.target.value);
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
        const valid = this.props.editor.selectedParseAndSetBestSegmentTime(event.target.value);
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

    private handleSplitTimeBlur(_: any) {
        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(),
            rowState: {
                ...this.state.rowState,
                splitTimeIsValid: true,
            },
        });
    }

    private handleSegmentTimeBlur(_: any) {
        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(),
            rowState: {
                ...this.state.rowState,
                segmentTimeIsValid: true,
            },
        });
    }

    private handleBestSegmentTimeBlur(_: any) {
        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(),
            rowState: {
                ...this.state.rowState,
                bestSegmentTimeIsValid: true,
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

    private switchTimingMethod(timingMethod: LiveSplit.TimingMethod) {
        this.props.editor.selectTimingMethod(timingMethod);
        this.update();
    }
}
