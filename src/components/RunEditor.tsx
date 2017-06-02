import * as React from "react";
import * as LiveSplit from "../livesplit";

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
            editor: props.editor.stateAsJson(),
            offsetIsValid: true,
            attemptCountIsValid: true,
            rowState: {
                splitTimeIsValid: true,
                segmentTimeIsValid: true,
                bestSegmentTimeIsValid: true,
                index: 0,
            },
        };
    }

    update() {

        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson()
        });
    }

    handleGameChange(event: any) {
        this.props.editor.setGameName(event.target.value);
        this.update();
    }

    handleCategoryChange(event: any) {
        this.props.editor.setCategoryName(event.target.value);
        this.update();
    }

    handleOffsetChange(event: any) {
        let valid = this.props.editor.parseAndSetOffset(event.target.value);
        this.setState({
            ...this.state,
            offsetIsValid: valid,
            editor: {
                ...this.state.editor,
                offset: event.target.value,
            }
        });
    }

    handleOffsetBlur(event: any) {
        this.setState({
            ...this.state,
            offsetIsValid: true,
            editor: this.props.editor.stateAsJson(),
        });
    }

    handleAttemptsChange(event: any) {
        let valid = this.props.editor.parseAndSetAttemptCount(event.target.value);
        this.setState({
            ...this.state,
            attemptCountIsValid: valid,
            editor: {
                ...this.state.editor,
                attempts: event.target.value,
            }
        });
    }

    handleAttemptsBlur(event: any) {
        this.setState({
            ...this.state,
            attemptCountIsValid: true,
            editor: this.props.editor.stateAsJson(),
        });
    }

    focusSegment(i: number) {
        this.props.editor.selectOnly(i);
        this.setState({
            ...this.state,
            rowState: {
                ...this.state.rowState,
                index: i,
            },
            editor: this.props.editor.stateAsJson(),
        });
    }

    handleSegmentNameChange(event: any) {
        this.props.editor.selectedSetName(event.target.value);
        this.update();
    }

    handleSplitTimeChange(event: any) {
        let valid = this.props.editor.selectedParseAndSetSplitTime(event.target.value);
        let editor = {
            ...this.state.editor,
        };
        editor.segments[this.state.rowState.index].split_time = event.target.value;
        this.setState({
            ...this.state,
            rowState: {
                ...this.state.rowState,
                splitTimeIsValid: valid,
            },
            editor: editor,
        });
    }

    handleSegmentTimeChange(event: any) {
        let valid = this.props.editor.selectedParseAndSetSegmentTime(event.target.value);
        let editor = {
            ...this.state.editor,
        };
        editor.segments[this.state.rowState.index].segment_time = event.target.value;
        this.setState({
            ...this.state,
            rowState: {
                ...this.state.rowState,
                segmentTimeIsValid: valid,
            },
            editor: editor,
        });
    }

    handleBestSegmentTimeChange(event: any) {
        let valid = this.props.editor.selectedParseAndSetBestSegmentTime(event.target.value);
        let editor = {
            ...this.state.editor,
        };
        editor.segments[this.state.rowState.index].best_segment_time = event.target.value;
        this.setState({
            ...this.state,
            rowState: {
                ...this.state.rowState,
                bestSegmentTimeIsValid: valid,
            },
            editor: editor,
        });
    }

    handleSplitTimeBlur(event: any) {
        this.setState({
            ...this.state,
            rowState: {
                ...this.state.rowState,
                splitTimeIsValid: true,
            },
            editor: this.props.editor.stateAsJson(),
        });
    }

    handleSegmentTimeBlur(event: any) {
        this.setState({
            ...this.state,
            rowState: {
                ...this.state.rowState,
                segmentTimeIsValid: true,
            },
            editor: this.props.editor.stateAsJson(),
        });
    }

    handleBestSegmentTimeBlur(event: any) {
        this.setState({
            ...this.state,
            rowState: {
                ...this.state.rowState,
                bestSegmentTimeIsValid: true,
            },
            editor: this.props.editor.stateAsJson(),
        });
    }

    insertSegmentAbove() {
        this.props.editor.insertSegmentAbove();
        this.update();
    }

    insertSegmentBelow() {
        this.props.editor.insertSegmentBelow();
        this.update();
    }

    removeSegments() {
        this.props.editor.removeSegments();
        this.update();
    }

    moveSegmentsUp() {
        this.props.editor.moveSegmentsUp();
        this.update();
    }

    moveSegmentsDown() {
        this.props.editor.moveSegmentsDown();
        this.update();
    }

    changeSegmentSelection(event: any, i: number) {
        if (event.target.checked) {
            this.props.editor.selectAdditionally(i);
        } else {
            this.props.editor.unselect(i);
        }
        this.update();
    }

    switchTimingMethod(timingMethod: LiveSplit.TimingMethod) {
        this.props.editor.selectTimingMethod(timingMethod);
        this.update();
    }

    render() {
        return (
            <div className="run-editor">
                <div className="group">
                    <input type="text" required className="run-editor-game" value={this.state.editor.game} onChange={(e) => this.handleGameChange(e)} />
                    <span className="bar"></span>
                    <label>Game</label>
                </div>
                <div className="group">
                    <input type="text" required className="run-editor-category" value={this.state.editor.category} onChange={(e) => this.handleCategoryChange(e)} />
                    <span className="bar"></span>
                    <label>Category</label>
                </div>
                <div className="bottom">
                    <div className={this.state.offsetIsValid ? "group small" : "group invalid small"}>
                        <input type="text" required className="run-editor-offset" value={this.state.editor.offset} onChange={(e) => this.handleOffsetChange(e)} onBlur={(e) => this.handleOffsetBlur(e)} />
                        <span className="bar"></span>
                        <label>Offset</label>
                    </div>
                    <div className={this.state.attemptCountIsValid ? "group small" : "group invalid small"}>
                        <input type="text" required className="run-editor-attempts" value={this.state.editor.attempts} onChange={(e) => this.handleAttemptsChange(e)} onBlur={(e) => this.handleAttemptsBlur(e)} />
                        <span className="bar"></span>
                        <label>Attempts</label>
                    </div>
                </div>
                <div>
                    <button onClick={(e) => this.switchTimingMethod(LiveSplit.TimingMethod.RealTime)}>Real Time</button>
                    <button onClick={(e) => this.switchTimingMethod(LiveSplit.TimingMethod.GameTime)}>Game Time</button>
                </div>
                <div className="editer-group">
                    <div className="btn-group">
                        <button onClick={(e) => this.insertSegmentAbove()}>Insert Above</button>
                        <button onClick={(e) => this.insertSegmentBelow()}>Insert Below</button>
                        <button onClick={(e) => this.removeSegments()}>Remove Segment</button>
                        <button onClick={(e) => this.moveSegmentsUp()}>Move Up</button>
                        <button onClick={(e) => this.moveSegmentsDown()}>Move Down</button>
                    </div>
                    <div className="table">
                        <div className="table-header">
                            <div className="cell checkbox"></div>
                            <div className="cell">Segment Name</div>
                            <div className="cell">Split Time</div>
                            <div className="cell">Segment Time</div>
                            <div className="cell">Best Segment</div>
                        </div>
                        {
                            this.state.editor.segments.map((s: any, i: number) =>
                                <form key={i.toString()}>
                                    <div className="checkbox" ><input type="checkbox" checked={s.selected == "Selected" || s.selected == "CurrentRow"} onChange={(e) => this.changeSegmentSelection(e, i)} /></div>
                                    <div><input className="name" type="text" value={s.name} onFocus={(e) => this.focusSegment(i)} onChange={(e) => this.handleSegmentNameChange(e)} /></div>
                                    <div><input className={this.state.rowState.index != i || this.state.rowState.splitTimeIsValid ? "" : "invalid"}
                                        type="text" value={s.split_time} onFocus={(e) => this.focusSegment(i)} onChange={(e) => this.handleSplitTimeChange(e)} onBlur={(e) => this.handleSplitTimeBlur(e)} /></div>
                                    <div><input className={this.state.rowState.index != i || this.state.rowState.segmentTimeIsValid ? "" : "invalid"}
                                        type="text" value={s.segment_time} onFocus={(e) => this.focusSegment(i)} onChange={(e) => this.handleSegmentTimeChange(e)} onBlur={(e) => this.handleSegmentTimeBlur(e)} /></div>
                                    <div><input className={this.state.rowState.index != i || this.state.rowState.bestSegmentTimeIsValid ? "" : "invalid"}
                                        type="text" value={s.best_segment_time} onFocus={(e) => this.focusSegment(i)} onChange={(e) => this.handleBestSegmentTimeChange(e)} onBlur={(e) => this.handleBestSegmentTimeBlur(e)} /></div>
                                </form>
                            )
                        }
                    </div>
                </div>
            </div>
        )
    }
}
