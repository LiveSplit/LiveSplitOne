import React, { useState, useEffect } from "react";
import {
    getSplitsInfos,
    SplitsInfo,
    deleteSplits as storageDeleteSplits,
    copySplits as storageCopySplits,
    loadSplits,
    storeRunWithoutDisposing,
    storeSplitsKey,
} from "../../storage";
import { Run, Segment, TimerPhase } from "../../livesplit-core";
import { toast } from "react-toastify";
import {
    openFileAsArrayBuffer,
    exportFile,
    convertFileToArrayBuffer,
    FILE_EXT_SPLITS,
} from "../../util/FileUtil";
import { Option, bug, maybeDisposeAndThen } from "../../util/OptionUtil";
import { DragUpload } from "../components/DragUpload";
import { GeneralSettings } from "./MainSettings";
import { LSOCommandSink } from "../../util/LSOCommandSink";
import { showDialog } from "../components/Dialog";
import {
    ArrowLeft,
    Circle,
    Copy,
    Download,
    FolderOpen,
    Plus,
    Save,
    SquarePen,
    Trash,
    Upload,
} from "lucide-react";

import * as classes from "../../css/SplitsSelection.module.scss";
import * as sidebarClasses from "../../css/Sidebar.module.scss";

export interface EditingInfo {
    splitsKey?: number;
    run: Run;
}

export interface Props {
    commandSink: LSOCommandSink;
    openedSplitsKey?: number;
    callbacks: Callbacks;
    generalSettings: GeneralSettings;
    splitsModified: boolean;
}

interface Callbacks {
    openRunEditor(editingInfo: EditingInfo): void;
    setSplitsKey(newKey?: number): void;
    openTimerView(): void;
    renderViewWithSidebar(
        renderedView: React.JSX.Element,
        sidebarContent: React.JSX.Element,
    ): React.JSX.Element;
    saveSplits(): Promise<void>;
}

export function SplitsSelection(props: Props) {
    const [splitsInfos, setSplitsInfos] = useState<
        Array<[number, SplitsInfo]> | undefined
    >();
    useEffect(() => {
        async function fetchSplitsInfos() {
            const splitsInfos = await getSplitsInfos();
            setSplitsInfos(splitsInfos);
        }
        fetchSplitsInfos();
    }, []);

    const refreshDb = async () => {
        const splitsInfos = await getSplitsInfos();
        setSplitsInfos(splitsInfos);
    };

    const saveSplits = async () => {
        await props.callbacks.saveSplits();
        refreshDb();
    };

    const exportTimerSplits = () => {
        props.commandSink.markAsUnmodified();
        const name = props.commandSink.extendedFileName(true);
        const lss = props.commandSink.saveAsLssBytes();
        try {
            exportFile(name + ".lss", lss);
        } catch (_) {
            toast.error("Failed to export the splits.");
        }
    };

    const openTimerView = () => {
        props.callbacks.openTimerView();
    };

    return props.callbacks.renderViewWithSidebar(
        <View
            commandSink={props.commandSink}
            openedSplitsKey={props.openedSplitsKey}
            callbacks={props.callbacks}
            splitsInfos={splitsInfos}
            refreshDb={refreshDb}
        />,
        <SideBar
            commandSink={props.commandSink}
            callbacks={props.callbacks}
            splitsModified={props.splitsModified}
            saveSplits={saveSplits}
            exportTimerSplits={exportTimerSplits}
            openTimerView={openTimerView}
        />,
    );
}

