import * as React from "react";
import { Option } from "../../../util/OptionUtil";
import { LiveSplitServer } from "../../../api/LiveSplitServer";
import { Label, resolve } from "../../../localization";
import { Language } from "../../../livesplit-core";

import * as classes from "../../../css/LiveSplitServerButton.module.scss";
import * as tableClasses from "../../../css/Table.module.scss";

export function ServerConnectionButton({
    value,
    connectOrDisconnect,
    lang,
}: {
    value: {
        url: string | undefined;
        connection: Option<LiveSplitServer>;
    };
    connectOrDisconnect: () => void;
    lang: Language | undefined;
}) {
    return (
        <div className={tableClasses.settingsValueBox}>
            <button
                className={classes.liveSplitServerButton}
                onClick={connectOrDisconnect}
            >
                {(() => {
                    const connectionState =
                        value.connection?.getConnectionState() ??
                        WebSocket.CLOSED;
                    switch (connectionState) {
                        case WebSocket.OPEN:
                            return (
                                <div>
                                    {resolve(Label.ServerDisconnect, lang)}
                                </div>
                            );
                        case WebSocket.CLOSED:
                            return (
                                <div>{resolve(Label.ServerConnect, lang)}</div>
                            );
                        case WebSocket.CONNECTING:
                            return (
                                <div>
                                    {resolve(Label.ServerConnecting, lang)}
                                </div>
                            );
                        case WebSocket.CLOSING:
                            return (
                                <div>
                                    {resolve(Label.ServerDisconnecting, lang)}
                                </div>
                            );
                        default:
                            throw new Error("Unknown WebSocket State");
                    }
                })()}
            </button>
        </div>
    );
}
