import * as React from "react";
import {
    getSplitsInfos, SplitsInfo, deleteSplits, copySplits, loadSplits,
    storeRunWithoutDisposing, storeSplitsKey,
} from "../storage";
import { Run, Segment, TimerPhase } from "../livesplit-core";
import * as SplitsIO from "../util/SplitsIO";
import { toast } from "react-toastify";
import { openFileAsArrayBuffer, exportFile, convertFileToArrayBuffer, FILE_EXT_SPLITS } from "../util/FileUtil";
import { Option, bug, maybeDisposeAndThen } from "../util/OptionUtil";
import DragUpload from "./DragUpload";
import { ContextMenuTrigger, ContextMenu, MenuItem } from "react-contextmenu";
import { GeneralSettings } from "./SettingsEditor";
import { LSOEventSink } from "./LSOEventSink";
import { showDialog } from "./Dialog";

import "../css/SplitsSelection.scss";

export interface EditingInfo {
    splitsKey?: number,
    run: Run,
}

export interface Props {
    eventSink: LSOEventSink,
    openedSplitsKey?: number,
    callbacks: Callbacks,
    generalSettings: GeneralSettings,
    splitsModified: boolean,
}

interface State {
    splitsInfos?: Array<[number, SplitsInfo]>,
}

interface Callbacks {
    openRunEditor(editingInfo: EditingInfo): void,
    setSplitsKey(newKey?: number): void,
    openTimerView(): void,
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
    saveSplits(): Promise<void>,
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
                        {
                            this.props.generalSettings.splitsIoIntegration && <button onClick={() => this.importSplitsFromSplitsIO()}>
                                <i className="fa fa-download" aria-hidden="true" /> From Splits.io
                            </button>
                        }
                    </div>
                    {
                        this.state.splitsInfos?.length > 0 &&
                        <div className="splits-table">
                            <div className="splits-rows">
                                {
                                    this.state.splitsInfos
                                        .map(([key, info]) => this.renderSavedSplitsRow(key, info))
                                }
                            </div>
                        </div>
                    }
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
                                    <MenuItem className="tooltip" onClick={(_) => this.exportSplits(key, info)}>
                                        Export to File
                                        <span className="tooltip-text">
                                            Export the splits to a file on your computer.
                                        </span>
                                    </MenuItem>
                                    {
                                        this.props.generalSettings.splitsIoIntegration && <MenuItem className="tooltip" onClick={(_) => this.uploadSplitsToSplitsIO(key)}>
                                            Upload to Splits.io
                                            <span className="tooltip-text">
                                                Upload the splits to splits.io.
                                            </span>
                                        </MenuItem>
                                    }
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
                    if (this.props.eventSink.currentPhase() !== TimerPhase.NotRunning) {
                        toast.error("You can't edit your run while the timer is running.");
                        return;
                    }
                    const run = this.props.eventSink.getRun().clone();
                    this.props.callbacks.openRunEditor({ run });
                }}>
                    <i className="fa fa-edit" aria-hidden="true" /> Edit
                </button>
                <button onClick={(_) => this.saveSplits()}>
                    <i className="fa fa-save" aria-hidden="true" /> Save
                    {
                        this.props.splitsModified &&
                        <i className="fa fa-circle modified-icon" aria-hidden="true" />
                    }
                </button>
                <button onClick={(_) => this.exportTimerSplits()}>
                    <i className="fa fa-upload" aria-hidden="true" /> Export
                </button>
                {
                    this.props.generalSettings.splitsIoIntegration && <button onClick={(_) => this.uploadTimerToSplitsIO()}>
                        <i className="fa fa-upload" aria-hidden="true" /> Upload to Splits.io
                    </button>
                }
                <hr />
                <button onClick={(_) => this.props.callbacks.openTimerView()}>
                    <i className="fa fa-caret-left" aria-hidden="true" /> Back
                </button>
            </div>
        );
    }

    private async getRunFromKey(key: number): Promise<Run | undefined> {
        const splitsData = await loadSplits(key);
        if (splitsData === undefined) {
            bug("The splits key is invalid.");
            return;
        }

        using result = Run.parseArray(new Uint8Array(splitsData), "");

        if (result.parsedSuccessfully()) {
            return result.unwrap();
        } else {
            bug("Couldn't parse the splits.");
            return;
        }
    }

    private async openSplits(key: number) {
        const isModified = this.props.eventSink.hasBeenModified();
        if (isModified) {
            const [result] = await showDialog({
                title: "Discard Changes?",
                description: "Your current splits are modified and have unsaved changes. Do you want to continue and discard those changes?",
                buttons: ["Yes", "No"],
            });
            if (result === 1) {
                return;
            }
        }

        using run = await this.getRunFromKey(key);
        if (run === undefined) {
            return;
        }
        maybeDisposeAndThen(
            this.props.eventSink.setRun(run),
            () => toast.error("The loaded splits are invalid."),
        );
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
        this.props.eventSink.markAsUnmodified();
        const name = this.props.eventSink.extendedFileName(true);
        const lss = this.props.eventSink.saveAsLssBytes();
        try {
            exportFile(name + ".lss", lss);
        } catch (_) {
            toast.error("Failed to export the splits.");
        }
    }

    private async editSplits(splitsKey: number) {
        const run = await this.getRunFromKey(splitsKey);
        if (run !== undefined) {
            this.props.callbacks.openRunEditor({ splitsKey, run });
        }
    }

    private async copySplits(key: number) {
        await copySplits(key);
        await this.refreshDb();
    }

    private async deleteSplits(key: number) {
        const [result] = await showDialog({
            title: "Delete Splits?",
            description: "Are you sure you want to delete the splits? This operation can not be undone.",
            buttons: ["Yes", "No"],
        });
        if (result !== 0) {
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
        const splits = await openFileAsArrayBuffer(FILE_EXT_SPLITS);
        if (splits === undefined) {
            return;
        }
        if (splits instanceof Error) {
            toast.error(`Failed to read the file: ${splits.message}`);
            return;
        }

        const result = await this.importSplitsFromArrayBuffer(splits);
        if (result != null) {
            toast.error(`Failed to import the splits: ${result.message}`);
        }
    }

    private async importSplitsFromFile(file: File) {
        const splits = await convertFileToArrayBuffer(file);
        if (splits instanceof Error) {
            toast.error(`Failed to read the file: ${splits.message}`);
            return;
        }

        const result = await this.importSplitsFromArrayBuffer(splits);
        if (result != null) {
            toast.error(`Failed to import the splits: ${result.message}`);
        }
    }

    private async importSplitsFromArrayBuffer(buffer: [ArrayBuffer, File]): Promise<Option<Error>> {
        const [file] = buffer;
        using result = Run.parseArray(new Uint8Array(file), "");
        if (result.parsedSuccessfully()) {
            await this.storeRun(result.unwrap());
        } else {
            return Error("Couldn't parse the splits.");
        }
        return;
    }

    private async saveSplits() {
        await this.props.callbacks.saveSplits();
        this.refreshDb();
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
        const lss = this.props.eventSink.saveAsLssBytes();

        try {
            const claimUri = await SplitsIO.uploadLss(new Blob([lss]));
            return window.open(claimUri);
        } catch (_) {
            toast.error("Failed to upload the splits.");
            return null;
        }
    }

    private async importSplitsFromSplitsIO() {
        const response = await showDialog({
            title: "Import Splits from Splits.io",
            description: "Specify the Splits.io URL or ID:",
            textInput: true,
            buttons: ["Import", "Cancel"],
        });
        const result = response[0];
        let id = response[1];

        if (result !== 0) {
            return;
        }
        if (id.indexOf("https://splits.io/") === 0) {
            id = id.substring("https://splits.io/".length);
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
            run[Symbol.dispose]();
        }
    }
}
