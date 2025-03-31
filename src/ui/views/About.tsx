import * as React from "react";

import LiveSplitIcon from "../../assets/icon.svg";
import { Markdown } from "../../util/Markdown";
import { ArrowLeft } from "lucide-react";

import * as variables from "../../css/variables.icss.scss";
import * as classes from "../../css/About.module.scss";

interface Callbacks {
    renderViewWithSidebar(
        renderedView: React.JSX.Element,
        sidebarContent: React.JSX.Element,
    ): React.JSX.Element;
    openTimerView(): void;
}

const contributorAvatarSize = parseFloat(variables.contributorAvatarSize);

export function About({ callbacks }: { callbacks: Callbacks }) {
    const renderedView = renderView();
    const sidebarContent = renderSidebarContent(callbacks);
    return callbacks.renderViewWithSidebar(renderedView, sidebarContent);
}

function renderView() {
    const idealAvatarResolution = Math.round(
        devicePixelRatio * contributorAvatarSize,
    );

    return (
        <div className={classes.about}>
            <div className={classes.aboutInnerContainer}>
                <div className={classes.liveSplitTitle}>
                    <img
                        className={classes.liveSplitIcon}
                        src={LiveSplitIcon}
                        alt="LiveSplit Logo"
                    />
                    <div className={classes.titleText}>LiveSplit One</div>
                </div>
                <p className={classes.buildVersion}>
                    <a
                        href={`https://github.com/LiveSplit/LiveSplitOne/commit/${COMMIT_HASH}`}
                        target="_blank"
                    >
                        Version: {BUILD_DATE}
                    </a>
                </p>
                <p>
                    LiveSplit One is a multiplatform version of LiveSplit, the
                    sleek, highly-customizable timer for speedrunners.
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
                <div className={classes.changelog}>
                    {CHANGELOG.map((change) => (
                        <>
                            <a
                                href={`https://github.com/LiveSplit/LiveSplitOne/commit/${change.id}`}
                                target="_blank"
                            >
                                {change.date}
                            </a>
                            <Markdown markdown={change.message} unsafe={true} />
                        </>
                    ))}
                </div>
                <h2>Contributors</h2>
                <div className={classes.contributors}>
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

function renderSidebarContent(callbacks: Callbacks) {
    return (
        <>
            <h1>About</h1>
            <hr />
            <button onClick={(_) => callbacks.openTimerView()}>
                <ArrowLeft strokeWidth={2.5} /> Back
            </button>
        </>
    );
}
