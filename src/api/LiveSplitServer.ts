import { toast } from "react-toastify";
import { LSOEventSink } from "../ui/LSOEventSink";

export class LiveSplitServer {
    private connection: WebSocket;
    private wasIntendingToDisconnect = false;

    constructor(
        url: string,
        private forceUpdate: () => void,
        onServerConnectionClosed: () => void,
        eventSink: LSOEventSink,
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
            // The onerror event does not contain any useful information.
            toast.error("An error while communicating with the server occurred.");
        };

        this.connection.onmessage = (e) => {
            if (typeof e.data === "string") {
                const index = e.data.indexOf(" ");
                let command = e.data;
                let arg = "";
                if (index >= 0) {
                    command = e.data.substring(0, index);
                    arg = e.data.substring(index + 1);
                }
                switch (command) {
                    case "start": eventSink.start(); break;
                    case "split": eventSink.split(); break;
                    case "splitorstart": eventSink.splitOrStart(); break;
                    case "reset": eventSink.reset(); break;
                    case "togglepause": eventSink.togglePauseOrStart(); break;
                    case "undo": eventSink.undoSplit(); break;
                    case "skip": eventSink.skipSplit(); break;
                    case "initgametime": eventSink.initializeGameTime(); break;
                    case "setgametime": eventSink.setGameTimeString(arg ?? ""); break;
                    case "setloadingtimes": eventSink.setLoadingTimesString(arg ?? ""); break;
                    case "pausegametime": eventSink.pauseGameTime(); break;
                    case "resumegametime": eventSink.resumeGameTime(); break;
                    case "setvariable": {
                        const [key, value] = JSON.parse(arg ?? "");
                        eventSink.setCustomVariable(key, value);
                        break;
                    }
                }
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

    close(): void {
        if (this.connection.readyState === WebSocket.OPEN) {
            this.wasIntendingToDisconnect = true;
            this.connection.close();
            this.forceUpdate();
        }
    }

    getConnectionState(): number {
        return this.connection.readyState;
    }
}
