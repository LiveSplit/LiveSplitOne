import * as React from "react";
import { SharedTimerRef, TimingMethod } from "../livesplit";
import { Option } from "../util/OptionUtil";

import "../css/SideBarContent.scss";

export type Route = "main" | "run-editor" | "layout-editor" | "settings-editor";

export interface SidebarCallbacks {
    closeRunEditor(save: boolean): void,
    closeLayoutEditor(save: boolean): void,
    openRunEditor(): void,
    saveSplits(): void,
    importSplits(): void,
    exportSplits(): void,
    openFromSplitsIO(): void,
    uploadToSplitsIO(): void,
    openLayoutEditor(): void,
    saveLayout(): void,
    importLayout(): void,
    exportLayout(): void,
    switchToPreviousComparison(): void,
    switchToNextComparison(): void,
    setCurrentTimingMethod(timingMethod: TimingMethod): void,
    connectToServerOrDisconnect(): void,
    openSettingsEditor(): void,
    closeSettingsEditor(save: boolean): void,
}

export interface Props {
    route: Route,
    callbacks: SidebarCallbacks,
    timer: SharedTimerRef,
    sidebarOpen: boolean,
    connectionState: number,
}

export interface State {
    comparison: Option<string>,
    timingMethod: Option<TimingMethod>,
}

export class SideBarContent extends React.Component<Props, State> {
    private intervalID: any;

    constructor(props: Props) {
        super(props);

        this.state = {
            comparison: null,
            timingMethod: null,
        };
    }

    public componentWillMount() {
        this.intervalID = setInterval(
            () => this.update(),
            1000 / 30,
        );
    }

