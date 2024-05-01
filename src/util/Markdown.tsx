import * as React from "react";
import { Parser as CommonMarkParser } from "commonmark";
import CommonMarkRenderer from "commonmark-react-renderer";
import { emoteList } from "../api/EmoteList";
import Linkifier from "react-linkifier";

export function replaceTwitchEmotes(text: string): string {
    return text.replace(/[A-Za-z0-9<):(\\;_>#/\]|]+/g, (matched) => {
        const emoteId = emoteList[matched];
        if (emoteId === undefined) {
            return matched;
        }

        const url = `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/1.0`;
        return `![${matched}](${url})`;
    });
}

export function replaceFlag(countryCode: string): JSX.Element {
    const url = `https://www.speedrun.com/images/flags/${countryCode}.png`;

    return <img className="flag" src={url} alt={countryCode} />;
}

export function renderMarkdown(markdown: string): JSX.Element {
    const markdownWithEmotes = replaceTwitchEmotes(markdown);
    const parsed = new CommonMarkParser().parse(markdownWithEmotes);
    const renderedMarkdown = new CommonMarkRenderer({
        escapeHtml: true,
        linkTarget: "_blank",
        softBreak: "br",
    }).render(parsed);

    return (
        <Linkifier target="_blank">
            {renderedMarkdown}
        </Linkifier>
    );
}
