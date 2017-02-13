import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { editor: LiveSplit.RunEditor };
export interface State {
    editor: LiveSplit.RunEditorState,
    offsetIsValid: boolean,
    attemptCountIsValid: boolean,
}

export class RunEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            editor: props.editor.state(),
            offsetIsValid: true,
            attemptCountIsValid: true,
        };
    }

    update() {
        this.setState({
            ...this.state,
            editor: this.props.editor.state()
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
        if (valid) {
            this.setState({
                ...this.state,
                offsetIsValid: true,
                editor: {
                    ...this.state.editor,
                    offset: event.target.value,
                }
            });
        } else {
            this.setState({
                ...this.state,
                offsetIsValid: false,
                editor: {
                    ...this.state.editor,
                    offset: event.target.value,
                }
            });
        }
    }

    handleOffsetBlur(event: any) {
        this.setState({
            ...this.state,
            offsetIsValid: true,
            editor: this.props.editor.state(),
        });
    }

    handleAttemptsChange(event: any) {
        let valid = this.props.editor.parseAndSetAttemptCount(event.target.value);
        if (valid) {
            this.setState({
                ...this.state,
                attemptCountIsValid: true,
                editor: {
                    ...this.state.editor,
                    attempts: event.target.value,
                }
            });
        } else {
            this.setState({
                ...this.state,
                attemptCountIsValid: false,
                editor: {
                    ...this.state.editor,
                    attempts: event.target.value,
                }
            });
        }
    }

    handleAttemptsBlur(event: any) {
        this.setState({
            ...this.state,
            attemptCountIsValid: true,
            editor: this.props.editor.state(),
        });
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
                <div className={this.state.offsetIsValid ? "group" : "group invalid"}>
                    <input type="text" required className="run-editor-offset" value={this.state.editor.offset} onChange={(e) => this.handleOffsetChange(e)} onBlur={(e) => this.handleOffsetBlur(e)} />
                    <span className="bar"></span>
                    <label>Offset</label>
                </div>
                <div className={this.state.attemptCountIsValid ? "group" : "group invalid"}>
                    <input type="text" required className="run-editor-attempts" value={this.state.editor.attempts} onChange={(e) => this.handleAttemptsChange(e)} onBlur={(e) => this.handleAttemptsBlur(e)} />
                    <span className="bar"></span>
                    <label>Attempts</label>
                </div>
            </div>
        )
    }
}
