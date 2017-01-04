import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { timer: LiveSplit.Timer }

export class Component extends React.Component<Props, LiveSplit.TitleComponentState> {
    inner: LiveSplit.TitleComponent;
    timerID: number;
    iconUrl: string;

    constructor(props: Props) {
        super(props);

        this.iconUrl = "";
        this.inner = new LiveSplit.TitleComponent();

        this.state = this.inner.getState(this.props.timer);
    }

    getIconUrl(): string {
        if (this.state.icon_change != null) {
            this.iconUrl = this.state.icon_change;
        }
        return this.iconUrl;
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
            <div className="title">
                {//<img className="title-icon" src={this.getIconUrl()}></img>
                }
                <span className="title-game">{this.state.game}</span>
                <span className="title-category">{this.state.category}</span>
                <span className="title-attempts">{this.state.attempts}</span>
            </div>
        );
    }
}
