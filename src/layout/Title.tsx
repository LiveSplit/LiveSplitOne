import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import { map } from "../util/OptionUtil";

import "../css/Title.scss";
import Abbreviated from "./Abbreviated";
import { UrlCache } from "../util/UrlCache";

export interface Props {
    state: LiveSplit.TitleComponentStateJson,
    layoutUrlCache: UrlCache,
}

export default class Title extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    public render() {
        const iconUrl = this.props.layoutUrlCache.cache(this.props.state.icon);

        const finishedRunsExist = this.props.state.finished_runs !== null;
        const attemptsExist = this.props.state.attempts !== null;
        const line2 = this.props.state.line2;
        const twoLines = line2.length !== 0;
        const showIcon = iconUrl !== undefined;
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
                    className={`run-info text-font ${alignmentClass} ${iconClass}`}
                >
                    {
                        twoLines && <span className={`title-game ${alignmentClass}`}>
                            <Abbreviated abbreviations={this.props.state.line1} />
                        </span>
                    }
                    <div className={`lower-row ${numLinesClass} ${alignmentClass}`} >
                        {
                            this.props.state.is_centered && showAttempts &&
                            <div className={`title-attempts-invisible ${numLinesClass}`}>
                                <div className="title-text">{attemptsLabel}</div>
                            </div>
                        }
                        <div className={`title-category ${alignmentClass}`}>
                            <Abbreviated abbreviations={
                                twoLines ? line2 : this.props.state.line1
                            } />
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
}
