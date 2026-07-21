import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ArrowLeft, Clipboard, Download, ListVideo, Scissors } from "lucide-react";

import { Run, RunRef, TimingMethod } from "../../livesplit-core";
import { TextBox } from "../components/TextBox";
import { exportFile } from "../../util/FileUtil";
import {
    buildRows,
    buildSelectionEntries,
    chooseTimingMethod,
    formatFps,
    parseYoutubeOffset,
    resolveLosslessCutOffset,
    rowsToFramesCsv,
    rowsToYoutube,
    CsvSource,
} from "../../util/ShareTimes";

import classes from "../../css/ShareTimes.module.css";

type Tab = "youtube" | "losslesscut";

export interface ShareTimesInfo {
    splitsKey?: number;
    run: Run;
}

interface Callbacks {
    renderViewWithSidebar(
        renderedView: React.JSX.Element,
        sidebarContent: React.JSX.Element,
    ): React.JSX.Element;
    closeShareTimes(): void;
}

export function ShareTimes({
    run,
    callbacks,
}: {
    run: RunRef;
    callbacks: Callbacks;
}) {
    const [tab, setTab] = useState<Tab>("youtube");
    return callbacks.renderViewWithSidebar(
        <View run={run} tab={tab} />,
        <SideBar tab={tab} setTab={setTab} callbacks={callbacks} />,
    );
}

function View({ run, tab }: { run: RunRef; tab: Tab }) {
    const method = useMemo(() => chooseTimingMethod(run), [run]);
    const entries = useMemo(
        () => buildSelectionEntries(run, method),
        [run, method],
    );

    const [selectedValue, setSelectedValue] = useState(
        () => entries[0]?.value ?? "",
    );

    const source: CsvSource | undefined = useMemo(
        () => entries.find((e) => e.value === selectedValue)?.source,
        [entries, selectedValue],
    );

    const runSelector = (
        <div className={classes.field}>
            <span className={classes.label}>Run / Time</span>
            <select
                className={classes.runSelect}
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
            >
                {entries.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                        {entry.label}
                    </option>
                ))}
            </select>
        </div>
    );

    const timingMethod = (
        <div
            className={`${classes.timingMethod}${
                method === TimingMethod.GameTime ? "" : ` ${classes.hidden}`
            }`}
        >
            Timing method:{" "}
            {method === TimingMethod.GameTime ? "Game Time" : "Real Time"}
        </div>
    );

    return (
        <div className={classes.shareTimes}>
            <div className={classes.form}>
                {runSelector}
                {tab === "youtube" ? (
                    <YoutubeTab
                        run={run}
                        source={source}
                        method={method}
                        timingMethod={timingMethod}
                    />
                ) : (
                    <LosslessCutTab
                        run={run}
                        source={source}
                        method={method}
                        timingMethod={timingMethod}
                    />
                )}
            </div>
        </div>
    );
}

function YoutubeTab({
    run,
    source,
    method,
    timingMethod,
}: {
    run: RunRef;
    source: CsvSource | undefined;
    method: TimingMethod;
    timingMethod: React.JSX.Element;
}) {
    const [offsetInput, setOffsetInput] = useState("");
    const offset = useMemo(() => parseYoutubeOffset(offsetInput), [offsetInput]);

    const youtube = useMemo(() => {
        if (source === undefined || !offset.valid) {
            return { text: "", adjusted: false };
        }
        return rowsToYoutube(
            buildRows(run, source, method, offset.offsetSeconds),
        );
    }, [run, source, method, offset]);

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(youtube.text);
            toast.success("Copied to clipboard.");
        } catch {
            toast.error("Failed to copy to the clipboard.");
        }
    };

    return (
        <>
            <div className={classes.field}>
                <TextBox
                    label="Start Time Offset"
                    placeholder="e.g. 1:23 or 1:02:03"
                    value={offsetInput}
                    invalid={!offset.valid}
                    onChange={(e) => setOffsetInput(e.target.value)}
                />
                {!offset.valid && (
                    <span className={classes.error}>
                        The offset couldn't be parsed.
                    </span>
                )}
            </div>

            {timingMethod}

            <div className={classes.youtube}>
                <textarea
                    className={classes.youtubeText}
                    readOnly
                    rows={14}
                    value={youtube.text}
                    onFocus={(e) => e.target.select()}
                />
                <button className={classes.copyButton} onClick={onCopy}>
                    <Clipboard strokeWidth={2.5} />
                    Copy to Clipboard
                </button>
                {youtube.adjusted && (
                    <span className={classes.warning}>
                        Some chapters were dropped to conform to YouTube's
                        chapter format (unique start times, at least 10 seconds
                        apart).
                    </span>
                )}
            </div>
        </>
    );
}

