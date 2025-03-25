import { toast } from "react-toastify";
import { LSOCommandSink } from "../ui/LSOCommandSink";
import { ServerProtocol } from "../livesplit-core/livesplit_core";
import { Event } from "../livesplit-core";

export class LiveSplitServer {
    private connection: WebSocket;
    private wasIntendingToDisconnect = false;

    constructor(
        url: string,
        private forceUpdate: () => void,
        onServerConnectionClosed: () => void,
        commandSink: LSOCommandSink,
    ) {
        try {
            this.connection = new WebSocket(url);
        } catch (e: any) {
            toast.error(`Failed to connect to the server: ${e.message}`);
            throw e;
        }

        forceUpdate();

        let wasConnected = false;

        this.connection.onopen = (_) => {
            wasConnected = true;
            toast.info("Connected to the server.");
            forceUpdate();
        };

        this.connection.onerror = () => {
            if (wasConnected) {
                // The onerror event does not contain any useful information.
                toast.error(
                    "An error while communicating with the server occurred.",
                );
            }
        };

        let sendQueue = Promise.resolve();

        this.connection.onmessage = (e) => {
            if (typeof e.data === "string") {
                // Handle and enqueue the command handling immediately, but send
                // the response only after all previous responses have been
                // sent.

                const promise = ServerProtocol.handleCommand(
                    e.data,
                    commandSink.getCommandSink().ptr,
                );
                sendQueue = sendQueue.then(async () => {
                    const message = await promise;
                    if (this.connection.readyState === WebSocket.OPEN) {
                        this.connection.send(message);
                    }
                });
            } else {
                sendQueue = sendQueue.then(() => {
                    this.connection.send('{"Err":{"code":"InvalidCommand"}}');
                });
            }
        };

        this.connection.onclose = (ev) => {
            const reason = ev.reason ? `: ${ev.reason}` : ".";
            if (wasConnected) {
                if (this.wasIntendingToDisconnect) {
                    toast.info("Closed the connection to the server.");
                } else {
                    toast.error(`Lost the connection to the server${reason}`);
                }
            } else {
                toast.error(`Failed to connect to the server${reason}`);
            }
            onServerConnectionClosed();
            forceUpdate();
        };
    }

    public close(): void {
        if (this.connection.readyState === WebSocket.OPEN) {
            this.wasIntendingToDisconnect = true;
            this.connection.close();
            this.forceUpdate();
        }
    }

    public getConnectionState(): number {
        return this.connection.readyState;
    }

    public sendEvent(event: Event) {
        if (this.connection.readyState === WebSocket.OPEN) {
            const message = ServerProtocol.encodeEvent(event);
            if (message !== undefined) {
                this.connection.send(message);
            }
        }
    }
}
