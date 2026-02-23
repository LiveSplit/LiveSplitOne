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
import { Language, Run, Segment, TimerPhase } from "../../livesplit-core";
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
import { Label, resolve } from "../../localization";
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

import classes from "../../css/SplitsSelection.module.css";
import sidebarClasses from "../../css/Sidebar.module.css";

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
    const lang = props.generalSettings.lang;
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
            toast.error(resolve(Label.FailedToExportSplits, lang));
        }
    };

    const openTimerView = () => {
        props.callbacks.openTimerView();
    };

    return props.callbacks.renderViewWithSidebar(
        <View
            {...props}
            splitsInfos={splitsInfos}
            refreshDb={refreshDb}
            lang={lang}
        />,
        <SideBar
            commandSink={props.commandSink}
            callbacks={props.callbacks}
            splitsModified={props.splitsModified}
            saveSplits={saveSplits}
            exportTimerSplits={exportTimerSplits}
            openTimerView={openTimerView}
            lang={lang}
        />,
    );
}

function View({
    commandSink,
    openedSplitsKey,
    callbacks,
    splitsInfos,
    refreshDb,
    lang,
}: {
    commandSink: LSOCommandSink;
    openedSplitsKey?: number;
    callbacks: Callbacks;
    splitsInfos?: Array<[number, SplitsInfo]>;
    refreshDb: () => Promise<void>;
    lang: Language | undefined;
}) {
    const storeRun = async (run: Run) => {
        try {
            if (run.len() === 0) {
                toast.error(resolve(Label.CantImportEmptySplits, lang));
                return;
            }
            await storeRunWithoutDisposing(run, undefined, lang);
            await refreshDb();
        } finally {
            run[Symbol.dispose]();
        }
    };

    const addNewSplits = async () => {
        const run = Run.new();
        run.pushSegment(Segment.new(resolve(Label.NewSegmentName, lang)));
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
            return Error(resolve(Label.CouldNotParseSplits, lang));
        }
        return;
    };

    const importSplits = async () => {
        const splits = await openFileAsArrayBuffer(FILE_EXT_SPLITS);
        if (splits === undefined) {
            return;
        }
        if (splits instanceof Error) {
            toast.error(
                `${resolve(Label.FailedToReadFile, lang)} ${splits.message}`,
            );
            return;
        }

        const result = await importSplitsFromArrayBuffer(splits);
        if (result != null) {
            toast.error(
                `${resolve(Label.FailedToImportSplits, lang)} ${result.message}`,
            );
        }
    };

    const importSplitsFromFile = async (file: File) => {
        const splits = await convertFileToArrayBuffer(file);
        if (splits instanceof Error) {
            toast.error(
                `${resolve(Label.FailedToReadFile, lang)} ${splits.message}`,
            );
            return;
        }

        const result = await importSplitsFromArrayBuffer(splits);
        if (result != null) {
            toast.error(
                `${resolve(Label.FailedToImportSplits, lang)} ${result.message}`,
            );
        }
    };

    const getRunFromKey = async (key: number): Promise<Run | undefined> => {
        const splitsData = await loadSplits(key);
        if (splitsData === undefined) {
            bug("The splits key is invalid.", lang);
            return;
        }

        using result = Run.parseArray(new Uint8Array(splitsData), "");

        if (result.parsedSuccessfully()) {
            return result.unwrap();
        } else {
            bug("Couldn't parse the splits.", lang);
            return;
        }
    };

    const openSplits = async (key: number) => {
        const isModified = commandSink.hasBeenModified();
        if (isModified) {
            const [result] = await showDialog({
                title: resolve(Label.DiscardChangesTitle, lang),
                description: resolve(Label.DiscardChangesDescription, lang),
                buttons: [resolve(Label.Yes, lang), resolve(Label.No, lang)],
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
            toast.error(resolve(Label.LoadedSplitsInvalid, lang)),
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
            toast.error(resolve(Label.FailedToExportSplits, lang));
        }
    };

    const copySplits = async (key: number) => {
        await storageCopySplits(key);
        await refreshDb();
    };

    const deleteSplits = async (key: number) => {
        const [result] = await showDialog({
            title: resolve(Label.DeleteSplitsTitle, lang),
            description: resolve(Label.DeleteSplitsDescription, lang),
            buttons: [resolve(Label.Yes, lang), resolve(Label.No, lang)],
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
                <div className={classes.loadingText}>
                    {resolve(Label.Loading, lang)}
                </div>
            </div>
        );
    } else {
        content = (
            <div className={classes.splitsSelectionContainer}>
                <div className={classes.mainActions}>
                    <button onClick={addNewSplits}>
                        <Plus strokeWidth={2.5} />
                        {resolve(Label.Add, lang)}
                    </button>
                    <button onClick={importSplits}>
                        <Download strokeWidth={2.5} />
                        {resolve(Label.Import, lang)}
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
                                lang={lang}
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
    lang,
}: {
    openedSplitsKey?: number;
    splitsKey: number;
    info: SplitsInfo;
    openSplits: (key: number) => void;
    editSplits: (key: number) => void;
    exportSplits: (key: number, info: SplitsInfo) => void;
    copySplits: (key: number) => void;
    deleteSplits: (key: number) => void;
    lang: Language | undefined;
}) {
    const isOpened = splitsKey === openedSplitsKey;
    const classNames = [classes.splitsRow];
    if (isOpened) {
        classNames.push(classes.selected);
    }

    return (
        <div className={classNames.join(" ")} key={splitsKey}>
            <SplitsTitle
                game={info.game}
                category={info.category}
                lang={lang}
            />
            <div className={classes.splitsRowButtons}>
                {isOpened ? null : (
                    <>
                        <button
                            aria-label={resolve(Label.OpenSplits, lang)}
                            onClick={() => openSplits(splitsKey)}
                        >
                            <FolderOpen strokeWidth={2.5} />
                        </button>
                        <button
                            aria-label={resolve(Label.EditSplits, lang)}
                            onClick={() => editSplits(splitsKey)}
                        >
                            <SquarePen strokeWidth={2.5} />
                        </button>
                        <button
                            aria-label={resolve(Label.ExportSplits, lang)}
                            onClick={() => exportSplits(splitsKey, info)}
                        >
                            <Upload strokeWidth={2.5} />
                        </button>
                    </>
                )}
                <button
                    aria-label={resolve(Label.CopySplits, lang)}
                    onClick={() => copySplits(splitsKey)}
                >
                    <Copy strokeWidth={2.5} />
                </button>
                <button
                    aria-label={resolve(Label.RemoveSplits, lang)}
                    onClick={() => deleteSplits(splitsKey)}
                >
                    <Trash strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}

function SplitsTitle({
    game,
    category,
    lang,
}: {
    game: string;
    category: string;
    lang: Language | undefined;
}) {
    return (
        <div className={classes.splitsTitleText}>
            <div className={`${classes.splitsText} ${classes.splitsGame}`}>
                {game || resolve(Label.Untitled, lang)}
            </div>
            <div className={classes.splitsText}>
                {category || resolve(Label.NoCategory, lang)}
            </div>
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
    lang,
}: {
    commandSink: LSOCommandSink;
    callbacks: any;
    splitsModified: boolean;
    saveSplits: () => void;
    exportTimerSplits: () => void;
    openTimerView: () => void;
    lang: Language | undefined;
}) {
    return (
        <>
            <h1>{resolve(Label.Splits, lang)}</h1>
            <hr />
            <button
                onClick={(_) => {
                    if (commandSink.currentPhase() !== TimerPhase.NotRunning) {
                        toast.error(resolve(Label.EditWhileRunningError, lang));
                        return;
                    }
                    const run = commandSink.getRun().clone();
                    callbacks.openRunEditor({ run });
                }}
            >
                <SquarePen strokeWidth={2.5} />
                {resolve(Label.Edit, lang)}
            </button>
            <button onClick={saveSplits}>
                <Save strokeWidth={2.5} />
                <span>
                    {resolve(Label.Save, lang)}
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
                <Upload strokeWidth={2.5} />
                {resolve(Label.Export, lang)}
            </button>
            <hr />
            <button onClick={openTimerView}>
                <ArrowLeft strokeWidth={2.5} />
                {resolve(Label.Back, lang)}
            </button>
        </>
    );
}