function LosslessCutTab({
    run,
    source,
    method,
    timingMethod,
}: {
    run: RunRef;
    source: CsvSource | undefined;
    method: TimingMethod;
    timingMethod: React.JSX.Element;
}) {
    const [offsetInput, setOffsetInput] = useState("");
    const [fpsInput, setFpsInput] = useState("");

    const offset = useMemo(
        () => resolveLosslessCutOffset(offsetInput, fpsInput),
        [offsetInput, fpsInput],
    );

    const canDownload =
        source !== undefined && offset.error === null && offset.fps !== null;

    const fpsFieldValue =
        offset.fpsDerived && offset.fps !== null
            ? formatFps(offset.fps)
            : fpsInput;

    const onDownload = () => {
        if (source === undefined || offset.fps === null) {
            return;
        }
        const rows = buildRows(run, source, method, offset.offsetSeconds);
        const baseName = run.extendedFileName(true) || "splits";
        try {
            exportFile(`${baseName}.csv`, rowsToFramesCsv(rows, offset.fps));
        } catch {
            toast.error("Failed to export the CSV.");
        }
    };

    return (
        <>
            <div className={classes.field}>
                <div className={classes.offsetRow}>
                    <div className={classes.offsetCell}>
                        <TextBox
                            label="Frame Offset"
                            placeholder="00:17:39.0731777"
                            value={offsetInput}
                            invalid={offset.error !== null}
                            onChange={(e) => setOffsetInput(e.target.value)}
                        />
                    </div>
                    <div className={classes.fpsCell}>
                        <TextBox
                            label="FPS"
                            placeholder="60"
                            value={fpsFieldValue}
                            disabled={offset.fpsDerived}
                            onChange={(e) => setFpsInput(e.target.value)}
                        />
                    </div>
                </div>
                {offset.error !== null && (
                    <span className={classes.error}>{offset.error}</span>
                )}
                {offset.warnings.map((warning, i) => (
                    <span key={i} className={classes.warning}>
                        {warning}
                    </span>
                ))}
            </div>

            {timingMethod}

            <div className={classes.buttons}>
                <button disabled={!canDownload} onClick={onDownload}>
                    <Download strokeWidth={2.5} />
                    Download Frame numbers (CSV)
                </button>
            </div>
        </>
    );
}

function SideBar({
    tab,
    setTab,
    callbacks,
}: {
    tab: Tab;
    setTab: (tab: Tab) => void;
    callbacks: Callbacks;
}) {
    return (
        <>
            <h1>Share Times</h1>
            <hr />
            <button
                className={tab === "youtube" ? classes.activeTab : undefined}
                onClick={() => setTab("youtube")}
            >
                <ListVideo strokeWidth={2.5} />
                YouTube Chapters
            </button>
            <button
                className={tab === "losslesscut" ? classes.activeTab : undefined}
                onClick={() => setTab("losslesscut")}
            >
                <Scissors strokeWidth={2.5} />
                LosslessCut
            </button>
            <hr />
            <button onClick={() => callbacks.closeShareTimes()}>
                <ArrowLeft strokeWidth={2.5} />
                Back
            </button>
        </>
    );
}
