import * as React from "react";
import { SharedTimerRef, TimingMethod } from "../livesplit-core";
import AutoRefresh from "../util/AutoRefresh";
import { Option } from "../util/OptionUtil";
import { MenuKind } from "./LiveSplit";

import LiveSplitIcon from "../assets/icon_small.png";

import "../css/SideBarContent.scss";

export interface SidebarCallbacks {
    openTimerView(remount: boolean): void,
    openSplitsView(): void,
    openLayoutView(): void,
    openAboutView(): void,
    closeRunEditor(save: boolean): void,
    closeLayoutEditor(save: boolean): void,
    openRunEditor(): void,
    saveSplits(): void,
    importSplits(): void,
    exportSplits(): void,
    openFromSplitsIO(): void,
    uploadToSplitsIO(): void,
    loadDefaultSplits(): void,
    openLayoutEditor(): void,
    saveLayout(): void,
    importLayout(): void,
    exportLayout(): void,
    loadDefaultLayout(): void,
    switchToPreviousComparison(): void,
    switchToNextComparison(): void,
    setCurrentTimingMethod(timingMethod: TimingMethod): void,
    connectToServerOrDisconnect(): void,
    openSettingsEditor(): void,
    closeSettingsEditor(save: boolean): void,
}

export interface Props {
    menu: MenuKind,
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
    constructor(props: Props) {
        super(props);

        this.state = {
            comparison: null,
            timingMethod: null,
        };
    }

    public render() {
        let sidebarContent;

        switch (this.props.menu) {
            case MenuKind.Splits: {
                sidebarContent = (
                    <div className="sidebar-buttons">
                        <h1>Splits</h1>
                        <hr />
                        <button onClick={(_) => this.props.callbacks.openRunEditor()}>
                            <i className="fa fa-edit" aria-hidden="true" /> Edit
                        </button>
                        <button onClick={(_) => this.props.callbacks.saveSplits()}>
                            <i className="fa fa-save" aria-hidden="true" /> Save
                        </button>
                        <button onClick={(_) => this.props.callbacks.importSplits()}>
                            <i className="fa fa-download" aria-hidden="true" /> Import
                        </button>
                        <button onClick={(_) => this.props.callbacks.exportSplits()}>
                            <i className="fa fa-upload" aria-hidden="true" /> Export
                        </button>
                        <button onClick={(_) => this.props.callbacks.openFromSplitsIO()}>
                            <i className="fa fa-download" aria-hidden="true" /> From Splits.io
                        </button>
                        <button onClick={(_) => this.props.callbacks.uploadToSplitsIO()}>
                            <i className="fa fa-upload" aria-hidden="true" /> Upload to Splits.io
                        </button>
                        <button onClick={(_) => this.props.callbacks.loadDefaultSplits()}>
                            <i className="fa fa-sync" aria-hidden="true" /> Default
                        </button>
                        <hr />
                        <button onClick={(_) => this.props.callbacks.openTimerView(false)}>
                            <i className="fa fa-caret-left" aria-hidden="true" /> Back
                        </button>
                    </div>
                );
                break;
            }
            case MenuKind.RunEditor: {
                sidebarContent = (
                    <div className="sidebar-buttons">
                        <h1>Splits Editor</h1>
                        <hr />
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
                break;
            }
            case MenuKind.Layout: {
                sidebarContent = (
                    <div className="sidebar-buttons">
                        <h1>Layout</h1>
                        <hr />
                        <button onClick={(_) => this.props.callbacks.openLayoutEditor()}>
                            <i className="fa fa-edit" aria-hidden="true" /> Edit
                        </button>
                        <button onClick={(_) => this.props.callbacks.saveLayout()}>
                            <i className="fa fa-save" aria-hidden="true" /> Save
                        </button>
                        <button onClick={(_) => this.props.callbacks.importLayout()}>
                            <i className="fa fa-download" aria-hidden="true" /> Import
                        </button>
                        <button onClick={(_) => this.props.callbacks.exportLayout()}>
                            <i className="fa fa-upload" aria-hidden="true" /> Export
                        </button>
                        <button onClick={(_) => this.props.callbacks.loadDefaultLayout()}>
                            <i className="fa fa-sync" aria-hidden="true" /> Default
                        </button>
                        <hr />
                        <button onClick={(_) => this.props.callbacks.openTimerView(false)}>
                            <i className="fa fa-caret-left" aria-hidden="true" /> Back
                        </button>
                    </div>
                );
                break;
            }
            case MenuKind.LayoutEditor: {
                sidebarContent = (
                    <div className="sidebar-buttons">
                        <h1>Layout Editor</h1>
                        <hr />
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
                break;
            }
            case MenuKind.SettingsEditor: {
                sidebarContent = (
                    <div className="sidebar-buttons">
                        <h1>Settings</h1>
                        <hr />
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
                break;
            }
            case MenuKind.About: {
                sidebarContent = (
                    <div className="sidebar-buttons">
                        <h1>About</h1>
                        <hr />
                        <button onClick={(_) => this.props.callbacks.openTimerView(true)}>
                            <i className="fa fa-caret-left" aria-hidden="true" /> Back
                        </button>
                    </div>
                );
                break;
            }
            case MenuKind.Timer: {
                sidebarContent = (
                    <div className="sidebar-buttons">
                        <div className="livesplit-title">
                            <span className="livesplit-icon">
                                <img src={LiveSplitIcon} alt="LiveSplit Logo" />
                            </span>
                            <h1> LiveSplit One</h1>
                        </div>
                        <hr className="livesplit-title-separator" />
                        <button onClick={(_) => this.props.callbacks.openSplitsView()}>
                            <i className="fa fa-list" aria-hidden="true" /> Splits
                        </button>
                        <button onClick={(_) => this.props.callbacks.openLayoutView()}>
                            <i className="fa fa-layer-group" aria-hidden="true" /> Layout
                        </button>
                        <hr />
                        <h2>Compare Against</h2>
                        <div className="choose-comparison">
                            <button
                                aria-label="Switch to Previous Comparison"
                                onClick={(_) => this.props.callbacks.switchToPreviousComparison()}
                            >
                                <i className="fa fa-caret-left" aria-hidden="true" />
                            </button>
                            <span>{this.state.comparison}</span>
                            <button
                                aria-label="Switch to Next Comparison"
                                onClick={(_) => this.props.callbacks.switchToNextComparison()}
                            >
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
                        <hr />
                        <button onClick={(_) => this.props.callbacks.openAboutView()}>
                            <i className="fa fa-info-circle" aria-hidden="true" /> About
                        </button>
                    </div >
                );
                break;
            }
        }
        return (
            <AutoRefresh update={() => this.update()}>
                {sidebarContent}
            </AutoRefresh>
        );
    }

    private update() {
        if (this.props.menu === MenuKind.Timer && this.props.sidebarOpen) {
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
