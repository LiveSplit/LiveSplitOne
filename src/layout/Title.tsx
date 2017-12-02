import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

export interface Props { state: LiveSplit.TitleComponentStateJson }

export default class Title extends React.Component<Props> {
    private iconUrl: string;

    constructor(props: Props) {
        super(props);

        this.iconUrl = "";
    }

    public render() {
        const iconUrl = this.getIconUrl();

        const finishedRunsExist = this.props.state.finished_runs != null;
        const attemptsExist = this.props.state.attempts != null;
        const twoLines = this.props.state.line2 != null;
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

        const icon = iconUrl !== "" ? (
            <div className="game-icon-container">
                <img className="title-icon" src={iconUrl} />
            </div>
        ) : (<div style={{ display: "none" }} />);

        return (
            <div
                className="title"
                style={{
                    background: gradientToCss(this.props.state.background),
                    color: map(this.props.state.text_color, colorToCss),
                }}
            >
                {icon}
                <div className={"run-meta" + (!this.props.state.is_centered ? " meta-left" : "") + (twoLines ? " meta-two-lines" : "")}>
                    {twoLines ? <span className="title-game">{this.props.state.line1}</span> : <div style={{ display: "none" }} />}
                    <div id="lower-row" style={{ height: (twoLines ? "50%" : "100%") }}>
                        <div className="title-category"> {twoLines ? this.props.state.line2 : this.props.state.line1}</div>
                        <div className="title-attempts">{attemptsLabel}</div>
                    </div>
                </div>
            </div>
        );
    }

    private getIconUrl(): string {
        if (this.props.state.icon_change != null) {
            this.iconUrl = this.props.state.icon_change;
        }
        return this.iconUrl;
    }
}
