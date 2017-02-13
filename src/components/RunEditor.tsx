import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { editor: LiveSplit.RunEditor };

export class RunEditor extends React.Component<Props, LiveSplit.RunEditorState> {
    constructor(props: Props) {
        super(props);

        this.state = props.editor.state();
    }

    update() {
        this.setState(this.props.editor.state());
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
        this.setState({
            ...this.state,
            offset: event.target.value,
        });
    }

    handleOffsetSubmit(event: any) {
        this.props.editor.parseAndSetOffset(this.state.offset);
        this.update();
    }

    handleAttemptsChange(event: any) {
        this.setState({
            ...this.state,
            attempts: event.target.value,
        });
    }

    handleAttemptsSubmit(event: any) {
        this.props.editor.parseAndSetAttemptCount(this.state.attempts);
        this.update();
    }

    render() {
        return (
            <div className="run-editor">
                <div className="group">
                    <input type="text" required className="run-editor-game" value={this.state.game} onChange={(e) => this.handleGameChange(e)} />
                    <span className="bar"></span>
                    <label>Game</label>
                </div>
                <div className="group">
                    <input type="text" required className="run-editor-category" value={this.state.category} onChange={(e) => this.handleCategoryChange(e)} />
                    <span className="bar"></span>
                    <label>Category</label>
                </div>
                <div className="group">
                    <input type="text" required className="run-editor-offset" value={this.state.offset} onChange={(e) => this.handleOffsetChange(e)} onBlur={(e) => this.handleOffsetSubmit(e)} />
                    <span className="bar"></span>
                    <label>Offset</label>
                </div>
                <div className="group">
                    <input type="text" required className="run-editor-attempts" value={this.state.attempts} onChange={(e) => this.handleAttemptsChange(e)} onBlur={(e) => this.handleAttemptsSubmit(e)} />
                    <span className="bar"></span>
                    <label>Attempts</label>
                </div>
            </div>
        )
    }
}
