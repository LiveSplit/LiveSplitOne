import * as React from "react";
import {
    getSplitsInfos, SplitsInfo, deleteSplits, copySplits, loadSplits,
    storeRunWithoutDisposing, storeSplitsKey,
} from "../storage";
import { Run, Segment, TimerPhase } from "../livesplit-core";
import { toast } from "react-toastify";
import { openFileAsArrayBuffer, exportFile, convertFileToArrayBuffer, FILE_EXT_SPLITS } from "../util/FileUtil";
import { Option, bug, maybeDisposeAndThen } from "../util/OptionUtil";
import DragUpload from "./DragUpload";
import { GeneralSettings } from "./MainSettings";
import { LSOCommandSink } from "./LSOCommandSink";
import { showDialog } from "./Dialog";
import { ArrowLeft, Circle, Copy, Download, FolderOpen, Plus, Save, SquarePen, Trash, Upload } from "lucide-react";

import "../css/SplitsSelection.scss";

export interface EditingInfo {
    splitsKey?: number,
    run: Run,
}

export interface Props {
    commandSink: LSOCommandSink,
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
    renderViewWithSidebar(renderedView: React.JSX.Element, sidebarContent: React.JSX.Element): React.JSX.Element,
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
                    <div className="loading-text">Loading...</div>
                </div>
            );
        } else {
            content = (
                <div className="splits-selection-container">
                    <div className="main-actions">
                        <button onClick={() => this.addNewSplits()}>
                            <Plus strokeWidth={2.5} /> Add
                        </button>
                        <button onClick={() => this.importSplits()}>
                            <Download strokeWidth={2.5} /> Import
                        </button>
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

        return (
            <div className={isOpened ? "splits-row selected" : "splits-row"} key={key}>
                {this.splitsTitle(info)}
                <div className="splits-row-buttons">
                    {
                        isOpened
                            ? null
                            : <>
                                <button aria-label="Open Splits" onClick={() => this.openSplits(key)}>
                                    <FolderOpen strokeWidth={2.5} />
                                </button>
                                <button aria-label="Edit Splits" onClick={() => this.editSplits(key)}>
                                    <SquarePen strokeWidth={2.5} />
                                </button>
                                <button aria-label="Export Splits" onClick={() => this.exportSplits(key, info)}>
                                    <Upload strokeWidth={2.5} />
                                </button>
                            </>
                    }
                    <button aria-label="Copy Splits" onClick={() => this.copySplits(key)}>
                        <Copy strokeWidth={2.5} />
                    </button>
                    <button aria-label="Remove Splits" onClick={() => this.deleteSplits(key)}>
                        <Trash strokeWidth={2.5} />
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
                    if (this.props.commandSink.currentPhase() !== TimerPhase.NotRunning) {
                        toast.error("You can't edit your splits while the timer is running.");
                        return;
                    }
                    const run = this.props.commandSink.getRun().clone();
                    this.props.callbacks.openRunEditor({ run });
                }}>
                    <SquarePen strokeWidth={2.5} /> Edit
                </button>
                <button onClick={(_) => this.saveSplits()}>
                    <Save strokeWidth={2.5} />
                    <span>
                        Save
                        {
                            this.props.splitsModified &&
                                <Circle strokeWidth={0} size={12} fill="currentColor" className="modified-icon" />
                        }
                    </span>
                </button>
                <button onClick={(_) => this.exportTimerSplits()}>
                    <Upload strokeWidth={2.5} /> Export
                </button>
                <hr />
                <button onClick={(_) => this.props.callbacks.openTimerView()}>
                    <ArrowLeft strokeWidth={2.5} /> Back
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
        const isModified = this.props.commandSink.hasBeenModified();
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
            this.props.commandSink.setRun(run),
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
        this.props.commandSink.markAsUnmodified();
        const name = this.props.commandSink.extendedFileName(true);
        const lss = this.props.commandSink.saveAsLssBytes();
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