function View({
    commandSink,
    openedSplitsKey,
    callbacks,
    splitsInfos,
    refreshDb,
}: {
    commandSink: LSOCommandSink;
    openedSplitsKey?: number;
    callbacks: Callbacks;
    splitsInfos?: Array<[number, SplitsInfo]>;
    refreshDb: () => Promise<void>;
}) {
    const storeRun = async (run: Run) => {
        try {
            if (run.len() === 0) {
                toast.error("Can't import empty splits.");
                return;
            }
            await storeRunWithoutDisposing(run, undefined);
            await refreshDb();
        } finally {
            run[Symbol.dispose]();
        }
    };

    const addNewSplits = async () => {
        const run = Run.new();
        run.pushSegment(Segment.new("Time"));
        await storeRun(run);
    };

    const importSplitsFromArrayBuffer = async (
        buffer: [ArrayBuffer, File],
    ): Promise<Option<Error>> => {
        const [file] = buffer;
        using result = Run.parseArray(new Uint8Array(file), "");
        if (result.parsedSuccessfully()) {
            await storeRun(result.unwrap());
        } else {
            return Error("Couldn't parse the splits.");
        }
        return;
    };

    const importSplits = async () => {
        const splits = await openFileAsArrayBuffer(FILE_EXT_SPLITS);
        if (splits === undefined) {
            return;
        }
        if (splits instanceof Error) {
            toast.error(`Failed to read the file: ${splits.message}`);
            return;
        }

        const result = await importSplitsFromArrayBuffer(splits);
        if (result != null) {
            toast.error(`Failed to import the splits: ${result.message}`);
        }
    };

    const importSplitsFromFile = async (file: File) => {
        const splits = await convertFileToArrayBuffer(file);
        if (splits instanceof Error) {
            toast.error(`Failed to read the file: ${splits.message}`);
            return;
        }

        const result = await importSplitsFromArrayBuffer(splits);
        if (result != null) {
            toast.error(`Failed to import the splits: ${result.message}`);
        }
    };

    const getRunFromKey = async (key: number): Promise<Run | undefined> => {
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
    };

    const openSplits = async (key: number) => {
        const isModified = commandSink.hasBeenModified();
        if (isModified) {
            const [result] = await showDialog({
                title: "Discard Changes?",
                description:
                    "Your current splits are modified and have unsaved changes. Do you want to continue and discard those changes?",
                buttons: ["Yes", "No"],
            });
            if (result === 1) {
                return;
            }
        }

        using run = await getRunFromKey(key);
        if (run === undefined) {
            return;
        }
        maybeDisposeAndThen(commandSink.setRun(run), () =>
            toast.error("The loaded splits are invalid."),
        );
        callbacks.setSplitsKey(key);
    };

    const editSplits = async (key: number) => {
        const run = await getRunFromKey(key);
        if (run !== undefined) {
            callbacks.openRunEditor({ splitsKey: key, run });
        }
    };

    const exportSplits = async (key: number, info: SplitsInfo) => {
        try {
            const splitsData = await loadSplits(key);
            if (splitsData === undefined) {
                throw Error("The splits key is invalid.");
            }

            exportFile(`${info.game} - ${info.category}.lss`, splitsData);
        } catch (_) {
            toast.error("Failed to export the splits.");
        }
    };

    const copySplits = async (key: number) => {
        await storageCopySplits(key);
        await refreshDb();
    };

    const deleteSplits = async (key: number) => {
        const [result] = await showDialog({
            title: "Delete Splits?",
            description:
                "Are you sure you want to delete the splits? This operation can not be undone.",
            buttons: ["Yes", "No"],
        });
        if (result !== 0) {
            return;
        }

        await storageDeleteSplits(key);
        if (key === openedSplitsKey) {
            callbacks.setSplitsKey(undefined);
            storeSplitsKey(undefined);
        }
        await refreshDb();
    };

    let content;

    if (splitsInfos == null) {
        content = (
            <div className={classes.loading}>
                <div className={classes.loadingText}>Loading...</div>
            </div>
        );
    } else {
        content = (
            <div className={classes.splitsSelectionContainer}>
                <div className={classes.mainActions}>
                    <button onClick={addNewSplits}>
                        <Plus strokeWidth={2.5} /> Add
                    </button>
                    <button onClick={importSplits}>
                        <Download strokeWidth={2.5} /> Import
                    </button>
                </div>
                {splitsInfos?.length > 0 && (
                    <div className={classes.splitsTable}>
                        {splitsInfos.map(([key, info]) => (
                            <SavedSplitsRow
                                openedSplitsKey={openedSplitsKey}
                                splitsKey={key}
                                info={info}
                                openSplits={openSplits}
                                editSplits={editSplits}
                                exportSplits={exportSplits}
                                copySplits={copySplits}
                                deleteSplits={deleteSplits}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }
    return (
        <DragUpload importSplits={importSplitsFromFile}>{content}</DragUpload>
    );
}

function SavedSplitsRow({
    openedSplitsKey,
    splitsKey,
    info,
    openSplits,
    editSplits,
    exportSplits,
    copySplits,
    deleteSplits,
}: {
    openedSplitsKey?: number;
    splitsKey: number;
    info: SplitsInfo;
    openSplits: (key: number) => void;
    editSplits: (key: number) => void;
    exportSplits: (key: number, info: SplitsInfo) => void;
    copySplits: (key: number) => void;
    deleteSplits: (key: number) => void;
}) {
    const isOpened = splitsKey === openedSplitsKey;
    const classNames = [classes.splitsRow];
    if (isOpened) {
        classNames.push(classes.selected);
    }

    return (
        <div className={classNames.join(" ")} key={splitsKey}>
            <SplitsTitle game={info.game} category={info.category} />
            <div className={classes.splitsRowButtons}>
                {isOpened ? null : (
                    <>
                        <button
                            aria-label="Open Splits"
                            onClick={() => openSplits(splitsKey)}
                        >
                            <FolderOpen strokeWidth={2.5} />
                        </button>
                        <button
                            aria-label="Edit Splits"
                            onClick={() => editSplits(splitsKey)}
                        >
                            <SquarePen strokeWidth={2.5} />
                        </button>
                        <button
                            aria-label="Export Splits"
                            onClick={() => exportSplits(splitsKey, info)}
                        >
                            <Upload strokeWidth={2.5} />
                        </button>
                    </>
                )}
                <button
                    aria-label="Copy Splits"
                    onClick={() => copySplits(splitsKey)}
                >
                    <Copy strokeWidth={2.5} />
                </button>
                <button
                    aria-label="Remove Splits"
                    onClick={() => deleteSplits(splitsKey)}
                >
                    <Trash strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}

function SplitsTitle({ game, category }: { game: string; category: string }) {
    return (
        <div className={classes.splitsTitleText}>
            <div className={`${classes.splitsText} ${classes.splitsGame}`}>
                {game || "Untitled"}
            </div>
            <div className={classes.splitsText}>{category || "—"}</div>
        </div>
    );
}

function SideBar({
    commandSink,
    callbacks,
    splitsModified,
    saveSplits,
    exportTimerSplits,
    openTimerView,
}: {
    commandSink: LSOCommandSink;
    callbacks: any;
    splitsModified: boolean;
    saveSplits: () => void;
    exportTimerSplits: () => void;
    openTimerView: () => void;
}) {
    return (
        <>
            <h1>Splits</h1>
            <hr />
            <button
                onClick={(_) => {
                    if (commandSink.currentPhase() !== TimerPhase.NotRunning) {
                        toast.error(
                            "You can't edit your splits while the timer is running.",
                        );
                        return;
                    }
                    const run = commandSink.getRun().clone();
                    callbacks.openRunEditor({ run });
                }}
            >
                <SquarePen strokeWidth={2.5} /> Edit
            </button>
            <button onClick={saveSplits}>
                <Save strokeWidth={2.5} />
                <span>
                    Save
                    {splitsModified && (
                        <Circle
                            strokeWidth={0}
                            size={12}
                            fill="currentColor"
                            className={sidebarClasses.modifiedIcon}
                        />
                    )}
                </span>
            </button>
            <button onClick={exportTimerSplits}>
                <Upload strokeWidth={2.5} /> Export
            </button>
            <hr />
            <button onClick={openTimerView}>
                <ArrowLeft strokeWidth={2.5} /> Back
            </button>
        </>
    );
}
