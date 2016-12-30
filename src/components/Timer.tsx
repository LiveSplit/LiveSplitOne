import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { timer: LiveSplit.Timer }

export class Component extends React.Component<Props, LiveSplit.TimerComponentState> {
    inner: LiveSplit.TimerComponent;
    timerID: number;

    constructor(props: Props) {
        super(props);

        this.inner = new LiveSplit.TimerComponent();

        this.state = this.inner.getState(this.props.timer);
    }

    componentDidMount() {
        this.timerID = setInterval(
            () => this.update(),
            1000 / 30
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
        this.inner.drop();
    }

    update() {
        this.setState(this.inner.getState(this.props.timer));
    }

    render() {
        return (
            <div className="timer-time">
                {this.state.time}
            </div>
        );
    }
}
