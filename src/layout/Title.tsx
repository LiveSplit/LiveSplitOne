import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

import "../css/Title.scss";

export interface Props { state: LiveSplit.TitleComponentStateJson }

export default class Title extends React.Component<Props> {
    private iconUrl: string;
    private gameNameElement: React.RefObject<HTMLElement>;

    constructor(props: Props) {
        super(props);

        this.iconUrl = "";
        this.gameNameElement = React.createRef();
    }

    public componentDidMount() {
        const container = this.gameNameElement.current;
        if (container === null) {
            return;
        }
        if (this.getIconUrl() !== ""
            && container.classList.contains("justify-center")
            && container.parentElement !== null
            && container.offsetWidth > container.parentElement.offsetWidth - 100) {
            if (!container.classList.contains("game-title-center-fix")) {
                container.classList.add("game-title-center-fix");
            }
        } else {
            if (container.classList.contains("game-title-center-fix")) {
                container.classList.remove("game-title-center-fix");
            }
        }
    }

    public render() {
        const iconUrl = this.getIconUrl();

        const finishedRunsExist = this.props.state.finished_runs !== null;
        const attemptsExist = this.props.state.attempts !== null;
        const twoLines = this.props.state.line2 !== null;
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
        const showIcon = iconUrl !== "";
        const icon = showIcon ? (
            <div className="game-icon-container">
                <img className="title-icon" src={iconUrl} />
            </div>
        ) : (<div style={{ display: "none" }} />);

        const gameName = twoLines
            ? <span ref={this.gameNameElement} className={"title-game" + (this.props.state.is_centered ? " justify-center" : "")}>
                <div className="title-text">{this.props.state.line1}</div>
            </span>
            : <div style={{ display: "none" }} />;
        return (
            <div
                className="title"
                style={{
                    background: gradientToCss(this.props.state.background),
                    color: map(this.props.state.text_color, colorToCss),
                }}
            >
                {icon}
                <div
                    className={
                        "run-meta"
                        + (!this.props.state.is_centered ? " meta-left" : "")
                        + (twoLines ? " meta-two-lines" : " meta-one-line")
                        + (showIcon ? " show-icon" : "")
                    }
                >
                    {
                        gameName
                    }
                    <div id="lower-row" style={{ height: (twoLines ? "50%" : "100%") }}>
                        <div className={
                            "title-category"
                            + (this.props.state.is_centered ? " justify-center" : "")
                        }>
                            <div className="title-text">
                                {twoLines ? this.props.state.line2 : this.props.state.line1}
                            </div>
                        </div>
                        <div className="title-attempts">{attemptsLabel}</div>
                    </div>
                </div>
            </div>
        );
    }

    private getIconUrl(): string {
        if (this.props.state.icon_change !== null) {
            this.iconUrl = this.props.state.icon_change;
        }
        return this.iconUrl;
    }
}
