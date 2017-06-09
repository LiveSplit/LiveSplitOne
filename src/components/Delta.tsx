import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { timer: LiveSplit.Timer }

export class Component extends React.Component<Props, LiveSplit.DeltaComponentStateJson> {
    inner: LiveSplit.DeltaComponent;
    timerID: number;

    constructor(props: Props) {
        super(props);

        this.inner = LiveSplit.DeltaComponent.new();

        this.state = this.inner.stateAsJson(this.props.timer);
    }

    componentDidMount() {
        this.timerID = setInterval(
            () => this.update(),
            1000 / 30
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
        this.inner.dispose();
    }

    getColor(): string {
        return "color-" + this.state.color.toLowerCase();
    }

    update() {
        this.setState(this.inner.stateAsJson(this.props.timer));
    }

    render() {
        return (
            <div className="delta-component">
                <table>
                    <tbody>
                        <tr>
                            <td className="delta-component-text">{this.state.text}</td>
                            <td className={"delta-component-time time " + this.getColor()}>{this.state.time}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
