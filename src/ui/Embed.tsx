import * as React from "react";
import { Option } from "../util/OptionUtil";

export function resolveEmbed(uri: string): Option<React.JSX.Element> {
    const youtube = tryYoutubeFromUri(uri);
    if (youtube != null) {
        return youtube;
    }
    const twitch = tryTwitchFromUri(uri);
    if (twitch != null) {
        return twitch;
    }
    return <p><a href={uri} target="_blank">{uri}</a></p>;
}

function tryYoutubeFromUri(uri: string): Option<React.JSX.Element> {
    const youtubeBase = /https?:\/\/www\.youtube\.com\/watch\?v=([A-z0-9-]+)&?/;
    let result = youtubeBase.exec(uri);
    if (result === null) {
        const youtubeBase2 = /https?:\/\/youtu\.be\/([A-z0-9-]+)/;
        result = youtubeBase2.exec(uri);
    }
    if (result !== null) {
        return resolveYoutube(result[1]);
    }
    return null;
}

function tryTwitchFromUri(uri: string): Option<React.JSX.Element> {
    const twitchBase = /https?:\/\/(www\.)?(go\.)?twitch\.tv\/.*\/v\/(\w+)&?/;
    const twitchBase2 = /https?:\/\/(www\.)?(go\.)?twitch\.tv\/videos\/(\w+)&?/;
    let result = twitchBase.exec(uri);
    if (result === null) {
        result = twitchBase2.exec(uri);
    }
    if (result !== null) {
        return resolveTwitch(result[3]);
    }
    return null;
}

function videoIframe(videoSource: string): React.JSX.Element {
    return (
        <div className="video-outer-container">
            <div className="video-inner-container">
                <iframe
                    id="ytplayer"
                    itemType="text/html"
                    src={videoSource}
                    allowFullScreen
                    frameBorder="0"
                />
            </div>
        </div>
    );
}

function resolveYoutube(videoId: string): React.JSX.Element {
    return videoIframe(`https://www.youtube.com/embed/${videoId}?wmode=transparent`);
}

function resolveTwitch(videoId: string): React.JSX.Element {
    const domain = window.location.hostname;
    return videoIframe(`https://player.twitch.tv/?video=${videoId}&parent=${domain}&autoplay=false`);
}
