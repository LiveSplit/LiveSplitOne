import * as React from "react";

import LiveSplitIcon from "../../assets/icon.svg";
import { Markdown } from "../../util/Markdown";
import { ArrowLeft } from "lucide-react";

import * as variables from "../../css/variables.icss.scss";
import "../../css/About.scss";

export interface Props {
    callbacks: Callbacks;
}

interface Callbacks {
    renderViewWithSidebar(
        renderedView: React.JSX.Element,
        sidebarContent: React.JSX.Element,
    ): React.JSX.Element;
    openTimerView(): void;
}

const contributorAvatarSize = parseFloat(variables.contributorAvatarSize);

export class About extends React.Component<Props> {
    public render() {
        const renderedView = this.renderView();
        const sidebarContent = this.renderSidebarContent();
        return this.props.callbacks.renderViewWithSidebar(
            renderedView,
            sidebarContent,
        );
    }

    private renderView() {
        const idealAvatarResolution = Math.round(
            devicePixelRatio * contributorAvatarSize,
        );

        return (
            <div className="about">
                <div className="about-inner-container">
                    <div className="livesplit-title">
                        <span className="livesplit-icon">
                            <img src={LiveSplitIcon} alt="LiveSplit Logo" />
                        </span>
                        <div className="title-text">LiveSplit One</div>
                    </div>
                    <p className="build-version">
                        <a
                            href={`https://github.com/LiveSplit/LiveSplitOne/commit/${COMMIT_HASH}`}
                            target="_blank"
                        >
                            Version: {BUILD_DATE}
                        </a>
                    </p>
                    <p>
                        LiveSplit One is a multiplatform version of LiveSplit,
                        the sleek, highly-customizable timer for speedrunners.
                    </p>
                    <p>
                        <a
                            href="https://github.com/LiveSplit/LiveSplitOne"
                            target="_blank"
                        >
                            View Source Code on GitHub
                        </a>
                    </p>
                    <h2>Recent Changes</h2>
                    <div className="changelog">
                        {CHANGELOG.map((change) => (
                            <>
                                <a
                                    href={`https://github.com/LiveSplit/LiveSplitOne/commit/${change.id}`}
                                    target="_blank"
                                >
                                    {change.date}
                                </a>
                                <Markdown
                                    markdown={change.message}
                                    unsafe={true}
                                />
                            </>
                        ))}
                    </div>
                    <h2>Contributors</h2>
                    <div className="contributors">
                        {CONTRIBUTORS_LIST.map((contributor) => (
                            <a
                                href={`https://github.com/${contributor.name}`}
                                target="_blank"
                            >
                                <img
                                    src={`https://avatars.githubusercontent.com/u/${contributor.id}?s=${idealAvatarResolution}&v=4`}
                                    onError={(e) => (e.target as any).remove()}
                                />
                                {contributor.name}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    private renderSidebarContent() {
        return (
            <div className="sidebar-buttons">
                <h1>About</h1>
                <hr />
                <button onClick={(_) => this.props.callbacks.openTimerView()}>
                    <ArrowLeft strokeWidth={2.5} /> Back
                </button>
            </div>
        );
    }
}
