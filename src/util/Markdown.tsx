import * as React from "react";
import { Parser as CommonMarkParser } from "commonmark";
import CommonMarkRenderer from "commonmark-react-renderer";
import { emoteList } from "../api/EmoteList";
import Twemoji from "react-twemoji";
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

export function replaceFlag(text: string): JSX.Element {
    return (
        <Twemoji className="inline-div" options={{ className: "flag" }}>
            {
                text.replace(/\[([a-z]{2})[a-z/]*\]/g, (_, countryCode: string) => {
                    // We don't do any additional bounds checks, because we
                    // already ensured that there's exactly two lowercase
                    // codepoints in the range a - z via the regex, which moves
                    // them exactly in the correct regional indicator range in
                    // Unicode.
                    return String.fromCodePoint(
                        countryCode.codePointAt(0) as number + 127365,
                        countryCode.codePointAt(1) as number + 127365,
                    );
                })
            }
        </Twemoji>
    );
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
        <Twemoji options={{}}>
            <Linkifier target="_blank">
                {renderedMarkdown}
            </Linkifier>
        </Twemoji>
    );
}
