import * as React from "react";
import {
    getSplitsInfos, SplitsInfo, deleteSplits, copySplits, loadSplits,
    storeRunWithoutDisposing, storeSplitsKey,
} from "../storage";
import { Run, Segment, SharedTimerRef, TimerPhase } from "../livesplit-core";
import * as SplitsIO from "../util/SplitsIO";
import { toast } from "react-toastify";
import { openFileAsArrayBuffer, exportFile, convertFileToArrayBuffer } from "../util/FileUtil";
import { Option, maybeDisposeAndThen } from "../util/OptionUtil";
import * as Storage from "../storage";

import "../css/SplitsSelection.scss";
import DragUpload from "./DragUpload";
import { ContextMenuTrigger, ContextMenu, MenuItem } from "react-contextmenu";

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
}

interface Callbacks {
    openRunEditor(editingInfo: EditingInfo): void,
    setSplitsKey(newKey?: number): void,
    openTimerView(remount: boolean): void,
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
}

export class SplitsSelection extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.refreshDb();
        this.state = {};
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
                        <button onClick={() => this.importSplitsFromSplitsIO()}>
                            <i className="fa fa-download" aria-hidden="true" /> From Splits.io
                        </button>
                    </div>
                    <div className="splits-table">
                        <div className="splits-rows">
                            {
                                this.state.splitsInfos
                                    .map(([key, info]) => this.renderSavedSplitsRow(key, info))
                            }
                        </div>
                    </div>
                </div>
            );
        }
        return <DragUpload
            importSplits={this.importSplitsFromFile.bind(this)}
        >
            <div className="splits-selection">{content}</div>
        </DragUpload>;
    }

    private async refreshDb() {
        const splitsInfos = await getSplitsInfos();
        this.setState({
            splitsInfos,
        });
    }

    private renderSavedSplitsRow(key: number, info: SplitsInfo) {
        const isOpened = key === this.props.openedSplitsKey;

        const segmentIconContextMenuId = `splits-${key}-context-menu`;
        let exportContextTrigger: any = null;
        const exportButtonToggleMenu = (e: any) => {
            if (exportContextTrigger) {
                exportContextTrigger.handleContextClick(e);
            }
        };

        return (
            <div className={isOpened ? "splits-row selected" : "splits-row"} key={key}>
                {this.splitsTitle(info)}
                <div className="splits-row-buttons">
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
                                <button aria-label="Export Splits" onClick={(e) => exportButtonToggleMenu(e)}>
                                    <ContextMenuTrigger
                                        id={segmentIconContextMenuId}
                                        ref={(c) => exportContextTrigger = c}
                                    >
                                        <i className="fa fa-upload" aria-hidden="true" />
                                    </ContextMenuTrigger>
                                </button>
                                <ContextMenu id={segmentIconContextMenuId}>
                                    <MenuItem onClick={(_) => this.exportSplits(key, info)}>
                                        Export to File
                                    </MenuItem>
                                    <MenuItem onClick={(_) => this.uploadSplitsToSplitsIO(key)}>
                                        Upload to Splits.io
                                    </MenuItem>
                                </ContextMenu>
                            </>
                    }
                    <button aria-label="Copy Splits" onClick={() => this.copySplits(key)}>
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
                <div className="splits-text splits-game">{info.game || "Untitled"}</div>
                <div className="splits-text splits-category">{info.category || "—"}</div>
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
                <button onClick={(_) => this.saveSplits()}>
                    <i className="fa fa-save" aria-hidden="true" /> Save
                </button>
                <button onClick={(_) => this.exportTimerSplits()}>
                    <i className="fa fa-upload" aria-hidden="true" /> Export
                </button>
                <button onClick={(_) => this.uploadTimerToSplitsIO()}>
                    <i className="fa fa-upload" aria-hidden="true" /> Upload to Splits.io
                </button>
                <hr />
                <button onClick={(_) => this.props.callbacks.openTimerView(true)}>
                    <i className="fa fa-caret-left" aria-hidden="true" /> Back
                </button>
            </div>
        );
    }

    private async getRunFromKey(key: number): Promise<Run> {
        const splitsData = await loadSplits(key);
        if (splitsData === undefined) {
            throw Error("The splits key is invalid.");
        }

        return Run.parseArray(new Uint8Array(splitsData), "", false).with((result) => {
            if (result.parsedSuccessfully()) {
                return result.unwrap();
            } else {
                throw Error("Couldn't parse the splits.");
            }
        });
    }

    private async openSplits(key: number) {
        const isModified = this.props.timer.readWith((t) => t.getRun().hasBeenModified());
        if (isModified && !confirm(
            "Your current splits are modified and have unsaved changes. Do you want to continue and discard those changes?",
        )) {
            return;
        }

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

    private exportTimerSplits() {
        const [lss, name] = this.props.timer.writeWith((t) => {
            t.markAsUnmodified();
            const name = t.getRun().extendedFileName(true);
            const lss = t.saveAsLssBytes();
            return [lss, name];
        });
        try {
            exportFile(name + ".lss", lss);
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
        await this.refreshDb();
    }

    private async deleteSplits(key: number) {
        if (!confirm(
            "Are you sure you want to delete the splits? This operation can not be undone.",
        )) {
            return;
        }

        await deleteSplits(key);
        if (key === this.props.openedSplitsKey) {
            this.props.callbacks.setSplitsKey(undefined);
            storeSplitsKey(undefined);
        }
        await this.refreshDb();
    }

    private async importSplits() {
        const splits = await openFileAsArrayBuffer();
        try {
            await this.importSplitsFromArrayBuffer(splits);
        } catch (err) {
            toast.error(err.message);
        }
    }

    private async importSplitsFromFile(file: File) {
        const splits = await convertFileToArrayBuffer(file);
        this.importSplitsFromArrayBuffer(splits);
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

    private async saveSplits() {
        try {
            const openedSplitsKey = await Storage.storeSplits(
                (callback) => {
                    this.props.timer.writeWith((timer) => {
                        callback(timer.getRun(), timer.saveAsLssBytes());
                        timer.markAsUnmodified();
                    });
                },
                this.props.openedSplitsKey,
            );
            if (this.props.openedSplitsKey !== openedSplitsKey) {
                this.props.callbacks.setSplitsKey(openedSplitsKey);
            }
            this.refreshDb();
        } catch (_) {
            toast.error("Failed to save the splits.");
        }
    }

    private async uploadSplitsToSplitsIO(key: number): Promise<Option<Window>> {
        try {
            const splitsData = await loadSplits(key);
            if (splitsData === undefined) {
                throw Error("The splits key is invalid.");
            }

            const claimUri = await SplitsIO.uploadLss(new Blob([splitsData]));
            return window.open(claimUri);
        } catch (_) {
            toast.error("Failed to upload the splits.");
            return null;
        }
    }

    private async uploadTimerToSplitsIO(): Promise<Option<Window>> {
        const lss = this.props.timer.readWith((t) => t.saveAsLssBytes());

        try {
            const claimUri = await SplitsIO.uploadLss(new Blob([lss]));
            return window.open(claimUri);
        } catch (_) {
            toast.error("Failed to upload the splits.");
            return null;
        }
    }

    private async importSplitsFromSplitsIO() {
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
            await this.refreshDb();
        } finally {
            run.dispose();
        }
    }
}
