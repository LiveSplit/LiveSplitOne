import { toast } from "react-toastify";

interface Callbacks {
    start(): void,
    split(): void,
    splitOrStart(): void,
    reset(): void,
    togglePauseOrStart(): void,
    undoSplit(): void,
    skipSplit(): void,
    initializeGameTime(): void,
    setGameTime(time: string): void,
    setLoadingTimes(time: string): void,
    pauseGameTime(): void,
    resumeGameTime(): void,
    forceUpdate(): void,
    onServerConnectionClosed(): void;
}

export class LiveSplitServer {
    private connection: WebSocket;
    private wasIntendingToDisconnect = false;

    constructor(
        url: string,
        private callbacks: Callbacks,
    ) {
        try {
            this.connection = new WebSocket(url);
        } catch (e: any) {
            toast.error(`Failed to connect to the server: ${e.message}`);
            throw e;
        }

        callbacks.forceUpdate();

        let wasConnected = false;

        this.connection.onopen = (_) => {
            wasConnected = true;
            toast.info("Connected to the server.");
            callbacks.forceUpdate();
        };

        this.connection.onerror = (e) => {
            toast.error(e);
        };

        this.connection.onmessage = (e) => {
            if (typeof e.data === "string") {
                const [command, ...args] = e.data.split(" ");
                switch (command) {
                    case "start": callbacks.start(); break;
                    case "split": callbacks.split(); break;
                    case "splitorstart": callbacks.splitOrStart(); break;
                    case "reset": callbacks.reset(); break;
                    case "togglepause": callbacks.togglePauseOrStart(); break;
                    case "undo": callbacks.undoSplit(); break;
                    case "skip": callbacks.skipSplit(); break;
                    case "initgametime": callbacks.initializeGameTime(); break;
                    case "setgametime": callbacks.setGameTime(args[0]); break;
                    case "setloadingtimes": callbacks.setLoadingTimes(args[0]); break;
                    case "pausegametime": callbacks.pauseGameTime(); break;
                    case "resumegametime": callbacks.resumeGameTime(); break;
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
            callbacks.onServerConnectionClosed();
            callbacks.forceUpdate();
        };
    }

    close(): void {
        if (this.connection.readyState === WebSocket.OPEN) {
            this.wasIntendingToDisconnect = true;
            this.connection.close();
            this.callbacks.forceUpdate();
        }
    }

    getConnectionState(): number {
        return this.connection.readyState;
    }
}