    public componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    public render() {
        switch (this.props.route) {
            case "run-editor": {
                return (
                    <div className="sidebar-buttons">
                        <div className="small">
                            <button
                                className="toggle-left"
                                onClick={(_) => this.props.callbacks.closeRunEditor(true)}
                            >
                                <i className="fa fa-check" aria-hidden="true" /> OK
                            </button>
                            <button
                                className="toggle-right"
                                onClick={(_) => this.props.callbacks.closeRunEditor(false)}
                            >
                                <i className="fa fa-times" aria-hidden="true" /> Cancel
                            </button>
                        </div>
                    </div>
                );
            }
            case "layout-editor": {
                return (
                    <div className="sidebar-buttons">
                        <div className="small">
                            <button
                                className="toggle-left"
                                onClick={(_) => this.props.callbacks.closeLayoutEditor(true)}
                            >
                                <i className="fa fa-check" aria-hidden="true" /> OK
                            </button>
                            <button
                                className="toggle-right"
                                onClick={(_) => this.props.callbacks.closeLayoutEditor(false)}
                            >
                                <i className="fa fa-times" aria-hidden="true" /> Cancel
                            </button>
                        </div>
                    </div>
                );
            }
            case "settings-editor": {
                return (
                    <div className="sidebar-buttons">
                        <div className="small">
                            <button
                                className="toggle-left"
                                onClick={(_) => this.props.callbacks.closeSettingsEditor(true)}
                            >
                                <i className="fa fa-check" aria-hidden="true" /> OK
                            </button>
                            <button
                                className="toggle-right"
                                onClick={(_) => this.props.callbacks.closeSettingsEditor(false)}
                            >
                                <i className="fa fa-times" aria-hidden="true" /> Cancel
                            </button>
                        </div>
                    </div>
                );
            }
            case "main": {
                return (
                    <div className="sidebar-buttons">
                        <button onClick={(_) => this.props.callbacks.openRunEditor()}>
                            <i className="fa fa-pencil-square-o" aria-hidden="true" /> Edit Splits
                        </button>
                        <hr />
                        <button onClick={(_) => this.props.callbacks.saveSplits()}>
                            <i className="fa fa-floppy-o" aria-hidden="true" /> Save
                        </button>
                        <button onClick={(_) => this.props.callbacks.importSplits()}>
                            <i className="fa fa-download" aria-hidden="true" /> Import
                        </button>
                        <button onClick={(_) => this.props.callbacks.exportSplits()}>
                            <i className="fa fa-upload" aria-hidden="true" /> Export
                        </button>
                        <button onClick={(_) => this.props.callbacks.openFromSplitsIO()}>
                            <i className="fa fa-cloud-download" aria-hidden="true" /> From splits i/o
                        </button>
                        <button onClick={(_) => this.props.callbacks.uploadToSplitsIO()}>
                            <i className="fa fa-cloud-upload" aria-hidden="true" /> Upload to splits i/o
                        </button>
                        <hr />
                        <button onClick={(_) => this.props.callbacks.openLayoutEditor()}>
                            <i className="fa fa-pencil-square-o" aria-hidden="true" /> Edit Layout
                        </button>
                        <button onClick={(_) => this.props.callbacks.saveLayout()}>
                            <i className="fa fa-floppy-o" aria-hidden="true" /> Save Layout
                        </button>
                        <button onClick={(_) => this.props.callbacks.importLayout()}>
                            <i className="fa fa-download" aria-hidden="true" /> Import Layout
                        </button>
                        <button onClick={(_) => this.props.callbacks.exportLayout()}>
                            <i className="fa fa-upload" aria-hidden="true" /> Export Layout
                        </button>
                        <hr />
                        <h2>Compare Against</h2>
                        <div className="choose-comparison">
                            <button onClick={(_) => this.props.callbacks.switchToPreviousComparison()}>
                                <i className="fa fa-caret-left" aria-hidden="true" />
                            </button>
                            <span>{this.state.comparison}</span>
                            <button onClick={(_) => this.props.callbacks.switchToNextComparison()}>
                                <i className="fa fa-caret-right" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="small">
                            <button
                                onClick={(_) => {
                                    this.props.callbacks.setCurrentTimingMethod(TimingMethod.RealTime);
                                    this.update();
                                }}
                                className={
                                    (this.state.timingMethod === TimingMethod.RealTime ? "button-pressed" : "") +
                                    " toggle-left"
                                }
                            >
                                Real Time
                            </button>
                            <button
                                onClick={(_) => {
                                    this.props.callbacks.setCurrentTimingMethod(TimingMethod.GameTime);
                                    this.update();
                                }}
                                className={
                                    (this.state.timingMethod === TimingMethod.GameTime ? "button-pressed" : "") +
                                    " toggle-right"
                                }
                            >
                                Game Time
                            </button>
                        </div>
                        <hr />
                        <button onClick={(_) => this.props.callbacks.connectToServerOrDisconnect()}>
                            {
                                (() => {
                                    switch (this.props.connectionState) {
                                        case WebSocket.OPEN:
                                            return <div>
                                                <i className="fa fa-power-off" aria-hidden="true" /> Disconnect
                                            </div>;
                                        case WebSocket.CLOSED:
                                            return <div>
                                                <i className="fa fa-desktop" aria-hidden="true" /> Connect to Server
                                            </div>;
                                        case WebSocket.CONNECTING:
                                            return <div>Connecting...</div>;
                                        case WebSocket.CLOSING:
                                            return <div>Disconnecting...</div>;
                                        default: throw new Error("Unknown WebSocket State");
                                    }
                                })()
                            }
                        </button>
                        <button onClick={() => this.props.callbacks.openSettingsEditor()}>
                            <i className="fa fa-cog" aria-hidden="true" /> Settings
                        </button>
                    </div >
                );
            }
        }
    }

    private update() {
        if (this.props.route === "main" && this.props.sidebarOpen) {
            const [comparison, timingMethod] = this.props.timer.readWith((t): [string, number] => {
                return [
                    t.currentComparison(),
                    t.currentTimingMethod(),
                ];
            });

            if (comparison !== this.state.comparison || timingMethod !== this.state.timingMethod) {
                this.setState({
                    ...this.state,
                    comparison,
                    timingMethod,
                });
            }
        }
    }
}
