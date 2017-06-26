import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { state: LiveSplit.TitleComponentStateJson }

export class Component extends React.Component<Props, undefined> {
    iconUrl: string;

    constructor(props: Props) {
        super(props);

        this.iconUrl = "";
    }

    getIconUrl(): string {
        if (this.props.state.icon_change != null) {
            this.iconUrl = this.props.state.icon_change;
        }
        return this.iconUrl;
    }

    render() {
        let icon_url = this.getIconUrl();

        let finishedRunsExist = this.props.state.finished_runs != null;
        let attemptsExist = this.props.state.attempts != null;
        let attemptsLabel = "";

        if (finishedRunsExist) {
            attemptsLabel += this.props.state.finished_runs;
            if (attemptsExist) {
                attemptsLabel += "/";
            }
        }
        if (attemptsExist) {
            attemptsLabel += this.props.state.attempts;
        }

        let icon = icon_url != "" ? (
            <div className="game-icon-container">
                <img className="title-icon" src={icon_url}></img>
            </div>
        ) : (<div style={{ display: "none" }} />)

        return (
            <div className="title">
                {icon}
                <div className={"run-meta" + (icon_url != "" ? " meta-left" : "")}>
                    <span className="title-game">{this.props.state.game}</span>
                    <div id="lower-row">
                        <div className="title-category">{this.props.state.category}</div>
                        <div className="title-attempts">{attemptsLabel}</div>
                    </div>
                </div>
            </div>
        );
    }
}
