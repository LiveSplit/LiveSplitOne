import * as React from "react";
import { getSplitsInfos, SplitsInfo, storeSplits, deleteSplits, copySplits, loadSplits } from "../storage";
import { Run, Segment, SharedTimerRef } from "../livesplit-core";
import * as SplitsIO from "../util/SplitsIO";
import { toast } from "react-toastify";
import { openFileAsArrayBuffer } from "../util/FileUtil";
import { maybeDisposeAndThen } from "../util/OptionUtil";

import "../css/SplitsSelection.scss";

export interface Props {
    timer: SharedTimerRef,
    originalOpenedSplitsKey?: number,
    callbacks: Callbacks,
}

interface State {
    splitsInfos?: Array<[number, SplitsInfo]>,
    openedSplitsKey?: number,
}

interface Callbacks {
    openTimerView(arg0: boolean): void;
    loadDefaultSplits(): void;
    uploadToSplitsIO(): void;
    openFromSplitsIO(): void;
    exportSplits(): void;
    importSplits(): void;
    saveSplits(): void;
    openRunEditor(): void;
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
}

export class SplitsSelection extends React.Component<Props, State> {
    constructor(props: Props) {
        getSplitsInfos().then(async (splitsInfos) => {
            this.setState({
                splitsInfos,
            });
        });

        super(props);

        this.state = {
            openedSplitsKey: props.originalOpenedSplitsKey,
        };
    }

    public render() {
        const renderedView = this.renderView();
        const sidebarContent = this.renderSidebarContent();
        return this.props.callbacks.renderViewWithSidebar(renderedView, sidebarContent);
    }

    private renderView() {
        let content;

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
                    <div className="splits-table">
                        <div className="header-text">Active Splits</div>
                        <div className="splits-rows">
                            {
                                this.state.splitsInfos
                                    .filter(([key]) => key === this.state.openedSplitsKey)
                                    .map(([key, info]) => this.renderActiveSplitsRow(key, info))
                            }
                        </div>
                    </div>
                    <div className="splits-table">
                        <div className="header-text">Other Splits</div>
                        <div className="splits-rows">
                            {
                                this.state.splitsInfos
                                    .filter(([key]) => key !== this.state.openedSplitsKey)
                                    .map(([key, info]) => this.renderOtherSplitsRow(key, info))
                            }
                        </div>
                    </div>
                </div>
            );
        }
        return <div className="splits-selection">{content}</div>;
    }

    private renderActiveSplitsRow(key: number, info: SplitsInfo) {
        return (
            <div className="splits-row" key={key}>
                {this.splitsTitle(info)}
                <div className="splits-row-buttons">
                    <button onClick={() => this.editSplits(key)}>
                        <i aria-label="Edit Splits" className="fa fa-edit" aria-hidden="true" />
                    </button>
                    <button aria-label="Duplicate Splits" onClick={() => this.copySplits(key)}>
                        <i className="fa fa-clone" aria-hidden="true" />
                    </button>
                </div>
            </div>
        );
    }

    private renderOtherSplitsRow(key: number, info: SplitsInfo) {
        return (
            <div className="splits-row" key={key}>
                {this.splitsTitle(info)}
                <div className="splits-row-buttons">
                    <button aria-label="Open Splits" onClick={() => this.openSplits(key)}>
                        <i className="fa fa-folder-open" aria-hidden="true" />
                    </button>
                    <button aria-label="Edit Splits" onClick={() => this.editSplits(key)}>
                        <i className="fa fa-edit" aria-hidden="true" />
                    </button>
                    <button aria-label="Duplicate Splits" onClick={() => this.copySplits(key)}>
                        <i className="fa fa-clone" aria-hidden="true" />
                    </button>
                    <button aria-label="Remove Splits" onClick={() => this.deleteSplits(key)}>
                        <i className="fa fa-trash" aria-hidden="true" />
                    </button>
                </div>
            </div>
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
                <button onClick={(_) => this.props.callbacks.openTimerView(true)}>
                    <i className="fa fa-caret-left" aria-hidden="true" /> Back
                </button>
            </div>
        );
    }

    private async refreshState() {
        this.setState({
            splitsInfos: await getSplitsInfos(),
        });
    }

    private async openSplits(key: number) {
        const splitsData = await loadSplits(key);
        if (splitsData === undefined) {
            // TODO: This should never happen. Maybe show an error / use expect?
            return;
        }

        // TODO: Manually accessing the timer like this has two disadvantages:
        // 1. This is copy paste from LiveSplit.tsx for the most part.
        // 2. We don't communicate back the new splits key yet.
        const result = Run.parseArray(new Uint8Array(splitsData), "", false);
        try {
            if (result.parsedSuccessfully()) {
                const run = result.unwrap();
                maybeDisposeAndThen(
                    this.props.timer.writeWith((timer) => timer.setRun(run)),
                    () => toast.error("The loaded splits are invalid."),
                );
                this.setState({ openedSplitsKey: key });
            } else {
                throw Error("Couldn't parse the splits.");
            }
        } finally {
            result.dispose();
        }
    }

    private editSplits(_key: number): void {
        throw new Error("Method not implemented.");
    }

    private async copySplits(key: number) {
        await copySplits(key);
        await this.refreshState();
    }

    private async deleteSplits(key: number) {
        // TODO: We probably want to ask for confirmation here.
        await deleteSplits(key);
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
            await storeSplits(
                (callback) => {
                    callback(run, run.saveAsLssBytes());
                },
                undefined,
            );
            await this.refreshState();
        } finally {
            run.dispose();
        }
    }
}
