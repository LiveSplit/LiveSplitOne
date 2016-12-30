import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { timer: LiveSplit.Timer }

export class Component extends React.Component<Props, LiveSplit.PreviousSegmentComponentState> {
    inner: LiveSplit.PreviousSegmentComponent;
    timerID: number;

    constructor(props: Props) {
        super(props);

        this.inner = new LiveSplit.PreviousSegmentComponent();

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
            <div className="previous-segment">
                <table>
                    <tbody>
                        <tr>
                            <td className="previous-segment-text">{this.state.text}</td>
                            <td className="previous-segment-time">{this.state.time}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
