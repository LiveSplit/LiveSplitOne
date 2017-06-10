import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { timer: LiveSplit.Timer }

export class Component extends React.Component<Props, LiveSplit.TitleComponentStateJson> {
    inner: LiveSplit.TitleComponent;
    timerID: number;
    iconUrl: string;

    constructor(props: Props) {
        super(props);

        this.iconUrl = "";
        this.inner = LiveSplit.TitleComponent.new();

        this.state = this.inner.stateAsJson(this.props.timer);
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
        this.inner.dispose();
    }

    update() {
        this.setState(this.inner.stateAsJson(this.props.timer));
    }

    render() {
        let icon_url = this.getIconUrl();

        let icon = icon_url != "" ? (
            <div className="game-icon-container">
                <img className="title-icon" src={icon_url}></img>
            </div>
        ) : (<div style={{ display: "none" }} />)

        return (
            <div className="title">
                {icon}
                <div className={"run-meta" + (icon_url != "" ? " meta-left" : "")}>
                    <span className="title-game">{this.state.game}</span>
                    <div id="lower-row">
                        <div className="title-category">{this.state.category}</div>
                        <div className="title-attempts">{this.state.attempts}</div>
                    </div>
                </div>
            </div>
        );
    }
}
