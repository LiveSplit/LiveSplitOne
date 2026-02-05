import * as React from "react";

import LiveSplitIcon from "../../assets/icon.svg";
import { Markdown } from "../components/Markdown";
import { ArrowLeft } from "lucide-react";
import { GeneralSettings } from "./MainSettings";
import { formatDate, getLocale, Label, resolve } from "../../localization";

import * as variables from "../../css/variables.icss.scss";
import * as classes from "../../css/About.module.scss";
import { Language, Lang } from "../../livesplit-core";

interface Callbacks {
    renderViewWithSidebar(
        renderedView: React.JSX.Element,
        sidebarContent: React.JSX.Element,
    ): React.JSX.Element;
    openTimerView(): void;
}

const contributorAvatarSize = parseFloat(variables.contributorAvatarSize);

export function About({
    callbacks,
    generalSettings,
}: {
    callbacks: Callbacks;
    generalSettings: GeneralSettings;
}) {
    return callbacks.renderViewWithSidebar(
        <View lang={generalSettings.lang} />,
        <SideBar callbacks={callbacks} lang={generalSettings.lang} />,
    );
}

function View({ lang }: { lang: Language | undefined }) {
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
                        alt={resolve(Label.LiveSplitLogoAlt, lang)}
                    />
                    <div className={classes.titleText}>
                        {resolve(Label.LiveSplitOne, lang)}
                    </div>
                </div>
                <p className={classes.buildVersion}>
                    <a
                        href={`https://github.com/LiveSplit/LiveSplitOne/commit/${COMMIT_HASH}`}
                        target="_blank"
                    >
                        {resolve(Label.AboutVersionPrefix, lang)} {BUILD_DATE}
                    </a>
                </p>
                <p>{resolve(Label.AboutDescription, lang)}</p>
                <p>
                    <a
                        href="https://github.com/LiveSplit/LiveSplitOne"
                        target="_blank"
                    >
                        {resolve(Label.AboutViewSource, lang)}
                    </a>
                </p>
                <h2>{resolve(Label.AboutRecentChanges, lang)}</h2>
                <div className={classes.changelog}>
                    {CHANGELOG.map((change) => (
                        <>
                            <a
                                href={`https://github.com/LiveSplit/LiveSplitOne/commit/${change.id}`}
                                target="_blank"
                            >
                                {formatDate(change.date, lang)}
                            </a>
                            <Markdown
                                markdown={resolveChangelogMessage(change, lang)}
                                unsafe={true}
                            />
                        </>
                    ))}
                </div>
                <h2>{resolve(Label.AboutContributors, lang)}</h2>
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

function resolveChangelogMessage(
    change: ChangelogEntry,
    lang: Language | undefined,
): string {
    if (!change.messages) {
        return change.message;
    }

    let locale = getLocale(lang);

    let exact = change.messages[locale];
    if (exact) {
        return exact;
    }

    locale = getLocale(Lang.parseLocale(locale));

    exact = change.messages[locale];
    if (exact) {
        return exact;
    }

    const base = locale.split("-")[0];
    const baseMatch = change.messages[base];
    if (baseMatch) {
        return baseMatch;
    }

    return change.messages.en ?? change.message;
}

function SideBar({
    callbacks,
    lang,
}: {
    callbacks: Callbacks;
    lang: Language | undefined;
}) {
    return (
        <>
            <h1>{resolve(Label.About, lang)}</h1>
            <hr />
            <button onClick={() => callbacks.openTimerView()}>
                <ArrowLeft strokeWidth={2.5} />
                {resolve(Label.Back, lang)}
            </button>
        </>
    );
}
