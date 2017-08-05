import * as React from "react";
import * as LiveSplit from "../livesplit";
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
    }

    public render() {
        return (
            <div className="run-editor">
                <TextBox
                    className="run-editor-game"
                    value={this.state.editor.game}
                    onChange={(e) => this.handleGameChange(e)}
                    label="Game"
                />
                <TextBox
                    className="run-editor-category"
                    value={this.state.editor.category}
                    onChange={(e) => this.handleCategoryChange(e)}
                    label="Category"
                />
                <div className="bottom">
                    <TextBox
                        className="run-editor-offset"
                        value={this.state.editor.offset}
                        onChange={(e) => this.handleOffsetChange(e)}
                        onBlur={(e) => this.handleOffsetBlur(e)}
                        small
                        invalid={!this.state.offsetIsValid}
                        label="Offset"
                    />
                    <TextBox
                        className="run-editor-attempts"
                        value={this.state.editor.attempts}
                        onChange={(e) => this.handleAttemptsChange(e)}
                        onBlur={(e) => this.handleAttemptsBlur(e)}
                        small
                        invalid={!this.state.attemptCountIsValid}
                        label="Attempts"
                    />
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
                            <td>Segment Name</td>
                            <td>Split Time</td>
                            <td>Segment Time</td>
                            <td>Best Segment</td>
                        </thead>
                        <tbody className="table-body">
                            {
                                this.state.editor.segments.map((s: LiveSplit.RunEditorRowJson, i: number) =>
                                    <tr
                                        key={i.toString()}
                                        className={
                                            (s.selected === "Selected" || s.selected === "CurrentRow") ? "selected" : ""
                                        }
                                        onClick={(e) => this.changeSegmentSelection(e, i)}
                                    >
                                        <td>
                                            <input
                                                className="name"
                                                type="text"
                                                value={s.name}
                                                onFocus={(_) => this.focusSegment(i)}
                                                onChange={(e) => this.handleSegmentNameChange(e)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className={
                                                    this.state.rowState.index !== i ||
                                                        this.state.rowState.splitTimeIsValid ?
                                                        "number" :
                                                        "number invalid"
                                                }
                                                type="text"
                                                value={s.split_time}
                                                onFocus={(_) => this.focusSegment(i)}
                                                onChange={(e) => this.handleSplitTimeChange(e)}
                                                onBlur={(e) => this.handleSplitTimeBlur(e)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className={
                                                    this.state.rowState.index !== i ||
                                                        this.state.rowState.segmentTimeIsValid ?
                                                        "number" :
                                                        "number invalid"
                                                }
                                                type="text"
                                                value={s.segment_time}
                                                onFocus={(_) => this.focusSegment(i)}
                                                onChange={(e) => this.handleSegmentTimeChange(e)}
                                                onBlur={(e) => this.handleSegmentTimeBlur(e)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className={
                                                    this.state.rowState.index !== i ||
                                                        this.state.rowState.bestSegmentTimeIsValid ?
                                                        "number" :
                                                        "number invalid"
                                                }
                                                type="text"
                                                value={s.best_segment_time}
                                                onFocus={(_) => this.focusSegment(i)}
                                                onChange={(e) => this.handleBestSegmentTimeChange(e)}
                                                onBlur={(e) => this.handleBestSegmentTimeBlur(e)}
                                            />
                                        </td>
                                    </tr>,
                                )
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        )
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
