import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

import "../css/Title.scss";

export interface Props { state: LiveSplit.TitleComponentStateJson }

export default class Title extends React.Component<Props> {
    private iconUrl: string;

    constructor(props: Props) {
        super(props);

        this.iconUrl = "";
    }

    public render() {
        const iconUrl = this.getIconUrl();

        const finishedRunsExist = this.props.state.finished_runs !== null;
        const attemptsExist = this.props.state.attempts !== null;
        const twoLines = this.props.state.line2 !== null;
        const showIcon = iconUrl !== "";
        const showAttempts = attemptsExist || finishedRunsExist;

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

        const alignmentClass = this.props.state.is_centered ? "centered" : "left-align";
        const numLinesClass = twoLines ? "two-lines" : "one-line";
        const iconClass = showIcon ? "show-icon" : "";

        return (
            <div
                className="title"
                style={{
                    background: gradientToCss(this.props.state.background),
                    color: map(this.props.state.text_color, colorToCss),
                }}
            >
                {
                    showIcon && <div className="game-icon-container">
                        <img className="title-icon" src={iconUrl} />
                    </div>
                }
                <div
                    className={`run-info ${alignmentClass} ${iconClass}`}
                >
                    {
                        twoLines && <span className={`title-game ${alignmentClass}`}>
                            <div className="title-text">{this.props.state.line1}</div>
                        </span>
                    }
                    <div className={`lower-row ${numLinesClass} ${alignmentClass}`}>
                        {
                            this.props.state.is_centered && showAttempts &&
                            <div className={`title-attempts-invisible ${numLinesClass}`}>
                                <div className="title-text">{attemptsLabel}</div>
                            </div>
                        }
                        <div className={`title-category ${alignmentClass}`}>
                            <div className="title-text">
                                {twoLines ? this.props.state.line2 : this.props.state.line1}
                            </div>
                        </div>
                        {
                            showAttempts &&
                            <div className={`title-attempts ${numLinesClass}`}>
                                <div className="title-text">{attemptsLabel}</div>
                            </div>
                        }
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
