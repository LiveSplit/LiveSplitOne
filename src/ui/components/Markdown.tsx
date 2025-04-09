import * as React from "react";
import markdownit from "markdown-it";
import { emoteList } from "../../api/EmoteList";

import * as classes from "../../css/Markdown.module.scss";

const UNSAFE = markdownit({ html: true, breaks: false, linkify: true });
const SAFE = markdownit({ html: false, breaks: true, linkify: true });
let isSpeedrunCom = false;

const unsafeDefault =
    UNSAFE.renderer.rules.link_open ||
    function (tokens, idx, options, _env, self) {
        return self.renderToken(tokens, idx, options);
    };
UNSAFE.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrSet("target", "_blank");
    return unsafeDefault(tokens, idx, options, env, self);
};

const safeLinkDefault =
    SAFE.renderer.rules.link_open ||
    function (tokens, idx, options, _env, self) {
        return self.renderToken(tokens, idx, options);
    };
SAFE.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrSet("target", "_blank");
    return safeLinkDefault(tokens, idx, options, env, self);
};
const safeImageDefault =
    SAFE.renderer.rules.image ||
    function (tokens, idx, options, _env, self) {
        return self.renderToken(tokens, idx, options);
    };
SAFE.renderer.rules.image = function (tokens, idx, options, env, self) {
    if (isSpeedrunCom) {
        const src = tokens[idx].attrGet("src");
        if (src?.startsWith("/")) {
            tokens[idx].attrSet("src", `https://www.speedrun.com${src}`);
        }
    }
    return safeImageDefault(tokens, idx, options, env, self);
};

function replaceTwitchEmotes(text: string): string {
    return text.replace(/[A-Za-z0-9<):(\\;_>#/\]|]+/g, (matched) => {
        const emoteId = emoteList[matched];
        if (emoteId === undefined) {
            return matched;
        }

        const url = `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/1.0`;
        return `![${matched}](${url})`;
    });
}

export function replaceFlag(countryCode: string): React.JSX.Element {
    const url = `https://www.speedrun.com/images/flags/${countryCode}.png`;

    return <img className={classes.flag} src={url} alt={countryCode} />;
}

export const Markdown = React.memo(renderMarkdown);

export function renderMarkdown({
    markdown,
    unsafe,
    speedrunCom,
}: {
    markdown: string;
    unsafe?: boolean;
    speedrunCom?: boolean;
}): React.JSX.Element {
    isSpeedrunCom = speedrunCom ?? false;
    const markdownWithEmotes = replaceTwitchEmotes(markdown);
    const html = (unsafe ? UNSAFE : SAFE).render(markdownWithEmotes);

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
