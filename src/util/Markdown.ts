import { Parser as CommonMarkParser } from "commonmark";
import CommonMarkRenderer = require("commonmark-react-renderer");
import { replaceTwitchEmotes } from "../api/GameList";

export function renderMarkdown(markdown: string): JSX.Element {
    const markdownWithEmotes = replaceTwitchEmotes(markdown);
    const parsed = new CommonMarkParser().parse(markdownWithEmotes);
    return new CommonMarkRenderer({
        escapeHtml: true,
        linkTarget: "_blank",
        softBreak: "br",
    }).render(parsed);
}
