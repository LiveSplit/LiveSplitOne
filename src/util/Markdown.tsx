import * as React from "react";
import { Parser as CommonMarkParser } from "commonmark";
import CommonMarkRenderer from "commonmark-react-renderer";
import * as emojilib from "emojilib";
import { emoteList } from "../api/EmoteList";
import Twemoji from "react-twemoji";
import Linkifier from "react-linkifier";

export function replaceTwitchEmotes(text: string): string {
    return text.replace(/[A-Za-z0-9<):(\\;_>#/\]|]+/g, (matched) => {
        const emoteId = emoteList[matched];
        if (emoteId == null) {
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
                text.replace(/\[([A-Za-z/]{2,})\]/g, (_, emojiName: string) => {
                    emojiName = emojiName.substr(0, 2).toLowerCase();
                    if (emojiName === "gb") {
                        emojiName = "uk";
                    }
                    const emoji = emojilib.lib[emojiName];
                    if (emoji == null || emoji.keywords.indexOf("flag") < 0) {
                        const emoji = Object.values(emojilib.lib)
                            .find((e) => e.keywords.indexOf(emojiName) >= 0 && e.keywords.indexOf("flag") >= 0);
                        if (emoji != null) {
                            return emoji.char;
                        }
                        return "";
                    }
                    return emoji.char;
                })
            }
        </Twemoji>
    );
}

export function replaceEmojis(text: string): string {
    return text.replace(/:([A-Za-z0-9_]+):/g, (matched, emojiName) => {
        const emoji = emojilib.lib[emojiName];
        if (emoji == null) {
            return matched;
        }
        return emoji.char;
    });
}

export function renderMarkdown(markdown: string): JSX.Element {
    const markdownWithEmoji = replaceEmojis(markdown);
    const markdownWithEmotes = replaceTwitchEmotes(markdownWithEmoji);
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
