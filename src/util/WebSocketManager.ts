import { expect } from './OptionUtil';
import { ToastContent } from 'react-toastify';

type TimerActions = {
    start: () => void,
    split: () => void,
    splitOrStart: () => void,
    reset: () => void,
    undoSplit: () => void,
    skip: () => void,
    initGameTime: () => void,
    setGameTime: (gameTime: string) => void,
    setLoadingTimes: (loadingTime: string) => void,
    pauseGameTime: () => void,
    resumeGameTime: () => void,
    getCurrentTime: (valueCallback: ((totalSeconds: number) => void)) => void,
    getCurrentPhase: (valueCallback: ((phase: number) => void)) => void,
    togglePause: () => void
};

type UIActions = {
    info: (message: string | ToastContent) => void,
    error: (message: string | ToastContent) => void
};

export class WebSocketManager {

    ws: WebSocket | null = null;
    actions!: TimerActions;
    uiActions!: UIActions;

    public constructor(actions: TimerActions, uiActions: UIActions) {
        this.actions = actions;
        this.uiActions = uiActions;
        return this;
    }

    public connectToServer() {
        const url = prompt("Enter Websocket server address");
        if (url) {
            this.setupWebSocket(url);
        }
    }

    private setupWebSocket(url: string) {
        this.ws = new WebSocket(url);
        this.ws.onopen = () => this.uiActions.info("Connected to websocket");
        this.ws.onmessage = this.handleCommand.bind(this);
        this.ws.onclose = () => {
            this.disconnect();
        };
        this.ws.onerror = (e: Event) => this.uiActions.error(e);
    }

    public disconnect() {
        this.uiActions.error("Disconnected from websocket");
        this.ws = null;
    }

    public connectionState() {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }

    private handleCommand(e: MessageEvent) {
        if (typeof e.data === "string") {
            const [command, ...args] = e.data.split(" ");
            switch (command) {
                case "starttimer": this.actions.start(); break;
                case "getcurrenttime": this.getAndSendCurrentTime(); break;
                case "getcurrenttimerphase": this.getAndSendCurrentPhase(); break;
                case "split": this.actions.split(); break;
                case "splitorstart": this.actions.splitOrStart(); break;
                case "reset": this.actions.reset(); break;
                case "pause":
                case "resume":
                case "togglepause": this.actions.togglePause(); break; // These are different aliases for the same command
                case "unsplit": this.actions.undoSplit(); break;
                case "skipsplit": this.actions.skip(); break;
                case "initgametime": this.actions.initGameTime(); break;
                case "setgametime": this.actions.setGameTime(args[0]); break;
                case "setloadingtimes": this.actions.setLoadingTimes(args[0]); break;
                case "pausegametime": this.actions.pauseGameTime(); break;
                case "resumegametime": this.actions.resumeGameTime(); break;
            }
        }
    }

    private getAndSendCurrentTime() {
        this.actions.getCurrentTime((time) => {
            this.sendResponse(this.formatTimeForServer(time));
        });
    }

    private getAndSendCurrentPhase() {
        this.actions.getCurrentPhase((phase) => {
            this.sendResponse(this.mapPhaseEnumToString(phase));
        });
    }

    private sendResponse(value: string) {
        this.ws?.send(value);
    }

    private mapPhaseEnumToString(phase: number) : string {
        const phases = ["NotRunning", "Running", "Ended", "Paused"];
        return expect(phases[phase], "Invalid Phase");
    }

    private formatTimeForServer(totalSeconds: number): string {
        const seconds = totalSeconds % 60;
        const totalMinutes = Math.floor(totalSeconds / 60);
        const minutes = totalMinutes % 60;
        const hours = Math.floor(totalMinutes / 60);
        const twoDigitString = (n: number) => n.toLocaleString('en-gb', { minimumIntegerDigits: 2});
        const secondsWithMilliseconds = (n: number) => n.toLocaleString('en-gb', {minimumIntegerDigits: 2, minimumFractionDigits: 2, maximumFractionDigits: 2});
        if (hours > 0) {
            return `${twoDigitString(hours)}:${twoDigitString(minutes)}:${secondsWithMilliseconds(seconds)}`;
        }
        return `${twoDigitString(minutes)}:${secondsWithMilliseconds(seconds)}`;
    }
}
