import * as React from "react";
import {
    getSplitsInfos, SplitsInfo, deleteSplits, copySplits, loadSplits,
    storeRunWithoutDisposing, storeSplitsKey,
} from "../storage";
import { Run, Segment, SharedTimerRef, TimerPhase } from "../livesplit-core";
import * as SplitsIO from "../util/SplitsIO";
import { toast } from "react-toastify";
import { openFileAsArrayBuffer, exportFile } from "../util/FileUtil";
import { maybeDisposeAndThen } from "../util/OptionUtil";

import "../css/SplitsSelection.scss";

export interface EditingInfo {
    splitsKey?: number,
    run: Run,
}

export interface Props {
    timer: SharedTimerRef,
    openedSplitsKey?: number,
    callbacks: Callbacks,
}

interface State {
    splitsInfos?: Array<[number, SplitsInfo]>,
    splitsKeyKnown: boolean,
}

interface Callbacks {
    openRunEditor: (editingInfo: EditingInfo) => void,
    setSplitsKey: (newKey?: number) => void,
    openTimerView(arg0: boolean): void;
    loadDefaultSplits(): void;
    uploadToSplitsIO(): void;
    openFromSplitsIO(): void;
    exportSplits(): void;
    importSplits(): void;
    saveSplits(): void;
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
}

