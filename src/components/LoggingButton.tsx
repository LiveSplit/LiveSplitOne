import * as React from "react";

export interface LoggingProps { initialValue: number }
export interface LoggingState { value: number }

export class LoggingButton extends React.Component<LoggingProps, LoggingState> {
    constructor(props: LoggingProps) {
        super(props);
        this.state = {
            value: props.initialValue
        };
    }

    componentDidMount() {
        console.log("hi");
    }

    componentWillUnmount() {
        console.log("bye");
    }

    handleClick(e: any) {
        this.setState({
            value: this.state.value + 1
        });
    }

    render() {
        // This syntax ensures `this` is bound within handleClick
        return (
            <button onClick={(e) => this.handleClick(e)}>
                {this.state.value}
            </button>
        );
    }
}
