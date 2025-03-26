import * as React from "react";
import { Option } from "../../../util/OptionUtil";
import { LiveSplitServer } from "../../../api/LiveSplitServer";

import "../../../css/LiveSplitServerButton.scss";

export function ServerConnectionButton({
    value,
    connectOrDisconnect,
}: {
    value: {
        url: string | undefined;
        connection: Option<LiveSplitServer>;
    };
    connectOrDisconnect: () => void;
}) {
    return (
        <div className="settings-value-box">
            <button
                className="livesplit-server-button"
                onClick={connectOrDisconnect}
            >
                {(() => {
                    const connectionState =
                        value.connection?.getConnectionState() ??
                        WebSocket.CLOSED;
                    switch (connectionState) {
                        case WebSocket.OPEN:
                            return <div>Disconnect</div>;
                        case WebSocket.CLOSED:
                            return <div>Connect</div>;
                        case WebSocket.CONNECTING:
                            return <div>Connecting...</div>;
                        case WebSocket.CLOSING:
                            return <div>Disconnecting...</div>;
                        default:
                            throw new Error("Unknown WebSocket State");
                    }
                })()}
            </button>
        </div>
    );
}