export class SplitsSelection extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.refreshDb(props.openedSplitsKey !== undefined);
        this.state = {
            splitsKeyKnown: props.openedSplitsKey !== undefined,
        };
    }

    public render() {
        const renderedView = this.renderView();
        const sidebarContent = this.renderSidebarContent();
        return this.props.callbacks.renderViewWithSidebar(renderedView, sidebarContent);
    }

    private renderView() {
        let content;

        if (!this.state.splitsKeyKnown && this.props.openedSplitsKey !== undefined) {
            this.refreshDb(this.props.openedSplitsKey !== undefined);
        } else if (this.state.splitsKeyKnown && this.props.openedSplitsKey === undefined) {
            this.setState({
                splitsKeyKnown: false,
            });
        }

        if (this.state.splitsInfos == null) {
            content = (
                <div className="loading">
                    <div className="fa fa-spinner fa-spin"></div>
                    <div className="loading-text">Loading...</div>
                </div>
            );
        } else {
            content = (
                <div className="splits-selection-container">
                    <div className="main-actions">
                        <button onClick={() => this.addNewSplits()}>
                            <i className="fa fa-plus" aria-hidden="true" /> Add
                        </button>
                        <button onClick={() => this.importSplits()}>
                            <i className="fa fa-download" aria-hidden="true" /> Import
                        </button>
                        <button onClick={() => this.importSplitsFromSplitsIo()}>
                            <i className="fa fa-download" aria-hidden="true" /> From Splits.io
                        </button>
                    </div>
                    <table className="table splits-table">
                        <tbody className="splits-rows table-body">
                            {
                                this.state.splitsInfos
                                    .map(([key, info]) => this.renderSavedSplitsRow(key, info))
                            }
                        </tbody>
                    </table>
                </div>
            );
        }
        return <div className="splits-selection">{content}</div>;
    }

    private async refreshDb(splitsKeyKnown: boolean) {
        const splitsInfos = await getSplitsInfos();
        // splitsInfos.sort(([_ai, a], [_bi, b]) => {
        //     if (a.game < b.game) {
        //         return -1;
        //     }
        //     if (a.game > b.game) {
        //         return 1;
        //     }

        //     if (a.category < b.category) {
        //         return -1;
        //     }
        //     if (a.category > b.category) {
        //         return 1;
        //     }

        //     return 0;
        // });
        this.setState({
            splitsInfos,
            splitsKeyKnown,
        });
    }

    private renderSavedSplitsRow(key: number, info: SplitsInfo) {
        const isOpened = key === this.props.openedSplitsKey;
        return (
            <tr className={isOpened ? "splits-row selected" : "splits-row"} key={key}>
                <td>
                    {this.splitsTitle(info)}
                </td>
                <td className="splits-row-buttons">
                    {
                        isOpened
                            ? null
                            : <>
                                <button aria-label="Open Splits" onClick={() => this.openSplits(key)}>
                                    <i className="fa fa-folder-open" aria-hidden="true" />
                                </button>
                                <button aria-label="Edit Splits" onClick={() => this.editSplits(key)}>
                                    <i className="fa fa-edit" aria-hidden="true" />
                                </button>
                                <button aria-label="Export Splits" onClick={(_) => this.exportSplits(key, info)}>
                                    <i className="fa fa-upload" aria-hidden="true" />
                                </button>
                            </>
                    }
                    <button aria-label="Copy Splits" onClick={() => this.copySplits(key)}>
                        <i className="fa fa-clone" aria-hidden="true" />
                    </button>
                    <button aria-label="Remove Splits" onClick={() => this.deleteSplits(key)}>
                        <i className="fa fa-trash" aria-hidden="true" />
                    </button>
                </td>
            </tr>
        );
    }

    private splitsTitle(info: SplitsInfo) {
        return (
            <div className="splits-title-text">
                <div className="splits-game">{info.game}</div>
                <div className="splits-category">{info.category}</div>
            </div>
        );
    }

    private renderSidebarContent() {
        return (
            <div className="sidebar-buttons">
                <h1>Splits</h1>
                <hr />
                <button onClick={(_) => {
                    const run = this.props.timer.readWith((t) => {
                        if (t.currentPhase() === TimerPhase.NotRunning) {
                            return t.getRun().clone();
                        } else {
                            return null;
                        }
                    });
                    if (run !== null) {
                        this.props.callbacks.openRunEditor({ run });
                    } else {
                        toast.error("You can't edit your run while the timer is running.");
                    }
                }}>
                    <i className="fa fa-edit" aria-hidden="true" /> Edit
                </button>
                <button onClick={(_) => this.props.callbacks.saveSplits()}>
                    <i className="fa fa-save" aria-hidden="true" /> Save
                </button>
                {/* <button onClick={(_) => this.props.callbacks.importSplits()}>
                    <i className="fa fa-download" aria-hidden="true" /> Import
                </button> */}
                <button onClick={(_) => this.props.callbacks.exportSplits()}>
                    <i className="fa fa-upload" aria-hidden="true" /> Export
                </button>
                {/* <button onClick={(_) => this.props.callbacks.openFromSplitsIO()}>
                    <i className="fa fa-download" aria-hidden="true" /> From Splits.io
                </button> */}
                <button onClick={(_) => this.props.callbacks.uploadToSplitsIO()}>
                    <i className="fa fa-upload" aria-hidden="true" /> Upload to Splits.io
                </button>
                {/* <button onClick={(_) => this.props.callbacks.loadDefaultSplits()}>
                    <i className="fa fa-sync" aria-hidden="true" /> Default
                </button> */}
                <hr />
                <button onClick={(_) => this.props.callbacks.openTimerView(true)}>
                    <i className="fa fa-caret-left" aria-hidden="true" /> Back
                </button>
            </div>
        );
    }

    private async refreshState() {
        await this.refreshDb(this.state.splitsKeyKnown);
    }

    private async getRunFromKey(key: number): Promise<Run> {
        const splitsData = await loadSplits(key);
        if (splitsData === undefined) {
            throw Error("The splits key is invalid.");
        }

        // TODO: Manually accessing the timer like this has two disadvantages:
        // 1. This is copy paste from LiveSplit.tsx for the most part.
        // 2. We don't communicate back the new splits key yet.
        return Run.parseArray(new Uint8Array(splitsData), "", false).with((result) => {
            if (result.parsedSuccessfully()) {
                return result.unwrap();
            } else {
                throw Error("Couldn't parse the splits.");
            }
        });
    }

    private async openSplits(key: number) {
        const run = await this.getRunFromKey(key);
        run.with((run) => {
            maybeDisposeAndThen(
                this.props.timer.writeWith((timer) => timer.setRun(run)),
                () => toast.error("The loaded splits are invalid."),
            );
        });
        this.props.callbacks.setSplitsKey(key);
    }

    private async exportSplits(key: number, info: SplitsInfo) {
        try {
            const splitsData = await loadSplits(key);
            if (splitsData === undefined) {
                throw Error("The splits key is invalid.");
            }

            exportFile(`${info.game} - ${info.category}.lss`, splitsData);
        } catch (_) {
            toast.error("Failed to export the splits.");
        }
    }

    private async editSplits(splitsKey: number) {
        const run = await this.getRunFromKey(splitsKey);
        this.props.callbacks.openRunEditor({ splitsKey, run });
    }

    private async copySplits(key: number) {
        await copySplits(key);
        await this.refreshState();
    }

    private async deleteSplits(key: number) {
        // TODO: We probably want to ask for confirmation here.
        await deleteSplits(key);
        if (key === this.props.openedSplitsKey) {
            this.props.callbacks.setSplitsKey(undefined);
            storeSplitsKey(undefined);
        }
        await this.refreshState();
    }

    private async importSplits() {
        const splits = await openFileAsArrayBuffer();
        try {
            await this.importSplitsFromArrayBuffer(splits);
        } catch (err) {
            toast.error(err.message);
        }
    }

    private async importSplitsFromArrayBuffer(buffer: [ArrayBuffer, File]) {
        const [file] = buffer;
        const result = Run.parseArray(new Uint8Array(file), "", false);
        try {
            if (result.parsedSuccessfully()) {
                await this.storeRun(result.unwrap());
            } else {
                throw Error("Couldn't parse the splits.");
            }
        } finally {
            result.dispose();
        }
    }

    private async importSplitsFromSplitsIo() {
        let id = prompt("Specify the Splits.io URL or ID:");
        if (!id) {
            return;
        }
        if (id.indexOf("https://splits.io/") === 0) {
            id = id.substr("https://splits.io/".length);
        }
        try {
            const run = await SplitsIO.downloadById(id);
            await this.storeRun(run);
        } catch (_) {
            toast.error("Failed to download the splits.");
        }
    }

    private async addNewSplits() {
        // TODO: This is mostly copy paste atm.
        const run = Run.new();
        run.pushSegment(Segment.new("Time"));
        await this.storeRun(run);
    }

    private async storeRun(run: Run) {
        try {
            if (run.len() === 0) {
                toast.error("Can't import empty splits.");
                return;
            }
            await storeRunWithoutDisposing(run, undefined);
            await this.refreshState();
        } finally {
            run.dispose();
        }
    }
}
